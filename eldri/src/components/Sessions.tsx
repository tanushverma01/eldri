import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, Layers } from 'lucide-react';
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

  const formatDate = (timestamp: string) => {
    const parts = timestamp.split(' - ');
    return parts[1] ?? parts[0] ?? timestamp;
  };

  if (viewSession) {
    return (
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <motion.button
          type="button"
          onClick={() => setViewSession(null)}
          className={`text-sm mb-4 flex items-center gap-1 ${t.textMuted} hover:underline`}
          whileHover={{ x: -4 }}
        >
          <ChevronLeft size={14} /> Back to sessions
        </motion.button>
        <h1 className={`text-2xl font-bold mb-2 ${t.text}`}>Session {sessions.indexOf(viewSession) + 1}</h1>
        <p className={`text-sm mb-4 ${t.textMuted}`}>{viewSession.timestamp} · {viewSession.mode}</p>
        {viewSession.screenshot && (
          <motion.img
            src={viewSession.screenshot}
            alt="Session capture"
            className={`rounded-xl border mb-4 max-h-48 object-cover w-full ${t.cardBorder}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <motion.div
          className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${t.textMuted}`}>Response</p>
          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${t.textSecondary}`}>{viewSession.response}</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold ${t.text}`}>Your Past Sessions</h1>
        <motion.button
          type="button"
          onClick={() => {
            setSelectMode(!selectMode);
            setSelectedIds(new Set());
          }}
          className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {selectMode ? 'Done' : 'Select'}
        </motion.button>
      </motion.div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <motion.div
            variants={item}
            className={`text-center py-16 rounded-xl border border-dashed ${t.cardBorder} ${t.textMuted}`}
          >
            <Layers size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No sessions yet. Start Eldri to capture your first analysis.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                variants={item}
                layout
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${t.card} ${t.cardBorder}`}
                whileHover={{ scale: 1.01, x: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(session.id)}
                    onChange={() => toggleSelect(session.id)}
                    className="w-4 h-4 rounded accent-current"
                  />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.progressTrack}`}>
                  <Clock size={14} className={t.textMuted} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${t.text}`}>#{sessions.length - index}</p>
                  <p className={`text-xs ${t.textMuted}`}>{formatDate(session.timestamp)}</p>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setViewSession(session)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${t.btnPrimary} ${t.btnPrimaryText}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Open
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
