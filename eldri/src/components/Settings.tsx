import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ChevronDown, CheckCircle, Palette } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { AppStorage, AppSettings } from '../utils/storage';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

const MASKED_KEY = '••••••••••••••••••••••••••••••••';

const PROVIDER_MODELS: Record<AppSettings['provider'], string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini'],
  openrouter: ['google/gemini-2.5-pro', 'anthropic/claude-3.5-sonnet'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  groq: ['llama-3.2-11b-vision-preview'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
};

const KEYBINDS = [
  { use: 'Show Widget', shortcut: 'Ctrl+Shift+E' },
  { use: 'Quick Analyse', shortcut: 'Alt+Space' },
  { use: 'Start Capture', shortcut: 'Ctrl+Shift+S' },
  { use: 'Recap Session', shortcut: 'Ctrl+Shift+R' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

interface SettingsProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onSignOut?: () => void;
}

export default function Settings({ theme, onThemeChange, onSignOut }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>(AppStorage.getSettings());
  const [localKey, setLocalKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [keybindsOpen, setKeybindsOpen] = useState(true);
  const [apiOpen, setApiOpen] = useState(false);
  const t = getThemeTokens(theme);

  useEffect(() => {
    setSettings(AppStorage.getSettings());
  }, [theme]);

  useEffect(() => {
    const syncSecureKey = async () => {
      try {
        const structuralKey = await invoke<string>('get_secure_key', { provider: settings.provider });
        setLocalKey(structuralKey ? MASKED_KEY : '');
      } catch (err) {
        console.error('OS Key extraction error:', err);
      }
    };
    syncSecureKey();
  }, [settings.provider]);

  const handleSave = async () => {
    try {
      AppStorage.saveSettings(settings);
      localStorage.setItem('eldri_provider', settings.provider);
      localStorage.setItem('eldri_model', settings.model);

      if (localKey && localKey !== MASKED_KEY) {
        await invoke('save_secure_key', { provider: settings.provider, key: localKey });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Failed to secure credentials:', error);
    }
  };

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-current/10 ${t.input} ${t.inputBorder} ${t.text}`;
  const sectionClass = `rounded-2xl border overflow-hidden ${t.card} ${t.cardBorder}`;

  const themeOption = (id: AppTheme, label: string, preview: string) => (
    <motion.button
      key={id}
      type="button"
      onClick={() => {
        onThemeChange(id);
        setSettings((prev) => ({ ...prev, theme: id }));
        AppStorage.saveSettings({ ...AppStorage.getSettings(), theme: id });
      }}
      className={`flex-1 p-3 rounded-xl border text-left transition-all ${
        theme === id
          ? `${t.cardBorder} ring-2 ring-offset-1 ${theme === 'purple' ? 'ring-[#8B5CF6]' : theme === 'mono' ? 'ring-white' : 'ring-black'}`
          : `${t.cardBorder} opacity-70 hover:opacity-100`
      } ${t.card}`}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <div className={`w-full h-8 rounded-lg mb-2 ${preview}`} />
      <span className={`text-xs font-semibold ${t.text}`}>{label}</span>
    </motion.button>
  );

  return (
    <motion.div
      className="max-w-2xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item} className={`text-2xl font-bold mb-6 ${t.text}`}>Settings</motion.h1>

      {/* Appearance Section */}
      <motion.div variants={item} className="space-y-4 mb-6">
        <div className="flex items-center gap-2">
          <Palette size={14} className={t.textMuted} />
          <p className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Appearance</p>
        </div>
        <div className="flex gap-3">
          {themeOption('light', 'Light', 'bg-gradient-to-r from-gray-100 to-white border border-gray-200')}
          {themeOption('mono', 'Black & White', 'bg-gradient-to-r from-black to-zinc-900')}
          {themeOption('purple', 'Purple Dark', 'bg-gradient-to-r from-[#121016] to-[#8B5CF6]/40')}
        </div>
      </motion.div>

      {/* Keybinds Section */}
      <motion.div variants={item} className={sectionClass}>
        <motion.button
          type="button"
          onClick={() => setKeybindsOpen(!keybindsOpen)}
          className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold ${t.text}`}
          whileTap={{ scale: 0.99 }}
        >
          Keybinds
          <motion.div animate={{ rotate: keybindsOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={16} className={t.textMuted} />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {keybindsOpen && (
            <motion.div
              className={`px-5 pb-4 border-t ${t.divider}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={`grid grid-cols-2 gap-2 py-3 text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>
                <span>Use Case</span>
                <span>Shortcut</span>
              </div>
              {KEYBINDS.map((kb, idx) => (
                <motion.div
                  key={kb.use}
                  className={`grid grid-cols-2 gap-2 py-2.5 items-center border-t ${t.divider}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <span className={`text-sm ${t.textSecondary}`}>{kb.use}</span>
                  <div className="flex items-center gap-2">
                    <kbd className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${t.input} ${t.inputBorder} ${t.text}`}>
                      {kb.shortcut}
                    </kbd>
                    <span className={`text-[10px] ${t.textMuted}`}>Edit</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* API Keys Section */}
      <motion.div variants={item} className={`${sectionClass} mt-4`}>
        <motion.button
          type="button"
          onClick={() => setApiOpen(!apiOpen)}
          className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold ${t.text}`}
          whileTap={{ scale: 0.99 }}
        >
          <span className="flex items-center gap-2"><Key size={14} /> API Keys</span>
          <motion.div animate={{ rotate: apiOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown size={16} className={t.textMuted} />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {apiOpen && (
            <motion.div
              className={`px-5 pb-4 space-y-4 border-t ${t.divider}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pt-4">
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Provider</label>
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    provider: e.target.value as AppSettings['provider'],
                    model: PROVIDER_MODELS[e.target.value as AppSettings['provider']][0],
                  })}
                  className={inputClass}
                >
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="groq">Groq</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Secure Token</label>
                <input
                  type="password"
                  value={localKey}
                  placeholder={localKey ? 'Token in hardware vault' : 'Enter API token...'}
                  onChange={(e) => setLocalKey(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className={inputClass}
                >
                  {PROVIDER_MODELS[settings.provider].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between pt-1">
                <motion.button
                  type="button"
                  onClick={handleSave}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold ${t.btnPrimary} ${t.btnPrimaryText}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Save Profile Changes
                </motion.button>
                <AnimatePresence>
                  {saved && (
                    <motion.span
                      className={`text-xs flex items-center gap-1 ${t.accent}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <CheckCircle size={12} /> Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {onSignOut && (
        <motion.div variants={item} className={`mt-6 pt-4 border-t ${t.divider}`}>
          <motion.button
            type="button"
            onClick={onSignOut}
            className={`text-sm font-medium ${t.textMuted} hover:underline`}
            whileHover={{ x: 4 }}
          >
            Sign out
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
