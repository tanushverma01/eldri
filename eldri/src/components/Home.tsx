import { motion } from 'framer-motion';
import { Zap, Keyboard } from 'lucide-react';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

interface HomeProps {
  theme: AppTheme;
  onStart: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function Home({ theme, onStart }: HomeProps) {
  const t = getThemeTokens(theme);

  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center min-h-[420px] h-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className={`w-16 h-16 rounded-full ${t.logoBg} ${t.logoText} flex items-center justify-center font-serif italic font-bold text-3xl mb-6`}
        variants={item}
        whileHover={{ scale: 1.12, rotate: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        e
      </motion.div>

      <motion.h1 variants={item} className={`text-3xl font-bold mb-3 ${t.text}`}>
        Welcome to Eldri
      </motion.h1>

      <motion.p variants={item} className={`text-sm max-w-md mb-6 leading-relaxed ${t.textSecondary}`}>
        Your invisible AI assistant is ready. Click Start Eldri below to begin a session.
      </motion.p>

      <motion.div variants={item} className={`flex items-center gap-2 text-xs ${t.textMuted}`}>
        <Keyboard size={14} className={t.textMuted} />
        <span>Quick capture</span>
        <kbd className={`px-2 py-0.5 rounded border text-[10px] font-mono ${t.cardBorder} ${t.card}`}>Ctrl</kbd>
        <span>+</span>
        <kbd className={`px-2 py-0.5 rounded border text-[10px] font-mono ${t.cardBorder} ${t.card}`}>Shift</kbd>
        <span>+</span>
        <kbd className={`px-2 py-0.5 rounded border text-[10px] font-mono ${t.cardBorder} ${t.card}`}>E</kbd>
      </motion.div>

      <motion.button
        type="button"
        onClick={onStart}
        variants={item}
        className={`mt-8 px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 ${t.btnPrimary} ${t.btnPrimaryText} md:hidden`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Zap size={14} />
        Launch Widget
      </motion.button>
    </motion.div>
  );
}
