import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, Sparkles, Trash2, CheckSquare, Square } from 'lucide-react';
import { AppStorage, ModeConfig } from '../utils/storage';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

const DEFAULT_MODES = ['Interview Helper', 'Code Reviewer', 'Exam Solver'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

const MODE_ICONS: Record<string, string> = {
  'Interview Helper': '💼',
  'Code Reviewer': '💻',
  'Exam Solver': '📝',
};

const MODELS_LIST = [
  // OpenAI
  { provider: 'openai', model: 'gpt-4o', label: 'OpenAI gpt-4o' },
  { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI gpt-4o-mini' },
  { provider: 'openai', model: 'o1-mini', label: 'OpenAI o1-mini' },
  { provider: 'openai', model: 'o3-mini', label: 'OpenAI o3-mini' },
  // Anthropic
  { provider: 'anthropic', model: 'claude-3-5-sonnet-latest', label: 'Anthropic Claude 3.5 Sonnet' },
  { provider: 'anthropic', model: 'claude-3-5-haiku-latest', label: 'Anthropic Claude 3.5 Haiku' },
  { provider: 'anthropic', model: 'claude-3-opus-latest', label: 'Anthropic Claude 3 Opus' },
  // Gemini
  { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { provider: 'gemini', model: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { provider: 'gemini', model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  // DeepSeek
  { provider: 'deepseek', model: 'deepseek-chat', label: 'DeepSeek Chat' },
  { provider: 'deepseek', model: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  // Groq
  { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Groq Llama 3.3 70B' },
  { provider: 'groq', model: 'mixtral-8x7b-32768', label: 'Groq Mixtral 8x7B' },
  // OpenRouter
  { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', label: 'OpenRouter Claude 3.5 Sonnet' },
  { provider: 'openrouter', model: 'google/gemini-2.5-pro', label: 'OpenRouter Gemini 2.5 Pro' },
  { provider: 'openrouter', model: 'deepseek/deepseek-r1', label: 'OpenRouter DeepSeek R1' },
];

export default function Modes({ theme }: { theme: AppTheme }) {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [settings, setSettings] = useState(AppStorage.getSettings());
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [editingModeKey, setEditingModeKey] = useState<string | null>(null);

  // Form Fields
  const [modeName, setModeName] = useState('');
  const [modePrompt, setModePrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState<ModeConfig['outputFormat']>('Text');
  const [inputRegion, setInputRegion] = useState<ModeConfig['inputRegion']>('Full Screen');
  const [inputSources, setInputSources] = useState<ModeConfig['inputSources']>(['Screen Capture']);
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);

  const t = getThemeTokens(theme);
  const modes = Object.keys(settings.customPrompts);

  const startCreate = () => {
    setEditingModeKey(null);
    setModeName('');
    setModePrompt('');
    setOutputFormat('Text');
    setInputRegion('Full Screen');
    setInputSources(['Screen Capture']);
    
    // Default model index to matching active setting
    const idx = MODELS_LIST.findIndex(
      (m) => m.provider === settings.provider && m.model === settings.model
    );
    setSelectedModelIndex(idx >= 0 ? idx : 0);
    setView('create');
  };

  const startEdit = (key: string) => {
    const config = AppStorage.getModeConfig(key);
    setEditingModeKey(key);
    setModeName(config.name);
    setModePrompt(config.prompt);
    setOutputFormat(config.outputFormat || 'Text');
    setInputRegion(config.inputRegion || 'Full Screen');
    setInputSources(config.inputSources || ['Screen Capture']);
    
    const idx = MODELS_LIST.findIndex(
      (m) => m.provider === config.provider && m.model === config.model
    );
    setSelectedModelIndex(idx >= 0 ? idx : 0);
    setView('edit');
  };

  const saveMode = () => {
    if (!modeName.trim()) return;
    const nameKey = editingModeKey || modeName.trim();
    const activeModel = MODELS_LIST[selectedModelIndex] || MODELS_LIST[0];

    const newModeConfig: ModeConfig = {
      name: nameKey,
      prompt: modePrompt.trim() || `You are Eldri Godmode. Assist the user in ${nameKey} mode.`,
      outputFormat,
      inputRegion,
      inputSources,
      model: activeModel.model,
      provider: activeModel.provider as any,
    };

    const updated = {
      ...settings,
      customPrompts: {
        ...settings.customPrompts,
        [nameKey]: newModeConfig.prompt,
      },
      modesConfig: {
        ...settings.modesConfig,
        [nameKey]: newModeConfig,
      },
    };

    AppStorage.saveSettings(updated);
    setSettings(updated);
    setView('list');
  };

  const toggleSelectModeCheckbox = (name: string) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const customPrompts = { ...settings.customPrompts };
    const modesConfig = { ...settings.modesConfig };

    selectedModes.forEach((name) => {
      // Don't delete predefined core system modes
      if (!DEFAULT_MODES.includes(name)) {
        delete customPrompts[name];
        delete modesConfig[name];
      }
    });

    const updated = {
      ...settings,
      customPrompts,
      modesConfig,
    };

    AppStorage.saveSettings(updated);
    setSettings(updated);
    setSelectedModes(new Set());
    setSelectMode(false);
  };

  const toggleInputSource = (source: 'Screen Capture' | 'Voice Input') => {
    setInputSources((prev) => {
      if (prev.includes(source)) {
        return prev.filter((s) => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm outline-none bg-white dark:bg-zinc-900 ${t.inputBorder} ${t.text} focus:border-black dark:focus:border-white transition-colors`;
  const selectStyle = `w-full border rounded-xl px-4 py-3 text-sm outline-none appearance-none bg-white dark:bg-zinc-900 ${t.inputBorder} ${t.text} focus:border-black dark:focus:border-white transition-colors cursor-pointer`;

  if (view === 'create' || view === 'edit') {
    const isEditingDefault = editingModeKey ? DEFAULT_MODES.includes(editingModeKey) : false;

    return (
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <motion.button
          type="button"
          onClick={() => setView('list')}
          className={`text-sm mb-6 flex items-center gap-1.5 ${t.textMuted} hover:underline`}
          whileHover={{ x: -4 }}
        >
          <ChevronLeft size={14} /> Back to modes
        </motion.button>
        <h1 className={`text-2xl font-bold mb-6 ${t.text}`}>
          {view === 'edit' ? `Edit Mode: ${editingModeKey}` : 'Create New Mode'}
        </h1>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-5">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Mode Name</label>
              <input
                type="text"
                disabled={isEditingDefault}
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
                placeholder="e.g. Design Auditor"
                className={`${inputClass} ${isEditingDefault ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
              />
              {isEditingDefault && (
                <p className="text-[10px] text-gray-400 mt-1">System default mode names cannot be changed.</p>
              )}
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Prompt Instructions</label>
              <textarea
                value={modePrompt}
                onChange={(e) => setModePrompt(e.target.value)}
                placeholder="Instruct the AI helper how to analyze screens..."
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Output Format</label>
              <div className="relative">
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as any)}
                  className={selectStyle}
                >
                  <option value="Text">Plain Text</option>
                  <option value="JSON">Structured JSON</option>
                  <option value="Bullet Points">Bullet Points</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Input Region</label>
              <div className="relative">
                <select
                  value={inputRegion}
                  onChange={(e) => setInputRegion(e.target.value as any)}
                  className={selectStyle}
                >
                  <option value="Full Screen">Full Screen Capture</option>
                  <option value="Region Select">Manual Region Select</option>
                  <option value="Window">Active Application Window</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2.5 ${t.textMuted}`}>Input Sources</label>
              <div className="space-y-3 p-4 border rounded-xl bg-gray-50/50 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800">
                <label className={`flex items-center gap-2.5 text-sm font-medium ${t.textSecondary} cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={inputSources.includes('Screen Capture')}
                    onChange={() => toggleInputSource('Screen Capture')}
                    className="w-4 h-4 rounded accent-black dark:accent-white"
                  />
                  Screen Capture (Context)
                </label>
                <label className={`flex items-center gap-2.5 text-sm font-medium ${t.textSecondary} cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={inputSources.includes('Voice Input')}
                    onChange={() => toggleInputSource('Voice Input')}
                    className="w-4 h-4 rounded accent-black dark:accent-white"
                  />
                  Voice Input (Audio Analysis)
                </label>
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>AI Model / API Provider</label>
              <div className="relative">
                <select
                  value={selectedModelIndex}
                  onChange={(e) => setSelectedModelIndex(Number(e.target.value))}
                  className={selectStyle}
                >
                  {MODELS_LIST.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 flex gap-3">
          <motion.button
            type="button"
            onClick={saveMode}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${t.btnPrimary} ${t.btnPrimaryText}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Save Mode Configuration
          </motion.button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-6 py-3 rounded-xl text-xs font-bold border transition-colors ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-full flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${t.text}`}>Modes</h1>
          <p className={`text-xs ${t.textMuted} mt-1`}>Configure and select AI assistant behaviors tailored to your workflows.</p>
        </div>

        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={startCreate}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold ${t.btnPrimary} ${t.btnPrimaryText}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={13} /> Create Mode
          </motion.button>

          {selectMode && (
            <motion.button
              type="button"
              disabled={selectedModes.size === 0}
              onClick={handleDeleteSelected}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                selectedModes.size === 0
                  ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              whileHover={selectedModes.size > 0 ? { scale: 1.02 } : {}}
              whileTap={selectedModes.size > 0 ? { scale: 0.98 } : {}}
            >
              <Trash2 size={13} /> Delete Custom ({selectedModes.size})
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedModes(new Set());
            }}
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </motion.button>
        </div>
      </motion.div>

      {/* Grid of custom modes */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-2.5 custom-scrollbar">
        <AnimatePresence initial={false}>
          {modes.map((mode) => {
            const isDefault = DEFAULT_MODES.includes(mode);
            const isSelected = selectedModes.has(mode);
            const config = AppStorage.getModeConfig(mode);
            
            return (
              <motion.div
                key={mode}
                variants={item}
                layout
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isSelected ? 'border-black dark:border-white bg-gray-50/50 dark:bg-zinc-900/50' : `${t.card} ${t.cardBorder}`
                }`}
                whileHover={{ scale: 1.005, x: 2 }}
              >
                {selectMode && (
                  <button
                    type="button"
                    disabled={isDefault}
                    onClick={() => toggleSelectModeCheckbox(mode)}
                    className={`text-black dark:text-white transition-opacity ${isDefault ? 'opacity-20 cursor-not-allowed' : ''}`}
                  >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${t.progressTrack} shrink-0`}>
                  {MODE_ICONS[mode] || <Sparkles size={16} className={t.textMuted} />}
                </div>

                <div className="flex-1 min-w-0" onClick={() => selectMode && !isDefault && toggleSelectModeCheckbox(mode)}>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${t.text}`}>{mode}</span>
                    {isDefault && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-400 rounded">
                        System
                      </span>
                    )}
                    {config.inputSources?.includes('Voice Input') && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-600 rounded">
                        🎤 Voice Enabled
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${t.textMuted} mt-0.5 truncate`}>
                    {config.prompt || 'No custom prompt instructions.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <motion.button
                    type="button"
                    onClick={() => startEdit(mode)}
                    className={`text-xs px-3 py-1.5 rounded-lg border ${t.cardBorder} ${t.textMuted} hover:${t.text} transition-colors`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Edit
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
