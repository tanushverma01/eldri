import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  Square,
  Copy,
  Loader2,
  Mic,
  MicOff,
  Timer,
  X,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { AppStorage, AppSettings, SessionLog } from './utils/storage';
import { getThemeTokens, ThemeTokens } from './utils/themeTokens';
import { applyTheme } from './utils/theme';
import { useVoiceAnalysis } from './useVoiceAnalysis';

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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Widget() {
  const [config, setConfig] = useState(AppStorage.getSettings());
  const customModes = Object.keys(config.customPrompts);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [errorStatus, setErrorStatus] = useState<StreamErrorState>({ hasError: false, message: '' });
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<string>(customModes[0] || 'Interview Helper');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [lastSession, setLastSession] = useState<SessionLog | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const {
    transcript: voiceTranscript,
    isListening: isVoiceListening,
    voiceLevel,
    duration: voiceDuration,
    startListening,
    stopListening,
    clearTranscript,
    resetVoice,
  } = useVoiceAnalysis();

  const [isVoiceActive, setIsVoiceActive] = useState(false);

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

  // Sync spoken transcript to input field in real time
  useEffect(() => {
    if (isVoiceActive && voiceTranscript) {
      setUserInput(voiceTranscript);
    }
  }, [voiceTranscript, isVoiceActive]);

  // Auto-enable voice if mode demands it
  useEffect(() => {
    const modeConfig = AppStorage.getModeConfig(currentMode);
    const hasVoiceSource = modeConfig.inputSources?.includes('Voice Input');

    if (hasVoiceSource && !isVoiceActive) {
      startListening();
      setIsVoiceActive(true);
    } else if (!hasVoiceSource && isVoiceActive) {
      stopListening();
      setIsVoiceActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode]);

  const toggleVoice = useCallback(() => {
    if (isVoiceActive) {
      stopListening();
      setIsVoiceActive(false);
    } else {
      startListening();
      setIsVoiceActive(true);
    }
  }, [isVoiceActive, startListening, stopListening]);

  const streamVisionPayload = useCallback(async (
    base64Image: string,
    apiKey: string,
    provider: AppSettings['provider'],
    model: string,
    promptText: string,
    mode: string,
  ) => {
    const isAnthropic = provider === 'anthropic';
    const endpoint = isAnthropic ? 'https://api.anthropic.com/v1/messages' : resolveGatewayUrl(provider);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const systemPrompt = AppStorage.getSystemPrompt(mode);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      let body: any;

      if (isAnthropic) {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';

        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = base64Image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

        body = {
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Data,
                  },
                },
                {
                  type: 'text',
                  text: promptText ? `${systemPrompt}\n\n[Instruction]: ${promptText}` : `${systemPrompt}\n\n[Instruction]: Review this active screen capture context.`,
                },
              ],
            },
          ],
          max_tokens: 4096,
          stream: true,
        };
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
        body = {
          model,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText || 'Review this active screen grid context.' },
                { type: 'image_url', image_url: { url: base64Image } },
              ],
            },
          ],
          temperature: 0.1,
        };
      }

      const connection = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!connection.ok) {
        throw new Error(`API error: ${connection.status} ${connection.statusText}`);
      }
      if (!connection.body) {
        throw new Error('Response stream is unreadable.');
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
            let incrementalToken = '';
            if (isAnthropic) {
              if (parsedDataChunk.type === 'content_block_delta' && parsedDataChunk.delta?.text) {
                incrementalToken = parsedDataChunk.delta.text;
              }
            } else {
              incrementalToken = parsedDataChunk.choices?.[0]?.delta?.content || '';
            }
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
          provider,
          model,
          voiceTranscript: isVoiceActive ? voiceTranscript : undefined,
        });
      }
    } catch (networkErr: unknown) {
      const err = networkErr as { name?: string; message?: string };
      const errorMsg = err.name === 'AbortError'
        ? 'Request timed out. Check your network connection.'
        : err.message || 'Unknown error occurred.';
      setErrorStatus({ hasError: true, message: errorMsg });
      throw networkErr;
    }
  }, [isVoiceActive, voiceTranscript]);

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

      const modeConfig = AppStorage.getModeConfig(currentMode);
      const activeProvider = (modeConfig.provider || AppStorage.getActiveProvider()) as AppSettings['provider'];
      const activeModel = modeConfig.model || AppStorage.getActiveModel();

      // Resolve key securely
      const keysListStr = localStorage.getItem('eldri_api_keys_list');
      const keysList = keysListStr ? JSON.parse(keysListStr) : [];
      const activeKeyProfile = keysList.find((k: any) => k.provider === activeProvider);
      const keyName = activeKeyProfile ? `eldri_key_${activeKeyProfile.id}` : activeProvider;

      const secureApiKey = await invoke<string>('get_secure_key', { provider: keyName });
      if (!secureApiKey) {
        throw new Error(`Missing credentials for "${activeProvider}". Add your API key in Settings.`);
      }

      let queryPrompt = userInput;
      if (isVoiceActive && voiceTranscript) {
        queryPrompt = `[Voice Input Detected — Interviewer/Speaker Said]: "${voiceTranscript}"\n\n[Additional Context]: ${userInput || 'Analyze the screen capture in context of the voice input above.'}`;
      }

      await streamVisionPayload(
        base64Image,
        secureApiKey,
        activeProvider,
        activeModel,
        queryPrompt,
        currentMode,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed.';
      setErrorStatus((prev) => (prev.hasError ? prev : { hasError: true, message }));
      console.error('Vision engine error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, userInput, currentMode, streamVisionPayload, isVoiceActive, voiceTranscript]);

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
    setIsMinimized(true);
    try {
      const current = getCurrentWindow();
      await current.setSize(new LogicalSize(65, 65));
    } catch (err) {
      console.error('Minimize resize failed:', err);
    }
  };

  const handleExpand = async () => {
    setIsMinimized(false);
    try {
      const current = getCurrentWindow();
      await current.setSize(new LogicalSize(380, 520));
    } catch (err) {
      console.error('Expand resize failed:', err);
    }
  };

  const handleCloseWidget = async () => {
    try {
      resetVoice();
      setIsVoiceActive(false);

      const main = await WebviewWindow.getByLabel('main');
      if (main) {
        await main.show();
        await main.unminimize();
        await main.setFocus();
      }

      const current = getCurrentWindow();
      await current.close();
    } catch (err) {
      console.error('Failed to close widget overlay:', err);
    }
  };

  useEffect(() => {
    let isRegistered = false;
    const initShortcut = async () => {
      try {
        await register('Alt+Space', () => {
          triggerVisionEngine();
        });
        isRegistered = true;
      } catch (err) {
        console.error('Hotkey registration failed:', err);
      }
    };
    initShortcut();

    return () => {
      if (isRegistered) {
        const cleanupShortcut = async () => {
          try {
            await unregister('Alt+Space');
          } catch (err) {
            console.error('Failed to unregister shortcut:', err);
          }
        };
        cleanupShortcut();
      }
    };
  }, [triggerVisionEngine]);

  useEffect(() => {
    applyTheme(config.theme);
  }, [config.theme]);

  const t = getThemeTokens(config.theme);
  const parsedSegments = response ? parseResponseSegments(response, t) : null;
  const hasRecap = Boolean(lastSession);
  const showOutput = Boolean(response) || isAnalyzing || errorStatus.hasError;

  if (isMinimized) {
    return (
      <div
        onClick={handleExpand}
        className={`w-[60px] h-[60px] rounded-full border shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all backdrop-blur-xl ${t.widgetShell} ${t.cardBorder}`}
        title="Click to Expand"
      >
        <img
          src={t.logo}
          alt="Eldri Logo"
          className="w-9 h-9 pointer-events-none select-none animate-pulse"
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-start bg-transparent p-3 font-sans antialiased overflow-hidden select-none transition-colors duration-200">
      <div className={`w-full flex-1 flex flex-col rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-all min-h-0 ${t.widgetPanel}`}>
        {/* Top Control Bar */}
        <div
          data-tauri-drag-region
          className={`flex items-center justify-between px-4 py-3 border-b cursor-move shrink-0 ${t.widgetShell} ${t.cardBorder}`}
        >
          <div className="flex items-center gap-2 pointer-events-none select-none">
            <img src={t.logo} alt="Eldri Logo" className="w-5 h-5" />
            <span className={`text-[11px] font-extrabold tracking-tight ${t.text}`}>eldri</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Minimize ▽ */}
            <button
              type="button"
              onClick={handleMinimize}
              className={`p-1.5 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 ${t.text} transition-colors`}
              title="Minimize to Pill"
            >
              ▽
            </button>
            {/* Collapse toggle */}
            <button
              type="button"
              onClick={() => setIsPanelCollapsed((v) => !v)}
              className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${t.textMuted} transition-colors`}
              title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              <Square size={12} strokeWidth={2} />
            </button>
            {/* Close X */}
            <button
              type="button"
              onClick={handleCloseWidget}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors flex items-center justify-center"
              title="Close Eldri"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {!isPanelCollapsed && (
          <>
            {/* Mode selection row */}
            <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${t.widgetWell} ${t.text} hover:opacity-90`}
                >
                  <SlidersHorizontal size={10} className={t.textMuted} />
                  <span className="max-w-[110px] truncate">{currentMode}</span>
                  <ChevronDown size={10} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className={`absolute top-full left-0 mt-1 w-44 border rounded-xl shadow-2xl overflow-hidden py-1 z-50 ${t.card} ${t.cardBorder}`}>
                    {customModes.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setCurrentMode(mode);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[10px] font-medium transition-colors ${
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
                {/* Voice Input Toggle Button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1.5 text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-full border ${
                    isVoiceActive
                      ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20 font-bold'
                      : `${t.widgetWell} ${t.textMuted}`
                  }`}
                  title={isVoiceActive ? 'Disable voice listener' : 'Enable voice listener'}
                >
                  {isVoiceActive ? (
                    <>
                      <Mic size={11} className="animate-pulse text-red-500" />
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                    </>
                  ) : (
                    <MicOff size={11} />
                  )}
                  Voice
                </button>

                {/* Analyse Button */}
                <button
                  type="button"
                  onClick={triggerVisionEngine}
                  disabled={isAnalyzing}
                  className={`flex items-center gap-1 text-[10px] font-bold transition-all disabled:opacity-40 hover:opacity-80 ${t.text}`}
                >
                  {isAnalyzing ? <Loader2 size={11} className="animate-spin" /> : '✦'}
                  Analyse
                </button>

                <button
                  type="button"
                  onClick={handleRecap}
                  disabled={!hasRecap || isAnalyzing}
                  className={`flex items-center gap-1 text-[10px] font-medium transition-all disabled:opacity-30 ${t.textMuted}`}
                >
                  Recap
                </button>
              </div>
            </div>

            <div className={`mx-3 border-t ${t.divider}`} />

            {/* Voice Status Bar */}
            {isVoiceActive && isVoiceListening && (
              <div className={`mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border ${
                t.isDark ? 'bg-red-950/10 border-red-900/30' : 'bg-red-50/50 border-red-100'
              }`}>
                <Mic size={11} className="text-red-500 animate-pulse shrink-0" />
                <div className="flex items-center gap-1 shrink-0">
                  {[...Array(5)].map((_, i) => {
                    const power = Math.max(10, voiceLevel - i * 15);
                    return (
                      <div
                        key={i}
                        className="w-0.5 bg-red-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(16, (power / 100) * 16))}px` }}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider shrink-0">LIVE</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] truncate ${t.isDark ? 'text-red-300/70' : 'text-red-600/70'}`}>
                    {voiceTranscript ? `"${voiceTranscript.slice(-60)}"` : 'Listening for speech...'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Timer size={9} className={t.textMuted} />
                  <span className={`text-[9px] font-mono ${t.textMuted}`}>{formatDuration(voiceDuration)}</span>
                </div>
              </div>
            )}

            {/* Input/Output Shared Area */}
            <div className="flex-1 flex flex-col p-3 min-h-0">
              <div ref={contentRef} className={`flex-1 rounded-xl border overflow-y-auto p-3 min-h-[140px] transition-colors ${t.widgetWell} ${t.cardBorder}`}>
                {errorStatus.hasError ? (
                  <div className={`rounded-lg p-2.5 border ${t.isDark ? 'bg-red-950/30 border-red-800/40' : 'bg-red-50 border-red-200'}`}>
                    <p className={`text-[11px] font-semibold mb-0.5 ${t.isDark ? 'text-red-400' : 'text-red-600'}`}>Error</p>
                    <p className={`text-[11px] leading-relaxed ${t.isDark ? 'text-red-300/90' : 'text-red-500'}`}>{errorStatus.message}</p>
                  </div>
                ) : showOutput ? (
                  <div className="space-y-2">
                    {isAnalyzing && !response && (
                      <div className={`flex items-center gap-2 text-[12px] ${t.textMuted}`}>
                        <Loader2 size={13} className="animate-spin" />
                        Analyzing screen context...
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
                    placeholder={isVoiceActive ? 'Listening for speech input... Speak now.' : 'Type instructions or questions, then press Enter...'}
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
                <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border ${t.widgetWell} ${t.cardBorder}`}>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask follow-up questions..."
                    className={`flex-1 bg-transparent text-[12px] outline-none ${t.textSecondary} ${t.isDark ? 'placeholder:text-zinc-500' : 'placeholder:text-gray-400'}`}
                    onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && triggerVisionEngine()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setResponse('');
                      setScreenshotPreview(null);
                      setUserInput('');
                      clearTranscript();
                    }}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${t.textMuted} hover:opacity-80`}
                  >
                    Clear
                  </button>
                </div>
              )}

              <p className={`text-[9px] text-center mt-2 font-mono ${t.textMuted}`}>Alt + Space to analyse screen context</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
