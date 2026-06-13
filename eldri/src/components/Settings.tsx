import { useState, useEffect } from 'react';
import { Key, Database, Cpu, Save, CheckCircle, Sun, Moon } from 'lucide-react';
import { AppStorage, AppSettings } from '../utils/storage';

interface SettingsProps {
  theme: AppSettings['theme'];
  onThemeChange: (theme: AppSettings['theme']) => void;
}

export default function Settings({ theme, onThemeChange }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>(AppStorage.getSettings());
  const [saved, setSaved] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    setSettings(AppStorage.getSettings());
  }, [theme]);

  const handleThemeChange = (nextTheme: AppSettings['theme']) => {
    const updated = { ...AppStorage.getSettings(), theme: nextTheme };
    AppStorage.saveSettings(updated);
    setSettings((prev) => ({ ...prev, theme: nextTheme }));
    onThemeChange(nextTheme);
  };

  const handleProviderChange = (selectedProvider: AppSettings['provider']) => {
    let defaultModel = 'gpt-4o';
    if (selectedProvider === 'openrouter') defaultModel = 'google/gemini-2.5-pro';
    if (selectedProvider === 'deepseek') defaultModel = 'deepseek-chat';
    if (selectedProvider === 'groq') defaultModel = 'llama-3.2-11b-vision-preview';
    if (selectedProvider === 'gemini') defaultModel = 'gemini-2.5-flash';

    setSettings({
      ...settings,
      provider: selectedProvider,
      model: defaultModel,
    });
  };

  const handleSave = () => {
    AppStorage.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass = isLight
    ? 'bg-gray-50 border-gray-300 text-gray-900'
    : 'bg-[#18181C] border-[#2E2E36] text-zinc-200';

  return (
    <div className="p-6 max-w-2xl font-sans transition-colors duration-200">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
          Configuration Profile
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
          Manage connection keys, aesthetic layout styles, and language engines.
        </p>
      </div>

      <div className={`space-y-5 rounded-2xl p-5 shadow-xl border ${
        isLight ? 'bg-white border-gray-200' : 'bg-[#121214] border-[#222226]'
      }`}>

        {/* AESTHETIC LAYOUT MODE */}
        <div className="flex flex-col gap-2">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${
            isLight ? 'text-gray-500' : 'text-zinc-400'
          }`}>
            Aesthetic Layout Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-purple-600/10 text-purple-400 border-purple-500/40 shadow-lg'
                  : isLight
                    ? 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                    : 'bg-[#18181C] border-[#2E2E36] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Moon size={14} /> Night Stealth (Dark)
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-lg'
                  : isLight
                    ? 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                    : 'bg-[#18181C] border-[#2E2E36] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun size={14} /> Professional Day (Light)
            </button>
          </div>
        </div>

        {/* AI ECOSYSTEM PROVIDER */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isLight ? 'text-gray-500' : 'text-zinc-400'
          }`}>
            <Database size={12} className="text-purple-400" /> AI Ecosystem Provider
          </label>
          <select
            value={settings.provider}
            onChange={(e) => handleProviderChange(e.target.value as AppSettings['provider'])}
            className={`border text-sm rounded-xl p-2.5 outline-none focus:border-purple-500 transition-colors cursor-pointer ${inputClass}`}
          >
            <option value="openai">OpenAI Official</option>
            <option value="openrouter">OpenRouter Router Gateway</option>
            <option value="deepseek">DeepSeek Official Backend</option>
            <option value="groq">Groq Cloud Engine (Ultra Fast)</option>
            <option value="gemini">Google Gemini API Gateway</option>
          </select>
        </div>

        {/* API KEY */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isLight ? 'text-gray-500' : 'text-zinc-400'
          }`}>
            <Key size={12} className="text-purple-400" /> Secure Token Authorization Key
          </label>
          <input
            type="password"
            value={settings.apiKey}
            placeholder="Enter token key for selected router..."
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            className={`border text-sm rounded-xl p-2.5 outline-none focus:border-purple-500 font-mono tracking-wider ${inputClass}`}
          />
        </div>

        {/* MODEL */}
        <div className="flex flex-col gap-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isLight ? 'text-gray-500' : 'text-zinc-400'
          }`}>
            <Cpu size={12} className="text-purple-400" /> Vision Intelligence Core Model
          </label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className={`border text-sm rounded-xl p-2.5 outline-none focus:border-purple-500 font-mono ${inputClass}`}
          />
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
          >
            <Save size={14} /> Save Profile Changes
          </button>

          {saved && (
            <span className="text-emerald-400 text-xs flex items-center gap-1 animate-in fade-in duration-200">
              <CheckCircle size={14} /> Router configuration updated.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
