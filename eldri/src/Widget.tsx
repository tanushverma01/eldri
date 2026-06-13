import { useState, useEffect, useRef } from 'react';
import { Target, Search, RefreshCw, Layers, Star } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { AppStorage } from './utils/storage';

export default function Widget() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState("Code Reviewer");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [config, setConfig] = useState(AppStorage.getSettings());
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reload = () => setConfig(AppStorage.getSettings());
    window.addEventListener('storage', reload);
    return () => window.removeEventListener('storage', reload);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [response]);

  const runStreamingVisionEngine = async () => {
    if (!config.apiKey) {
      setResponse("Missing Authorization: Add an API key under Dashboard Settings first.");
      return;
    }

    setIsAnalyzing(true);
    setScreenshotPreview(null);
    setResponse("Capturing active desk view...");

    try {
      const base64Uri = await invoke<string>('capture_screen');
      setScreenshotPreview(base64Uri);
      setResponse(""); 

      // DYNAMIC BACKEND ROUTER URL RESOLUTION
      let gatewayUrl = "https://api.openai.com/v1/chat/completions";
      if (config.provider === 'openrouter') gatewayUrl = "https://openrouter.ai/api/v1/chat/completions";
      if (config.provider === 'deepseek') gatewayUrl = "https://api.deepseek.com/v1/chat/completions";
      if (config.provider === 'groq') gatewayUrl = "https://api.groq.com/openai/v1/chat/completions";
      if (config.provider === 'gemini') gatewayUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

      const connection = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          stream: true,
          messages: [
            { role: 'system', content: AppStorage.getSystemPrompt(currentMode) },
            {
              role: 'user',
              content: [
                { type: 'text', text: userInput || "Review this active screen grid context." },
                { type: 'image_url', image_url: { url: base64Uri } }
              ]
            }
          ],
          temperature: 0.1
        })
      });

      if (!connection.ok) throw new Error(`Gateway returned error status: ${connection.status}`);

      const dataStreamReader = connection.body?.getReader();
      const textDecoder = new TextDecoder("utf-8");
      if (!dataStreamReader) throw new Error("Processing line streaming layer failed.");

      let finishedString = "";

      while (true) {
        const { value, done } = await dataStreamReader.read();
        if (done) break;

        const dynamicChunk = textDecoder.decode(value);
        const sourceLines = dynamicChunk.split("\n");

        for (const line of sourceLines) {
          const sanitizedLine = line.replace(/^data:\s*/, "").trim();
          if (!sanitizedLine || sanitizedLine === "[DONE]") continue;

          try {
            const parsedJson = JSON.parse(sanitizedLine);
            const charactersStreamed = parsedJson.choices?.[0]?.delta?.content || "";
            finishedString += charactersStreamed;
            setResponse(finishedString); 
          } catch {
            // Skips partial JSON boundaries safely
          }
        }
      }

      if (finishedString) {
        AppStorage.addSession({
          mode: currentMode,
          query: userInput || "Standard Workspace Target Scan",
          response: finishedString,
          screenshot: base64Uri
        });
      }

    } catch (err) {
      console.error("Vision transmission error:", err);
      setResponse(`Streaming Error: ${String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isLight = config.theme === 'light';

  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-start bg-transparent p-4 font-sans antialiased overflow-hidden select-none transition-colors duration-200`}>
      <div 
        data-tauri-drag-region 
        className={`flex items-center gap-1.5 p-1.5 pr-2.5 backdrop-blur-3xl rounded-full border shadow-xl mb-4 cursor-move shrink-0 z-50 ${
          isLight ? 'bg-white/95 text-zinc-800 border-zinc-200' : 'bg-[#16161A]/95 text-white border-[#333333]/50'
        }`}
      >
        <div data-tauri-drag-region className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-serif italic font-bold text-sm shrink-0">e</div>
        <p data-tauri-drag-region className={`text-[10px] font-extrabold uppercase tracking-widest px-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Eldri Vision</p>
      </div>

      <div className={`w-full flex-1 flex flex-col rounded-2xl border shadow-2xl p-3 relative overflow-hidden transition-all ${
        isLight ? 'bg-white border-zinc-200' : 'bg-[#16161A] border-[#333333]/70'
      }`}>
          <div data-tauri-drag-region className="w-full h-1.5 cursor-move shrink-0" />

          <div className="flex-1 overflow-y-auto mb-3 pr-1 flex flex-col gap-2">
              {response || screenshotPreview ? (
                  <div className="flex flex-col gap-3">
                      <div className={`text-xs leading-relaxed font-medium whitespace-pre-wrap animate-in fade-in duration-200 px-1 ${
                        isLight ? 'text-zinc-800' : 'text-zinc-200'
                      }`}>
                        {response}
                      </div>
                      {screenshotPreview && (
                          <div className={`rounded-xl overflow-hidden border max-h-36 relative bg-black/10 shadow-inner shrink-0 ${
                            isLight ? 'border-zinc-200' : 'border-[#333333]'
                          }`}>
                              <img src={screenshotPreview} alt="Desktop Capture Matrix" className="w-full h-full object-cover" />
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
                    {["Code Reviewer", "Interview Helper", "Exam Solver"].map((mode) => (
                      <button
                        key={mode}
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

              <button onClick={runStreamingVisionEngine} disabled={isAnalyzing} className="flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-400 disabled:opacity-40 transition-colors">
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
                  onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && runStreamingVisionEngine()}
              />
              <button 
                  onClick={runStreamingVisionEngine}
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