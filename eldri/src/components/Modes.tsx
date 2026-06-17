import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';
import { AppStorage } from '../utils/storage';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

const DEFAULT_MODES = ['Interview Helper', 'Code Reviewer', 'Exam Solver'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
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

export default function Modes({ theme }: { theme: AppTheme }) {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [settings, setSettings] = useState(AppStorage.getSettings());
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [newModePrompt, setNewModePrompt] = useState('');
  const t = getThemeTokens(theme);

  const modes = Object.keys(settings.customPrompts);

  const toggleMode = (name: string) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const saveNewMode = () => {
    if (!newModeName.trim()) return;
    const updated = {
      ...settings,
      customPrompts: {
        ...settings.customPrompts,
        [newModeName.trim()]: newModePrompt || `You are Eldri Godmode. Assist the user in ${newModeName.trim()} mode.`,
      },
    };
    AppStorage.saveSettings(updated);
    setSettings(updated);
    setNewModeName('');
    setNewModePrompt('');
    setView('list');
  };

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-current/10 ${t.input} ${t.inputBorder} ${t.text}`;

  if (view === 'create') {
    return (
      <motion.div
        className="max-w-xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <motion.button
          type="button"
          onClick={() => setView('list')}
          className={`text-sm mb-6 flex items-center gap-1 ${t.textMuted} hover:underline`}
          whileHover={{ x: -4 }}
        >
          <ChevronLeft size={14} /> Back to modes
        </motion.button>
        <h1 className={`text-2xl font-bold mb-6 ${t.text}`}>Create New Mode</h1>

        <motion.div
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Mode Name</label>
            <input type="text" value={newModeName} onChange={(e) => setNewModeName(e.target.value)} placeholder="e.g. Interview Helper" className={inputClass} />
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Prompt / Instructions</label>
            <textarea
              value={newModePrompt}
              onChange={(e) => setNewModePrompt(e.target.value)}
              placeholder="Describe what the AI should do when this mode is active..."
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Output Format</label>
            <div className={`relative ${inputClass} flex items-center justify-between cursor-default`}>
              Plain Text
              <ChevronDown size={14} className={t.textMuted} />
            </div>
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>Input Source</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm ${t.textSecondary}`}>
                <input type="checkbox" defaultChecked className="rounded" />
                Screen Capture
              </label>
              <label className={`flex items-center gap-2 text-sm ${t.textMuted}`}>
                <input type="checkbox" className="rounded" />
                Voice Input
              </label>
            </div>
          </div>
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${t.textMuted}`}>AI Model / API Key</label>
            <div className={`relative ${inputClass} flex items-center justify-between cursor-default`}>
              {settings.model} ({settings.provider})
              <ChevronDown size={14} className={t.textMuted} />
            </div>
          </div>
          <motion.button
            type="button"
            onClick={saveNewMode}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${t.btnPrimary} ${t.btnPrimaryText}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Save Mode
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${t.text}`}>Create Your Own Modes</h1>
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={() => setView('create')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold ${t.btnPrimary} ${t.btnPrimaryText}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={14} /> Create
          </motion.button>
          <motion.button
            type="button"
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedModes(new Set());
            }}
            className={`px-4 py-1.5 rounded-lg border text-sm font-medium ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {selectMode ? 'Done' : 'Select'}
          </motion.button>
        </div>
      </motion.div>

      <div className="space-y-3">
        {(modes.length ? modes : DEFAULT_MODES).map((mode) => (
          <motion.div
            key={mode}
            variants={item}
            className={`flex items-center gap-4 p-4 rounded-xl border ${t.card} ${t.cardBorder}`}
            whileHover={{ scale: 1.01, x: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {selectMode && (
              <input
                type="checkbox"
                checked={selectedModes.has(mode)}
                onChange={() => toggleMode(mode)}
                className="w-4 h-4 rounded"
              />
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${t.progressTrack}`}>
              {MODE_ICONS[mode] || <Sparkles size={16} className={t.textMuted} />}
            </div>
            <span className={`flex-1 text-sm font-medium ${t.text}`}>{mode}</span>
            <motion.button
              type="button"
              onClick={() => setView('create')}
              className={`text-xs px-3 py-1 rounded-lg border ${t.cardBorder} ${t.textMuted} hover:${t.text}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Edit
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
