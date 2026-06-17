import { motion } from 'framer-motion';
import { Calendar, Crown, LogOut, Mail, Shield } from 'lucide-react';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

interface TrialProfileProps {
  theme: AppTheme;
  onSignOut?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

export default function TrialProfile({ theme, onSignOut }: TrialProfileProps) {
  const t = getThemeTokens(theme);

  const trialStart = 'Apr 20, 2026';
  const trialEnd = 'May 4, 2026';
  const trialDays = 14;
  const daysUsed = 5;
  const daysRemaining = trialDays - daysUsed;
  const email = localStorage.getItem('eldri_user_email') || 'user@eldri.app';

  return (
    <motion.div
      className="max-w-2xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className={`text-2xl font-bold mb-1 ${t.text}`}>Trial & Profile</h1>
        <p className={`text-sm ${t.textSecondary}`}>Manage your subscription and account details.</p>
      </motion.div>

      {/* Trial Status Card */}
      <motion.div
        variants={item}
        className={`rounded-2xl border overflow-hidden mb-6 ${t.card} ${t.cardBorder}`}
      >
        {/* Trial Header Bar */}
        <div className={`px-6 py-4 border-b ${t.divider} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.btnPrimary} ${t.btnPrimaryText}`}>
            <Crown size={16} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${t.text}`}>Pro Trial</p>
            <p className={`text-xs ${t.textMuted}`}>{daysRemaining} days remaining</p>
          </div>
          <motion.div
            className={`text-[10px] font-bold px-3 py-1 rounded-full ${t.badge} ${t.badgeText}`}
            whileHover={{ scale: 1.05 }}
          >
            ACTIVE
          </motion.div>
        </div>

        {/* Trial Progress */}
        <div className="px-6 py-5 space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-medium ${t.textMuted}`}>Trial Progress</span>
              <span className={`text-xs font-bold ${t.text}`}>{daysUsed} / {trialDays} days</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${t.progressTrack}`}>
              <motion.div
                className={`h-full rounded-full ${t.progressFill}`}
                initial={{ width: 0 }}
                animate={{ width: `${(daysUsed / trialDays) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className={t.textMuted} />
                <span className={`text-[10px] uppercase font-bold tracking-wider ${t.textMuted}`}>Trial Started</span>
              </div>
              <p className={`text-sm font-semibold ${t.text}`}>{trialStart}</p>
            </motion.div>
            <motion.div
              className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className={t.textMuted} />
                <span className={`text-[10px] uppercase font-bold tracking-wider ${t.textMuted}`}>Ends On</span>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${t.text}`}>{trialEnd}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badge} ${t.badgeText}`}>+{trialDays} days</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        variants={item}
        className={`rounded-2xl border overflow-hidden mb-6 ${t.card} ${t.cardBorder}`}
      >
        <div className={`px-6 py-4 border-b ${t.divider} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.btnPrimary} ${t.btnPrimaryText}`}>
            <Shield size={16} />
          </div>
          <p className={`text-sm font-semibold ${t.text}`}>Profile</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Email Row */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${t.cardBorder}`}>
            <Mail size={16} className={t.textMuted} />
            <div className="flex-1">
              <p className={`text-[10px] uppercase font-bold tracking-wider ${t.textMuted}`}>Email</p>
              <p className={`text-sm font-medium ${t.text}`}>{email}</p>
            </div>
          </div>

          {/* Logout Button */}
          {onSignOut && (
            <motion.button
              type="button"
              onClick={onSignOut}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${t.btnSecondary} ${t.btnSecondaryBorder} ${t.btnSecondaryText}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut size={14} />
              Logout
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Upgrade CTA */}
      <motion.div
        variants={item}
        className={`rounded-2xl border p-6 text-center ${t.card} ${t.cardBorder}`}
      >
        <p className={`text-xs ${t.textMuted} mb-3`}>Want to keep using Eldri after your trial?</p>
        <motion.button
          type="button"
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold ${t.btnPrimary} ${t.btnPrimaryText}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Upgrade to Pro
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
