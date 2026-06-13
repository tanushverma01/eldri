import { useState, useEffect } from 'react';
import { Home as HomeIcon, Clock, Layers, Settings as SettingsIcon, Play, Shield } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

// Import all your original pages
import Home from './components/Home';
import Sessions from './components/Sessions';
import Modes from './components/Modes';
import Settings from './components/Settings';
import Widget from './Widget';
import { AppStorage } from './utils/storage';
import { applyTheme } from './utils/theme';

export default function App() {
  const [windowLabel, setWindowLabel] = useState<string>('main');
  const [activeTab, setActiveTab] = useState<'home' | 'sessions' | 'modes' | 'settings'>('home');
  const [isWidgetSpawned, setIsWidgetSpawned] = useState(false);
  const [config, setConfig] = useState(AppStorage.getSettings());

  // Detect which window instance is mounting this app component
  useEffect(() => {
    setWindowLabel(getCurrentWindow().label);
  }, []);

  useEffect(() => {
    const reloadConfig = () => setConfig(AppStorage.getSettings());
    window.addEventListener('storage', reloadConfig);
    return () => window.removeEventListener('storage', reloadConfig);
  }, []);

  useEffect(() => {
    applyTheme(config.theme);
  }, [config.theme]);

  // Apply saved theme on first load
  useEffect(() => {
    applyTheme(AppStorage.getSettings().theme);
  }, []);

  const handleThemeChange = (theme: 'dark' | 'light') => {
    setConfig((prev) => ({ ...prev, theme }));
  };

  // 1. ROUTE DIRECTLY TO WIDGET VIEWPORT IF THIS IS THE OVERLAY INSTANCE
  if (windowLabel === 'widget') {
    return <Widget />;
  }

  // 2. MAIN HUB INTERFACE DESIGN
  const spawnOverlayWidget = async () => {
    try {
      const widget = await WebviewWindow.getByLabel('widget');
      if (widget) {
        await widget.show();
        await widget.setFocus();
        setIsWidgetSpawned(true);
      }
    } catch (err) {
      console.error("Failed to launch widget:", err);
    }
  };

  const isLight = config.theme === 'light';

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden select-none antialiased ${
      isLight ? 'bg-[#F9FAFB] text-gray-900' : 'bg-[#0A0A0C] text-[#E4E4E7]'
    }`}>
      
      {/* SIDEBAR NAVIGATION MATRIX */}
      <aside className={`w-64 flex flex-col justify-between p-4 shrink-0 border-r ${
        isLight ? 'bg-white border-gray-200' : 'bg-[#111115] border-[#1F1F24]'
      }`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-serif italic font-extrabold text-base shadow-lg shadow-purple-900/30">
              e
            </div>
            <div>
              <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Eldri</h2>
              <p className="text-[9px] text-purple-400 font-extrabold tracking-widest uppercase">Godmode Core</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                  : isLight
                    ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                    : 'text-zinc-400 hover:bg-[#16161B] hover:text-zinc-200 border border-transparent'
              }`}
            >
              <HomeIcon size={15} /> Home
            </button>
            <button 
              onClick={() => setActiveTab('sessions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                  : isLight
                    ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                    : 'text-zinc-400 hover:bg-[#16161B] hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Clock size={15} /> Sessions
            </button>
            <button 
              onClick={() => setActiveTab('modes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'modes'
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                  : isLight
                    ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                    : 'text-zinc-400 hover:bg-[#16161B] hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Layers size={15} /> Modes
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20'
                  : isLight
                    ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                    : 'text-zinc-400 hover:bg-[#16161B] hover:text-zinc-200 border border-transparent'
              }`}
            >
              <SettingsIcon size={15} /> Settings
            </button>
          </nav>
        </div>

        {/* BOTTOM HUD MODULE */}
        <div className={`rounded-2xl p-3.5 space-y-3 border ${
          isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#16161B] border-[#222228]'
        }`}>
          <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${
            isLight ? 'text-gray-400' : 'text-zinc-500'
          }`}>
            <span>System State</span>
            <span className={`flex items-center gap-1 ${isWidgetSpawned ? 'text-purple-400' : 'text-emerald-400'}`}>
              <Shield size={10} /> {isWidgetSpawned ? 'Widget Active' : 'Secure'}
            </span>
          </div>
          <button 
            onClick={spawnOverlayWidget}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-purple-900/10"
          >
            <Play size={12} fill="currentColor" /> Launch Widget
          </button>
        </div>
      </aside>

      {/* DYNAMIC COMPONENT VIEWPORT CONTAINER */}
      <main className={`flex-1 overflow-y-auto p-6 ${isLight ? 'bg-[#F9FAFB]' : 'bg-[#0A0A0C]'}`}>
        <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
          {activeTab === 'home' && <Home theme={config.theme} />}
          {activeTab === 'sessions' && <Sessions theme={config.theme} />}
          {activeTab === 'modes' && <Modes theme={config.theme} />}
          {activeTab === 'settings' && (
            <Settings theme={config.theme} onThemeChange={handleThemeChange} />
          )}
        </div>
      </main>
    </div>
  );
}