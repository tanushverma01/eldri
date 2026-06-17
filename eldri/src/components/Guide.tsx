import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function Guide({ theme }: { theme: AppTheme }) {
  const t = getThemeTokens(theme);

  const steps = [
    { title: 'Configure API keys', body: 'Open Settings and add your provider token. Keys are stored in the OS keychain.', icon: '🔑' },
    { title: 'Pick a mode', body: 'Choose Interview Helper, Code Reviewer, or Exam Solver — or create your own.', icon: '🎯' },
    { title: 'Start Eldri', body: 'Launch the floating widget and press Alt+Space to capture and analyse your screen.', icon: '🚀' },
    { title: 'Review sessions', body: 'Past analyses are saved under Sessions for quick recap.', icon: '📋' },
  ];

  return (
    <motion.div
      className="max-w-xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex items-center gap-3 mb-2">
        <BookOpen size={20} className={t.textMuted} />
        <h1 className={`text-2xl font-bold ${t.text}`}>Guide</h1>
      </motion.div>
      <motion.p variants={item} className={`text-sm mb-8 ${t.textSecondary}`}>Get the most out of Eldri in four steps.</motion.p>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            variants={item}
            className={`flex gap-4 p-5 rounded-2xl border group cursor-default ${t.card} ${t.cardBorder}`}
            whileHover={{ scale: 1.01, x: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.span
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${t.progressTrack}`}
              whileHover={{ scale: 1.1, rotate: 8 }}
            >
              {step.icon}
            </motion.span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>Step {i + 1}</span>
              </div>
              <p className={`font-semibold text-sm mb-1 ${t.text}`}>{step.title}</p>
              <p className={`text-sm leading-relaxed ${t.textSecondary}`}>{step.body}</p>
            </div>
            <ArrowRight size={16} className={`${t.textMuted} opacity-0 group-hover:opacity-100 transition-opacity self-center`} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
