import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  Star,
  RotateCcw,
  Minus,
  Square,
  Copy,
  Loader2,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { register } from '@tauri-apps/plugin-global-shortcut';
import { AppStorage, AppSettings, SessionLog } from './utils/storage';
import { getThemeTokens, ThemeTokens } from './utils/themeTokens';
import { applyTheme } from './utils/theme';

interface StreamErrorState {
  hasError: boolean;
  message: string;
}

const MODES = ['Code Reviewer', 'Interview Helper', 'Exam Solver'] as const;

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

function parseResponseSegments(text: string, t: ThemeTokens) {
  const components: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let matchResult;
  let lastIndex = 0;

  while ((matchResult = codeBlockRegex.exec(text)) !== null) {
    if (matchResult.index > lastIndex) {
      components.push(
        <p key={`text-${lastIndex}`} className={`text-[13px] leading-relaxed mb-2 whitespace-pre-wrap ${t.textSecondary}`}>
          {text.substring(lastIndex, matchResult.index)}
        </p>
      );
    }

    const language = matchResult[1] || 'code';
    const codeSnippet = matchResult[2];

    components.push(
      <div key={`code-${matchResult.index}`} className={`my-2 rounded-lg border overflow-hidden font-mono text-[11px] ${t.card} ${t.cardBorder}`}>
        <div className={`flex items-center justify-between px-3 py-1 text-[10px] ${t.textMuted}`}>
          <span>{language.toUpperCase()}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(codeSnippet)}
            className="hover:text-purple-400 transition-colors flex items-center gap-1"
          >
            <Copy size={10} /> Copy
          </button>
        </div>
        <pre className={`p-2.5 overflow-x-auto whitespace-pre-wrap ${t.isDark ? 'text-emerald-400/90' : 'text-emerald-700'}`}>
          <code>{codeSnippet}</code>
        </pre>
      </div>
    );
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    components.push(
      <p key={`text-${lastIndex}`} className={`text-[13px] leading-relaxed whitespace-pre-wrap ${t.textSecondary}`}>
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
  const [currentMode, setCurrentMode] = useState<string>('Interview Helper');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [config, setConfig] = useState(AppStorage.getSettings());
  const [lastSession, setLastSession] = useState<SessionLog | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const accumulatorBufferRef = useRef('');

  useEffect(() => {
    const reload = () => setConfig(AppStorage.getSettings());
    window.addEventListener('storage', reload);
    return () => window.removeEventListener('storage', reload);
  }, []);

  useEffect(() => {
    const sessions = AppStorage.getSessions();
    setLastSession(sessions[0] ?? null);
  }, [response]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
  }, [response, isAnalyzing]);

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
    setIsPanelCollapsed(false);

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
      setErrorStatus((prev) => (prev.hasError ? prev : { hasError: true, message }));
      console.error('Vision routing loop broken:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, userInput, currentMode, streamVisionPayload]);

  const handleRecap = () => {
    if (!lastSession) return;
    setCurrentMode(lastSession.mode);
    setUserInput(lastSession.query);
    setResponse(lastSession.response);
    setScreenshotPreview(lastSession.screenshot ?? null);
    setErrorStatus({ hasError: false, message: '' });
    setIsPanelCollapsed(false);
  };

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().hide();
    } catch (err) {
      console.error('Minimize failed:', err);
    }
  };

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

  useEffect(() => {
    applyTheme(config.theme);
  }, [config.theme]);

  const t = getThemeTokens(config.theme);
  const parsedSegments = response ? parseResponseSegments(response, t) : null;
  const hasRecap = Boolean(lastSession);
  const showOutput = Boolean(response) || isAnalyzing || errorStatus.hasError;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-start bg-transparent p-3 font-sans antialiased overflow-hidden select-none transition-colors duration-200">
      <div
        data-tauri-drag-region
        className={`flex items-center gap-2 px-2 py-1.5 rounded-full border shadow-2xl mb-2 cursor-move shrink-0 backdrop-blur-xl ${t.widgetShell}`}
      >
        <div data-tauri-drag-region className={`w-7 h-7 rounded-full flex items-center justify-center font-serif italic font-bold text-sm shrink-0 ${t.logoBg} ${t.logoText}`}>
          e
        </div>

        <button
          type="button"
          onClick={handleMinimize}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${t.widgetWellHover}`}
        >
          <Minus size={12} strokeWidth={2.5} />
          Minimize
        </button>

        <button
          type="button"
          onClick={() => setIsPanelCollapsed((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors ${t.textMuted} hover:opacity-80`}
          title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <Square size={13} strokeWidth={2} />
        </button>
      </div>

      {!isPanelCollapsed && (
        <div className={`w-full flex-1 flex flex-col rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-all min-h-0 ${t.widgetPanel}`}>
          <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${t.widgetWell} ${t.text}`}
              >
                <SlidersHorizontal size={11} className={t.textMuted} />
                <span className="max-w-[110px] truncate">{currentMode}</span>
                <ChevronDown size={11} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 w-44 border rounded-xl shadow-2xl overflow-hidden py-1 z-50 ${t.card} ${t.cardBorder}`}>
                  {MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setCurrentMode(mode);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors ${
                        currentMode === mode ? `${t.navActive}` : `${t.navIdle}`
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={triggerVisionEngine}
                disabled={isAnalyzing}
                className={`flex items-center gap-1 text-[11px] font-semibold transition-all disabled:opacity-40 ${t.text} ${t.accent}`}
              >
                {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} strokeWidth={2} />}
                Analyse
              </button>

              <button
                type="button"
                onClick={handleRecap}
                disabled={!hasRecap || isAnalyzing}
                className={`flex items-center gap-1 text-[11px] font-medium transition-all disabled:opacity-30 ${t.textMuted}`}
              >
                <RotateCcw size={11} strokeWidth={2} />
                Recap
              </button>
            </div>
          </div>

          <div className={`mx-3 border-t ${t.divider}`} />

          <div className="flex-1 flex flex-col p-3 min-h-0">
            <div ref={contentRef} className={`flex-1 rounded-xl border overflow-y-auto p-3 min-h-[140px] transition-colors ${t.widgetWell}`}>
              {errorStatus.hasError ? (
                <div className={`rounded-lg p-2.5 border ${t.isDark ? 'bg-red-950/30 border-red-800/40' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-[11px] font-semibold mb-0.5 ${t.isDark ? 'text-red-400' : 'text-red-600'}`}>Stream error</p>
                  <p className={`text-[11px] leading-relaxed ${t.isDark ? 'text-red-300/90' : 'text-red-500'}`}>{errorStatus.message}</p>
                </div>
              ) : showOutput ? (
                <div className="space-y-2">
                  {isAnalyzing && !response && (
                    <div className={`flex items-center gap-2 text-[12px] ${t.textMuted}`}>
                      <Loader2 size={13} className="animate-spin" />
                      Capturing workspace…
                    </div>
                  )}
                  {parsedSegments}
                  {screenshotPreview && (
                    <div className={`mt-2 rounded-lg overflow-hidden border max-h-24 ${t.cardBorder}`}>
                      <img src={screenshotPreview} alt="Capture preview" className="w-full h-full object-cover opacity-90" />
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type something, or AI output appears here..."
                  className={`w-full h-full min-h-[120px] bg-transparent text-[13px] leading-relaxed resize-none outline-none ${t.text} ${t.isDark ? 'placeholder:text-zinc-500' : 'placeholder:text-gray-400'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isAnalyzing) {
                      e.preventDefault();
                      triggerVisionEngine();
                    }
                  }}
                />
              )}
            </div>

            {showOutput && !errorStatus.hasError && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border ${t.widgetWell}`}>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask a follow-up…"
                  className={`flex-1 bg-transparent text-[12px] outline-none ${t.textSecondary} ${t.isDark ? 'placeholder:text-zinc-500' : 'placeholder:text-gray-400'}`}
                  onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && triggerVisionEngine()}
                />
                <button
                  type="button"
                  onClick={() => {
                    setResponse('');
                    setScreenshotPreview(null);
                    setUserInput('');
                  }}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${t.textMuted} hover:opacity-80`}
                >
                  Clear
                </button>
              </div>
            )}

            <p className={`text-[9px] text-center mt-2 font-mono ${t.textMuted}`}>Alt + Space to analyse</p>
          </div>
        </div>
      )}
    </div>
  );
}
