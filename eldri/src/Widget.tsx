import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Search, RefreshCw, Layers, Star, Copy } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { register } from '@tauri-apps/plugin-global-shortcut';
import { AppStorage, AppSettings } from './utils/storage';

interface StreamErrorState {
  hasError: boolean;
  message: string;
}

function resolveGatewayUrl(provider: AppSettings['provider']): string {
  switch (provider) {
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/v1/chat/completions';
    case 'groq':
      return 'https://api.groq.com/openai/v1/chat/completions';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    default:
      return 'https://api.openai.com/v1/chat/completions';
  }
}

function parseResponseSegments(text: string, isLight: boolean) {
  const components: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let matchResult;
  let lastIndex = 0;

  while ((matchResult = codeBlockRegex.exec(text)) !== null) {
    if (matchResult.index > lastIndex) {
      components.push(
        <p key={`text-${lastIndex}`} className={`text-xs leading-relaxed mb-2 whitespace-pre-wrap ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
          {text.substring(lastIndex, matchResult.index)}
        </p>
      );
    }

    const language = matchResult[1] || 'code';
    const codeSnippet = matchResult[2];

    components.push(
      <div key={`code-${matchResult.index}`} className={`my-2 rounded-lg border overflow-hidden font-mono text-[11px] ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-[#333333] bg-[#111116]'}`}>
        <div className={`flex items-center justify-between px-3 py-1 text-[10px] ${isLight ? 'bg-zinc-100 text-zinc-500' : 'bg-[#1A1A22] text-zinc-400'}`}>
          <span>{language.toUpperCase()}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(codeSnippet)}
            className="hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            <Copy size={10} /> Copy
          </button>
        </div>
        <pre className={`p-2 overflow-x-auto whitespace-pre-wrap ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
          <code>{codeSnippet}</code>
        </pre>
      </div>
    );
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    components.push(
      <p key={`text-${lastIndex}`} className={`text-xs leading-relaxed whitespace-pre-wrap ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
        {text.substring(lastIndex)}
      </p>
    );
  }

  return components;
}

export default function Widget() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [errorStatus, setErrorStatus] = useState<StreamErrorState>({ hasError: false, message: '' });
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState('Code Reviewer');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [config, setConfig] = useState(AppStorage.getSettings());

  const bottomRef = useRef<HTMLDivElement>(null);
  const accumulatorBufferRef = useRef('');

  useEffect(() => {
    const reload = () => setConfig(AppStorage.getSettings());
    window.addEventListener('storage', reload);
    return () => window.removeEventListener('storage', reload);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [response, screenshotPreview]);

  const streamVisionPayload = useCallback(async (
    base64Image: string,
    apiKey: string,
    provider: AppSettings['provider'],
    model: string,
    promptText: string,
    mode: string,
  ) => {
    const endpoint = resolveGatewayUrl(provider);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const connection = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: 'system', content: AppStorage.getSystemPrompt(mode) },
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText || 'Review this active screen grid context.' },
                { type: 'image_url', image_url: { url: base64Image } },
              ],
            },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!connection.ok) {
        throw new Error(`HTTP target rejected pipeline access: ${connection.status} ${connection.statusText}`);
      }
      if (!connection.body) {
        throw new Error('Target response transmission stream is unreadable.');
      }

      const reader = connection.body.getReader();
      const decoder = new TextDecoder('utf-8');
      accumulatorBufferRef.current = '';
      let finishedString = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatorBufferRef.current += decoder.decode(value, { stream: true });
        const textLines = accumulatorBufferRef.current.split('\n');
        accumulatorBufferRef.current = textLines.pop() || '';

        for (const processingLine of textLines) {
          const formattedLine = processingLine.trim();
          if (!formattedLine || !formattedLine.startsWith('data:')) continue;

          const jsonContentStr = formattedLine.replace(/^data:\s*/, '').trim();
          if (jsonContentStr === '[DONE]') continue;

          try {
            const parsedDataChunk = JSON.parse(jsonContentStr);
            const incrementalToken = parsedDataChunk.choices?.[0]?.delta?.content || '';
            finishedString += incrementalToken;
            setResponse(finishedString);
          } catch {
            accumulatorBufferRef.current = `${processingLine}\n${accumulatorBufferRef.current}`;
          }
        }
      }

      if (finishedString) {
        AppStorage.addSession({
          mode,
          query: promptText || 'Standard Workspace Target Scan',
          response: finishedString,
          screenshot: base64Image,
        });
      }
    } catch (networkErr: unknown) {
      const err = networkErr as { name?: string; message?: string };
      const errorMsg = err.name === 'AbortError'
        ? 'Pipeline execution timed out. Check network connection routing layers.'
        : err.message || 'Unknown proxy transmission failure.';
      setErrorStatus({ hasError: true, message: errorMsg });
      throw networkErr;
    }
  }, []);

  const triggerVisionEngine = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setResponse('');
    setErrorStatus({ hasError: false, message: '' });
    setScreenshotPreview(null);

    try {
      const base64Image = await invoke<string>('capture_screen');
      setScreenshotPreview(base64Image);

      const activeProvider = AppStorage.getActiveProvider();
      const activeModel = AppStorage.getActiveModel();

      const secureApiKey = await invoke<string>('get_secure_key', { provider: activeProvider });
      if (!secureApiKey) {
        throw new Error('Missing active profile authorization token. Update Configuration Profile.');
      }

      await streamVisionPayload(
        base64Image,
        secureApiKey,
        activeProvider,
        activeModel,
        userInput,
        currentMode,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed workspace execution.';
      setErrorStatus((prev) => prev.hasError ? prev : { hasError: true, message });
      console.error('Vision routing loop broken:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, userInput, currentMode, streamVisionPayload]);

  useEffect(() => {
    const initShortcut = async () => {
      try {
        await register('Alt+Space', () => {
          triggerVisionEngine();
        });
      } catch (err) {
        console.error('Hotkey subscription failed:', err);
      }
    };
    initShortcut();
  }, [triggerVisionEngine]);

  const isLight = config.theme === 'light';
  const parsedSegments = response ? parseResponseSegments(response, isLight) : null;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-start bg-transparent p-4 font-sans antialiased overflow-hidden select-none transition-colors duration-200">
      <div
        data-tauri-drag-region
        className={`flex items-center gap-1.5 p-1.5 pr-2.5 backdrop-blur-3xl rounded-full border shadow-xl mb-4 cursor-move shrink-0 z-50 ${
          isLight ? 'bg-white/95 text-zinc-800 border-zinc-200' : 'bg-[#16161A]/95 text-white border-[#333333]/50'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
        <div data-tauri-drag-region className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-serif italic font-bold text-sm shrink-0">e</div>
        <p data-tauri-drag-region className={`text-[10px] font-extrabold uppercase tracking-widest px-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Eldri Vision</p>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${isLight ? 'text-zinc-400 border-zinc-200 bg-zinc-50' : 'text-zinc-500 border-[#333333] bg-[#111116]'}`}>Alt+Space</span>
      </div>

      <div className={`w-full flex-1 flex flex-col rounded-2xl border shadow-2xl p-3 relative overflow-hidden transition-all ${
        isLight ? 'bg-white border-zinc-200' : 'bg-[#16161A] border-[#333333]/70'
      }`}>
        <div data-tauri-drag-region className="w-full h-1.5 cursor-move shrink-0" />

        <div className="flex-1 overflow-y-auto mb-3 pr-1 flex flex-col gap-2">
          {errorStatus.hasError ? (
            <div className={`rounded-lg p-2.5 border ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-950/40 border-red-800/50'}`}>
              <p className={`text-xs font-semibold mb-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Stream Instability Alert</p>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-red-500' : 'text-red-300/90'}`}>{errorStatus.message}</p>
            </div>
          ) : response || screenshotPreview ? (
            <div className="flex flex-col gap-3">
              {parsedSegments && <div className="px-1 animate-in fade-in duration-200">{parsedSegments}</div>}
              {screenshotPreview && (
                <div className={`rounded-xl overflow-hidden border max-h-36 relative bg-black/10 shadow-inner shrink-0 ${
                  isLight ? 'border-zinc-200' : 'border-[#333333]'
                }`}>
                  <img src={screenshotPreview} alt="Desktop capture" className="w-full h-full object-cover" />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div data-tauri-drag-region className="flex-1 flex flex-col items-center justify-center text-center p-6 cursor-move">
              <Target size={26} className="mb-2 text-purple-500 opacity-60 animate-pulse" />
              <p className={`text-[10px] font-bold tracking-widest uppercase ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>System Capture Standby</p>
            </div>
          )}
        </div>

        <div className={`flex justify-between items-center pb-2.5 mb-2.5 border-b gap-2 shrink-0 relative z-40 ${
          isLight ? 'border-zinc-100' : 'border-[#333333]/60'
        }`}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 p-1.5 px-2.5 border rounded-xl text-[11px] font-bold transition-all ${
                isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100' : 'bg-[#22222A] border-[#333333] text-zinc-300 hover:bg-[#2D2D3D]'
              }`}
            >
              <Layers size={12} className="text-purple-500" />
              {currentMode}
            </button>

            {isDropdownOpen && (
              <div className={`absolute bottom-full left-0 mb-1 w-40 border rounded-xl shadow-2xl overflow-hidden py-1 ${
                isLight ? 'bg-white border-zinc-200' : 'bg-[#16161E] border-[#333333]'
              }`}>
                {['Code Reviewer', 'Interview Helper', 'Exam Solver'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setCurrentMode(mode);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isLight ? 'text-zinc-600 hover:bg-zinc-50 hover:text-purple-600' : 'text-zinc-400 hover:bg-purple-600/20 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={triggerVisionEngine}
            disabled={isAnalyzing}
            className="flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-400 disabled:opacity-40 transition-colors"
          >
            <Star size={12} fill="currentColor" /> Analyze
          </button>
        </div>

        <div className={`p-1.5 rounded-xl border flex items-center shadow-md gap-2 shrink-0 ${
          isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-[#111116] border-[#333333]/80'
        }`}>
          <Search size={14} className="ml-1 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a question or focus criteria..."
            className={`flex-1 bg-transparent text-xs outline-none p-1 font-semibold ${isLight ? 'text-zinc-800 placeholder:text-zinc-300' : 'text-zinc-100 placeholder:text-zinc-700'}`}
            onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && triggerVisionEngine()}
          />
          <button
            type="button"
            onClick={triggerVisionEngine}
            disabled={isAnalyzing}
            className={`p-2 rounded-lg transition-all ${
              isAnalyzing ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
            }`}
          >
            {isAnalyzing ? <RefreshCw size={12} className="animate-spin" /> : <Star size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}
