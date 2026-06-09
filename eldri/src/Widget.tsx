import { useState } from 'react';
import { Target, Search, RefreshCw, ChevronDown, Layers, Star, X } from 'lucide-react';
// Tauri v2 core invoke method
import { invoke } from '@tauri-apps/api/core';

export default function Widget() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setResponse(null);
    try {
      // Call the native Rust capture command
      const base64Image = await invoke<string>('capture_screen');
      
      // Save the screenshot preview string to state
      setScreenshotPreview(base64Image);
      
      // Update status layout
      setResponse("System state captured successfully! Native vision is online.\nReady to route context to the AI layer.");
    } catch (err) {
      console.error("Capture failed:", err);
      setResponse(`Capture Error: ${String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="godmode-replicate-container h-screen w-screen flex flex-col items-center justify-start bg-transparent text-white rounded-3xl relative p-4 font-sans antialiased overflow-hidden">
      
      {/* TOP CONTROL PILL */}
      <div data-tauri-drag-region className="top-control-pill flex items-center gap-1.5 p-1.5 pr-2.5 bg-[#1A1A1A]/90 backdrop-blur-3xl rounded-full border border-[#333333]/50 shadow-xl mb-4 cursor-move shrink-0 z-50">
          <div className="bg-black text-white rounded-full w-7 h-7 flex items-center justify-center font-serif italic font-bold text-sm shrink-0">e</div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Eldri Godmode</p>
      </div>

      {/* MAIN UNIFIED ANALYSIS PANEL */}
      <div className="main-godmode-panel w-full flex-1 flex flex-col bg-[#1A1A1A]/90 backdrop-blur-3xl rounded-2xl border border-[#333333]/50 shadow-2xl p-3 relative overflow-hidden">
          
          {/* REPLICATED INTEGRATED RESPONSE/VIEWPORT AREA */}
          <div className="replicate-output-area flex-1 overflow-y-auto mb-3 pr-1 flex flex-col gap-2">
              {response ? (
                  <div className="flex flex-col gap-3 h-full">
                      <div className="text-sm leading-relaxed text-gray-200 animate-in fade-in duration-300 px-1 whitespace-pre-line">
                        {response}
                      </div>
                      {screenshotPreview && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-[#333333] max-h-32 opacity-80 hover:opacity-100 transition-opacity">
                              <img src={screenshotPreview} alt="Desktop Capture Preview" className="w-full h-full object-cover" />
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-6 text-gray-600">
                    <Target size={32} className="mb-2 opacity-40" />
                    <p className="text-xs font-medium">Ready to analyse system state.</p>
                  </div>
              )}
          </div>

          {/* DYNAMIC CONTROL & BUTTON BAR */}
          <div className="replicate-button-bar flex justify-between items-center pb-2.5 mb-2.5 border-b border-[#333333] gap-2 shrink-0">
              <button className="flex items-center gap-2 p-1.5 px-2.5 bg-[#1A1A1A] border border-[#333333] hover:bg-[#222] rounded-xl text-[11px] font-semibold text-gray-400 hover:text-white transition-colors group">
                  <Layers size={13} className="text-purple-500" />
                  Code Reviewer
                  <ChevronDown size={12} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-3">
                  <button onClick={startAnalysis} className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-white group transition-colors">
                      <Star size={13} className="text-purple-500" />
                      Analyse
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-white group transition-colors">
                      <RefreshCw size={13} className="text-purple-500" />
                      Recap
                  </button>
              </div>
          </div>

          {/* REPLICATED INTEGRATED SEARCH/PROMPT BAR */}
          <div className="replicate-search-bar bg-[#1A1A1A] p-2 rounded-xl border border-[#333333] flex items-center shadow-xl gap-2 mt-auto shrink-0">
              <Search size={16} className="ml-1 text-gray-600 shrink-0" />
              <input 
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Specify context or type a query..."
                  className="flex-1 bg-transparent text-xs placeholder:text-gray-700 outline-none p-1 font-medium text-gray-100"
              />
              <button 
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className={`p-2 rounded-xl transition-all group ${
                    isAnalyzing 
                      ? 'bg-purple-900/40 text-purple-300 cursor-not-allowed' 
                      : 'bg-purple-700 hover:bg-purple-600 active:scale-95 text-white shadow-[0_0_10px_rgba(147,51,234,0.2)]'
                  }`}>
                  {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Layers size={14} />}
              </button>
          </div>
      </div>
    </div>
  );
}