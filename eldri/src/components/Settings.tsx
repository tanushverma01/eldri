import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ChevronDown, CheckCircle, Keyboard, Save, Trash2, Plus } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { AppStorage } from '../utils/storage';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const MASKED_KEY = '••••••••••••••••••••••••••••••••';

const PROVIDER_MODELS: Record<string, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'o1',
    'o1-mini',
    'o3-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ],
  anthropic: [
    'claude-3-5-sonnet-latest',
    'claude-3-5-haiku-latest',
    'claude-3-opus-latest',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20240620'
  ],
  openrouter: [
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat',
    'deepseek/deepseek-r1',
    'meta-llama/llama-3.3-70b-instruct',
    'openai/gpt-4o',
    'openai/gpt-4o-mini'
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-reasoner'
  ],
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.3-70b-specdec',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
    'llama-3.1-8b-instant'
  ],
  gemini: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ],
};

const DEFAULT_KEYBINDS = [
  { use: 'Show Widget', shortcut: 'Ctrl+Shift+E' },
  { use: 'Quick Analyse', shortcut: 'Alt+Space' },
  { use: 'Start Capture', shortcut: 'Ctrl+Shift+S' },
  { use: 'Recap Session', shortcut: 'Ctrl+Shift+R' },
];

export interface ApiKeyConfig {
  id: string;
  provider: 'openai' | 'openrouter' | 'deepseek' | 'groq' | 'gemini' | 'anthropic';
  model: string;
  label: string;
  validated: boolean;
}

interface SettingsProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onSignOut?: () => void;
}

export default function Settings({ theme, onThemeChange }: SettingsProps) {
  // Theme styling tokens
  const t = getThemeTokens(theme);

  // Accordion state
  const [keybindsOpen, setKeybindsOpen] = useState(false);
  const [apiOpen, setApiOpen] = useState(false);

  // Keybinds state
  const [keybinds, setKeybinds] = useState<{ use: string; shortcut: string }[]>(() => {
    const stored = localStorage.getItem('eldri_keybinds');
    return stored ? JSON.parse(stored) : DEFAULT_KEYBINDS;
  });
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>(() => {
    const stored = localStorage.getItem('eldri_api_keys_list');
    if (stored) return JSON.parse(stored);
    
    // Legacy fallback: convert active setting
    const current = AppStorage.getSettings();
    return [
      {
        id: 'default',
        provider: current.provider,
        model: current.model,
        label: 'Default Key',
        validated: true,
      }
    ];
  });
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(apiKeys[0]?.id || null);

  // Form inputs for selected key
  const [formProvider, setFormProvider] = useState<ApiKeyConfig['provider']>('openai');
  const [formModel, setFormModel] = useState('gpt-4o');
  const [formLabel, setFormLabel] = useState('');
  const [formKeyVal, setFormKeyVal] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const selectedKey = apiKeys.find(k => k.id === selectedKeyId);

  // Update form inputs when selected key changes
  useEffect(() => {
    if (selectedKey) {
      setFormProvider(selectedKey.provider);
      setFormModel(selectedKey.model);
      setFormLabel(selectedKey.label);
      
      // Load password from Tauri keyring securely
      const loadKey = async () => {
        try {
          const keyName = `eldri_key_${selectedKey.id}`;
          const secret = await invoke<string>('get_secure_key', { provider: keyName });
          setFormKeyVal(secret ? MASKED_KEY : '');
        } catch (err) {
          console.error('Failed to load secure key:', err);
          setFormKeyVal('');
        }
      };
      loadKey();
    }
  }, [selectedKeyId]);

  // Key Recording Listener
  useEffect(() => {
    if (recordingIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      if (e.metaKey) parts.push('Cmd');

      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      parts.push(keyName);
      const formatted = parts.join('+');

      const updated = [...keybinds];
      updated[recordingIdx] = { ...updated[recordingIdx], shortcut: formatted };
      setKeybinds(updated);
      localStorage.setItem('eldri_keybinds', JSON.stringify(updated));
      setRecordingIdx(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingIdx, keybinds]);

  // API Key Saving
  const handleSaveApiKey = async () => {
    if (!selectedKeyId) return;
    setSaveStatus('saving');

    try {
      const keyName = `eldri_key_${selectedKeyId}`;
      if (formKeyVal && formKeyVal !== MASKED_KEY) {
        await invoke('save_secure_key', { provider: keyName, key: formKeyVal });
      }

      // Update local storage configurations
      const updatedList = apiKeys.map(k => {
        if (k.id === selectedKeyId) {
          return {
            ...k,
            provider: formProvider,
            model: formModel,
            label: formLabel || `${formProvider} Key`,
            validated: true,
          };
        }
        return k;
      });

      setApiKeys(updatedList);
      localStorage.setItem('eldri_api_keys_list', JSON.stringify(updatedList));

      // Also synchronize into core AppSettings as the primary active provider
      const coreSettings = AppStorage.getSettings();
      const nextSettings = {
        ...coreSettings,
        provider: formProvider,
        model: formModel,
      };
      AppStorage.saveSettings(nextSettings);
      localStorage.setItem('eldri_provider', formProvider);
      localStorage.setItem('eldri_model', formModel);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save API key:', err);
      setSaveStatus('idle');
    }
  };

  // API Key Deletion
  const handleDeleteApiKey = async () => {
    if (!selectedKeyId) return;

    try {
      const keyName = `eldri_key_${selectedKeyId}`;
      await invoke('save_secure_key', { provider: keyName, key: '' }); // clear keyring entry

      const updatedList = apiKeys.filter(k => k.id !== selectedKeyId);
      setApiKeys(updatedList);
      localStorage.setItem('eldri_api_keys_list', JSON.stringify(updatedList));

      if (updatedList.length > 0) {
        setSelectedKeyId(updatedList[0].id);
      } else {
        setSelectedKeyId(null);
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  // Add a new empty API Key config
  const handleAddNewKey = () => {
    const newId = crypto.randomUUID();
    const newKey: ApiKeyConfig = {
      id: newId,
      provider: 'openai',
      model: 'gpt-4o',
      label: 'New API Key',
      validated: false,
    };

    const nextList = [...apiKeys, newKey];
    setApiKeys(nextList);
    localStorage.setItem('eldri_api_keys_list', JSON.stringify(nextList));
    setSelectedKeyId(newId);
  };

  const inputClass = `w-full border rounded-xl px-4 py-3 text-xs outline-none bg-white dark:bg-zinc-900 ${t.inputBorder} ${t.text} focus:border-black dark:focus:border-white transition-colors`;
  const selectStyle = `w-full border rounded-xl px-4 py-3 text-xs outline-none appearance-none bg-white dark:bg-zinc-900 ${t.inputBorder} ${t.text} focus:border-black dark:focus:border-white transition-colors cursor-pointer`;

  return (
    <motion.div
      className="max-w-3xl h-full flex flex-col"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item} className={`text-2xl font-bold tracking-tight mb-4 ${t.text}`}>Settings</motion.h1>

      {/* Modern Top Theme Toggle */}
      <motion.div variants={item} className="flex items-center justify-between border rounded-2xl p-4 mb-6 bg-white dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold">Appearance Theme</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Toggle between monochrome themes and accent highlights.</p>
        </div>
        <div className="flex gap-2">
          {(['light', 'mono', 'purple'] as AppTheme[]).map((thm) => (
            <button
              key={thm}
              type="button"
              onClick={() => onThemeChange(thm)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase border transition ${
                theme === thm
                  ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-bold'
                  : 'border-gray-200 dark:border-zinc-800 text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {thm === 'mono' ? 'Dark Mono' : thm}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Accordions */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-6 custom-scrollbar">
        {/* Accordion 1: Keybinds */}
        <motion.div variants={item} className={`rounded-2xl border overflow-hidden ${t.card} ${t.cardBorder}`}>
          <button
            type="button"
            onClick={() => setKeybindsOpen(!keybindsOpen)}
            className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold ${t.text} hover:bg-gray-50/50 dark:hover:bg-zinc-900/20 transition-colors`}
          >
            <span className="flex items-center gap-2">
              <Keyboard size={15} /> Keybind Shortcuts
            </span>
            <motion.div animate={{ rotate: keybindsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} className={t.textMuted} />
            </motion.div>
          </button>
          
          <AnimatePresence initial={false}>
            {keybindsOpen && (
              <motion.div
                className={`px-5 pb-5 border-t ${t.divider}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className={`grid grid-cols-3 gap-2 py-3 text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>
                  <span className="col-span-2">Action Use Case</span>
                  <span>Shortcut Key</span>
                </div>
                {keybinds.map((kb, idx) => {
                  const isRecording = recordingIdx === idx;
                  return (
                    <div
                      key={kb.use}
                      className={`grid grid-cols-3 gap-2 py-3 items-center border-t ${t.divider}`}
                    >
                      <span className={`col-span-2 text-xs font-medium ${t.textSecondary}`}>{kb.use}</span>
                      <div className="flex items-center justify-between">
                        <kbd
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                            isRecording
                              ? 'border-red-500 bg-red-50 text-red-600 animate-pulse'
                              : `${t.input} ${t.inputBorder} ${t.text}`
                          }`}
                        >
                          {isRecording ? 'Press keys...' : kb.shortcut}
                        </kbd>
                        <button
                          type="button"
                          onClick={() => setRecordingIdx(isRecording ? null : idx)}
                          className={`text-[10px] font-semibold underline ml-2 ${t.textMuted} hover:${t.text}`}
                        >
                          {isRecording ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Accordion 2: API Keys */}
        <motion.div variants={item} className={`rounded-2xl border overflow-hidden ${t.card} ${t.cardBorder}`}>
          <button
            type="button"
            onClick={() => setApiOpen(!apiOpen)}
            className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold ${t.text} hover:bg-gray-50/50 dark:hover:bg-zinc-900/20 transition-colors`}
          >
            <span className="flex items-center gap-2">
              <Key size={15} /> API Keys & Provider Vault
            </span>
            <motion.div animate={{ rotate: apiOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} className={t.textMuted} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {apiOpen && (
              <motion.div
                className={`border-t ${t.divider}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex h-96">
                  {/* Master Left Side */}
                  <div className={`w-1/3 border-r ${t.divider} p-4 flex flex-col justify-between`}>
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                      {apiKeys.map(k => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => setSelectedKeyId(k.id)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition ${
                            selectedKeyId === k.id
                              ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black font-bold'
                              : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="truncate">{k.label}</div>
                          <div className={`text-[10px] mt-1 capitalize font-normal ${
                            selectedKeyId === k.id ? 'opacity-80' : 'text-gray-400'
                          }`}>
                            {k.provider} ({k.model})
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewKey}
                      className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-black dark:hover:border-white text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Plus size={13} /> Add API Key
                    </button>
                  </div>

                  {/* Detail Right Side */}
                  <div className="w-2/3 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                    {selectedKey ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <span className={`text-xs font-bold ${t.text}`}>Key Settings</span>
                          <button
                            type="button"
                            onClick={handleDeleteApiKey}
                            className="text-red-500 hover:text-red-600 text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Remove Key
                          </button>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${t.textMuted}`}>Label</label>
                          <input
                            type="text"
                            value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value)}
                            placeholder="e.g. My OpenAI Dev Account"
                            className={inputClass}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${t.textMuted}`}>Provider</label>
                            <select
                              value={formProvider}
                              onChange={(e) => {
                                const prov = e.target.value as ApiKeyConfig['provider'];
                                setFormProvider(prov);
                                setFormModel(PROVIDER_MODELS[prov]?.[0] || 'default');
                              }}
                              className={selectStyle}
                            >
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic</option>
                              <option value="openrouter">OpenRouter</option>
                              <option value="deepseek">DeepSeek</option>
                              <option value="groq">Groq</option>
                              <option value="gemini">Gemini</option>
                            </select>
                          </div>
                          <div>
                            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${t.textMuted}`}>Model</label>
                            <select
                              value={formModel}
                              onChange={(e) => setFormModel(e.target.value)}
                              className={selectStyle}
                            >
                              {PROVIDER_MODELS[formProvider]?.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${t.textMuted}`}>Key Secret Token</label>
                          <input
                            type="password"
                            value={formKeyVal}
                            placeholder={formKeyVal === MASKED_KEY ? 'Securely vaulted in OS' : 'Enter API secret key...'}
                            onChange={(e) => setFormKeyVal(e.target.value)}
                            className={inputClass}
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-3">
                          <button
                            type="button"
                            onClick={handleSaveApiKey}
                            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${t.btnPrimary} ${t.btnPrimaryText}`}
                          >
                            <Save size={13} />
                            {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
                          </button>
                          
                          <AnimatePresence>
                            {saveStatus === 'saved' && (
                              <motion.span
                                className={`text-xs flex items-center gap-1 text-green-600 font-medium`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                              >
                                <CheckCircle size={13} /> Configuration Saved
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <Key size={32} className="opacity-30 mb-2" />
                        <span className="text-xs">No key selected. Click a key profile on the left or add a new one.</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
