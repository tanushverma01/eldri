import { motion } from 'framer-motion';
import { HelpCircle, ChevronRight } from 'lucide-react';
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

export default function Support({ theme }: { theme: AppTheme }) {
  const t = getThemeTokens(theme);

  const faqs = [
    { q: 'Widget not appearing?', a: 'Use Ctrl+Shift+E or click Start Eldri. Check the system tray if the dashboard was closed.', icon: '🖥️' },
    { q: 'Missing API token error?', a: 'Go to Settings → API Keys and save your provider key to the hardware vault.', icon: '🔐' },
    { q: 'Capture shows the widget?', a: 'Eldri hides the overlay briefly during capture — wait for the analysis to complete.', icon: '📸' },
  ];

  return (
    <motion.div
      className="max-w-xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex items-center gap-3 mb-2">
        <HelpCircle size={20} className={t.textMuted} />
        <h1 className={`text-2xl font-bold ${t.text}`}>Help & Support</h1>
      </motion.div>
      <motion.p variants={item} className={`text-sm mb-8 ${t.textSecondary}`}>Need help? Reach out or check common fixes below.</motion.p>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <motion.div
            key={faq.q}
            variants={item}
            className={`p-5 rounded-2xl border group cursor-default flex gap-4 ${t.card} ${t.cardBorder}`}
            whileHover={{ scale: 1.01, x: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${t.progressTrack}`}>
              {faq.icon}
            </span>
            <div className="flex-1">
              <p className={`font-semibold text-sm mb-1 ${t.text}`}>{faq.q}</p>
              <p className={`text-sm leading-relaxed ${t.textSecondary}`}>{faq.a}</p>
            </div>
            <ChevronRight size={16} className={`${t.textMuted} opacity-0 group-hover:opacity-100 transition-opacity self-center`} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
