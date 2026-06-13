import { useState } from 'react';
import { Layers, Save, CheckCircle } from 'lucide-react';
import { AppStorage, AppSettings } from '../utils/storage';

export default function Modes({ theme }: { theme: AppSettings['theme'] }) {
  const [settings, setSettings] = useState(AppStorage.getSettings());
  const [savedMode, setSavedMode] = useState<string | null>(null);
  const isLight = theme === 'light';

  const updatePrompt = (modeKey: string, text: string) => {
    const updatedPrompts = { ...settings.customPrompts, [modeKey]: text };
    setSettings({ ...settings, customPrompts: updatedPrompts });
  };

  const commitPromptChanges = (modeKey: string) => {
    AppStorage.saveSettings(settings);
    setSavedMode(modeKey);
    setTimeout(() => setSavedMode(null), 2000);
  };

  const card = isLight ? 'bg-white border-gray-200' : 'bg-[#121214] border-[#222226]';
  const inputClass = isLight
    ? 'bg-gray-50 border-gray-300 text-gray-800'
    : 'bg-[#18181C] border-[#2E2E36] text-zinc-300';

  return (
    <div className={`space-y-6 font-sans ${isLight ? 'text-gray-900' : 'text-white'}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Intelligence Modifiers</h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>
          Alter underlying system directives and context filters for active modes.
        </p>
      </div>

      <div className="space-y-4">
        {Object.keys(settings.customPrompts).map((modeName) => (
          <div key={modeName} className={`${card} rounded-2xl p-4 shadow-md space-y-3 border`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-purple-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-gray-700' : 'text-zinc-200'}`}>
                  {modeName} Directive Base
                </h3>
              </div>
              <button
                onClick={() => commitPromptChanges(modeName)}
                className="flex items-center gap-1.5 bg-purple-600/10 hover:bg-purple-600 border border-purple-500/20 text-purple-400 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                <Save size={12} /> Save Rule
              </button>
            </div>

            <textarea
              value={settings.customPrompts[modeName]}
              onChange={(e) => updatePrompt(modeName, e.target.value)}
              className={`w-full h-24 border rounded-xl p-3 text-xs font-medium outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed ${inputClass}`}
            />

            {savedMode === modeName && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 animate-in fade-in duration-150">
                <CheckCircle size={10} /> Active engine instruction profile re-indexed.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
