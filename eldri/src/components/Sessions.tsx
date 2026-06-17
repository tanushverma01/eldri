import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Layers, Trash2, CheckSquare, Square, Mic } from 'lucide-react';
import { AppStorage, SessionLog } from '../utils/storage';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

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

export default function Sessions({ theme }: { theme: AppTheme }) {
  const [sessions, setSessions] = useState<SessionLog[]>(AppStorage.getSessions());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [viewSession, setViewSession] = useState<SessionLog | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const t = getThemeTokens(theme);

  useEffect(() => {
    const sync = () => setSessions(AppStorage.getSessions());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  };

  const handleDeleteSelected = () => {
    const history = AppStorage.getSessions();
    const updated = history.filter((s) => !selectedIds.has(s.id));
    localStorage.setItem('eldri_history', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setSessions(updated);
    setSelectedIds(new Set());
    setSelectMode(false);
    setShowConfirmDelete(false);
    if (viewSession && selectedIds.has(viewSession.id)) {
      setViewSession(null);
    }
  };

  const formatDate = (timestamp: string) => {
    const parts = timestamp.split(' - ');
    return parts[1] ?? parts[0] ?? timestamp;
  };

  if (viewSession) {
    const sessionIndex = sessions.findIndex((s) => s.id === viewSession.id);
    const displayNumber = sessionIndex !== -1 ? sessions.length - sessionIndex : 1;

    return (
      <motion.div
        className="max-w-3xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <motion.button
          type="button"
          onClick={() => setViewSession(null)}
          className={`text-sm mb-6 flex items-center gap-1.5 ${t.textMuted} hover:underline`}
          whileHover={{ x: -4 }}
        >
          <ChevronLeft size={14} /> Back to sessions
        </motion.button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${t.text}`}>Session #{displayNumber}</h1>
            <p className={`text-xs ${t.textMuted} mt-1`}>{viewSession.timestamp}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedIds(new Set([viewSession.id]));
              setShowConfirmDelete(true);
            }}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 size={13} /> Delete Session
          </button>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2 space-y-6">
            {/* Expanded Content Panel */}
            <div className={`rounded-xl border p-5 ${t.card} ${t.cardBorder}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted} block mb-3`}>
                Prompt Query
              </span>
              <p className={`text-sm font-medium ${t.text} mb-5`}>
                {viewSession.query || "(No Query Input)"}
              </p>

              <span className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted} block mb-2`}>
                Outputs
              </span>
              <div className={`p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 border ${t.cardBorder} max-h-96 overflow-y-auto custom-scrollbar`}>
                <pre className={`text-xs font-mono whitespace-pre-wrap leading-relaxed ${t.textSecondary}`}>
                  {viewSession.response}
                </pre>
              </div>
            </div>

            {/* Voice Transcript (if available) */}
            {viewSession.voiceTranscript && (
              <div className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Mic size={13} className="text-red-500" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>
                    Voice Transcript
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${t.textSecondary} italic`}>
                  "{viewSession.voiceTranscript}"
                </p>
              </div>
            )}

            {/* Storage metadata */}
            <div className={`rounded-xl border p-4 text-xs space-y-2.5 ${t.card} ${t.cardBorder} ${t.textSecondary}`}>
              <div className="flex justify-between">
                <span className={t.textMuted}>Mode Used:</span>
                <span className="font-semibold">{viewSession.mode}</span>
              </div>
              {viewSession.provider && (
                <div className="flex justify-between">
                  <span className={t.textMuted}>API Key Used:</span>
                  <span className="font-semibold capitalize">{viewSession.provider} ({viewSession.model || 'default'})</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={t.textMuted}>Saved-To Path:</span>
                <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded truncate max-w-[280px]" title={`C:\\Users\\AppData\\Local\\eldri\\sessions\\session-${viewSession.id}.json`}>
                  .../eldri/sessions/session-{viewSession.id.substring(0, 8)}.json
                </span>
              </div>
            </div>
          </div>

          {/* Screenshot Column */}
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted} block mb-2`}>
              Screenshot Context
            </span>
            {viewSession.screenshot ? (
              <div className="relative group">
                <img
                  src={viewSession.screenshot}
                  alt="Captured context screenshot"
                  className={`rounded-xl border object-cover w-full aspect-video md:aspect-auto md:h-72 shadow-sm ${t.cardBorder}`}
                />
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <a
                    href={viewSession.screenshot}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-white px-3 py-1.5 bg-black rounded-lg border border-zinc-700"
                  >
                    Open Image ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className={`rounded-xl border border-dashed flex items-center justify-center p-12 text-xs text-center ${t.cardBorder} ${t.textMuted}`}>
                No screenshot associated
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${t.card} ${t.cardBorder}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className={`text-lg font-bold ${t.text} mb-2`}>Delete Session?</h3>
              <p className={`text-sm ${t.textSecondary} mb-5`}>
                This action is permanent and will delete the selected session.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-full flex flex-col">
      <motion.div variants={item} className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${t.text}`}>Sessions</h1>
          <p className={`text-xs ${t.textMuted} mt-1`}>Manage and view past screen captures and analysis transcripts.</p>
        </div>

        <div className="flex gap-2">
          {selectMode && (
            <>
              <motion.button
                type="button"
                onClick={toggleSelectAll}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {selectedIds.size === sessions.length ? 'Deselect All' : 'Select All'}
              </motion.button>
              
              <motion.button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setShowConfirmDelete(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  selectedIds.size === 0
                    ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                whileHover={selectedIds.size > 0 ? { scale: 1.02 } : {}}
                whileTap={selectedIds.size > 0 ? { scale: 0.98 } : {}}
              >
                <Trash2 size={13} />
                Delete Selected ({selectedIds.size})
              </motion.button>
            </>
          )}

          <motion.button
            type="button"
            onClick={() => {
              setSelectMode(!selectMode);
              setSelectedIds(new Set());
            }}
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </motion.button>
        </div>
      </motion.div>

      {/* Grid of sessions */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-2.5 custom-scrollbar">
        {sessions.length === 0 ? (
          <motion.div
            variants={item}
            className={`text-center py-24 rounded-xl border border-dashed ${t.cardBorder} ${t.textMuted}`}
          >
            <Layers size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No sessions logged yet.</p>
            <p className="text-xs mt-1">Activate Eldri widget and run analysis to populate this tab.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {sessions.map((session, index) => {
              const displayNum = sessions.length - index;
              const isSelected = selectedIds.has(session.id);
              
              return (
                <motion.div
                  key={session.id}
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
                      onClick={() => toggleSelect(session.id)}
                      className={`text-black dark:text-white transition-opacity`}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  )}

                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.progressTrack} shrink-0`}>
                    <Clock size={14} className={t.textMuted} />
                  </div>

                  <div className="flex-1 min-w-0" onClick={() => selectMode && toggleSelect(session.id)}>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-bold text-sm ${t.text}`}>#{displayNum}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.progressTrack} ${t.textSecondary} text-[10px]`}>
                        {session.mode}
                      </span>
                      {session.voiceTranscript && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded">
                          🎤 Voice
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${t.textMuted} mt-0.5 truncate`}>
                      {session.query || "(No Query Input)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] ${t.textMuted} hidden sm:inline`}>
                      {formatDate(session.timestamp)}
                    </span>
                    <motion.button
                      type="button"
                      onClick={() => setViewSession(session)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${t.btnPrimary} ${t.btnPrimaryText}`}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Open
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Confirmation Modal for bulk delete */}
      {showConfirmDelete && selectMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${t.card} ${t.cardBorder}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className={`text-lg font-bold ${t.text} mb-2`}>Delete {selectedIds.size} Sessions?</h3>
            <p className={`text-sm ${t.textSecondary} mb-5`}>
              This action is permanent and cannot be undone. Are you sure you want to delete these sessions?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Selected
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
