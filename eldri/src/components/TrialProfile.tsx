import { motion } from 'framer-motion';
import { Calendar, Crown, LogOut, Mail, User, Shield } from 'lucide-react';
import { AppTheme, getThemeTokens } from '../utils/themeTokens';

interface TrialProfileProps {
  theme: AppTheme;
  onSignOut?: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

function getTrialDates(): { start: string; end: string; daysUsed: number; daysLeft: number } {
  const trialStartRaw = localStorage.getItem('eldri_trial_start');
  const startDate = trialStartRaw ? new Date(trialStartRaw) : new Date();

  // If no trial start stored, set it now
  if (!trialStartRaw) {
    localStorage.setItem('eldri_trial_start', startDate.toISOString());
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);

  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const daysUsed = Math.max(0, Math.min(14, Math.floor(diffMs / (1000 * 60 * 60 * 24))));
  const daysLeft = Math.max(0, 14 - daysUsed);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
    daysUsed,
    daysLeft,
  };
}

function getPlanLabel(): string {
  const plan = localStorage.getItem('eldri_selected_plan') || 'pro';
  switch (plan) {
    case 'free':
      return 'Free';
    case 'max':
      return 'Max';
    default:
      return 'Pro';
  }
}

export default function TrialProfile({ theme, onSignOut }: TrialProfileProps) {
  const t = getThemeTokens(theme);
  const { start, end, daysUsed, daysLeft } = getTrialDates();
  const email = localStorage.getItem('eldri_auth_email') || 'beta-tester@eldri.app';
  const planLabel = getPlanLabel();

  return (
    <motion.div
      className="max-w-2xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className={`text-2xl font-bold tracking-tight mb-1 ${t.text}`}>Profile</h1>
        <p className={`text-xs ${t.textSecondary}`}>Manage your active session, trial, and account credentials.</p>
      </motion.div>

      {/* Trial Status Card */}
      <motion.div
        variants={item}
        className={`rounded-2xl border overflow-hidden mb-6 ${t.card} ${t.cardBorder}`}
      >
        <div className={`px-6 py-4 border-b ${t.divider} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.btnPrimary} ${t.btnPrimaryText}`}>
              <Crown size={15} />
            </div>
            <div>
              <p className={`text-xs font-bold ${t.text}`}>Eldri {planLabel} Trial</p>
              <p className={`text-[10px] ${t.textMuted} mt-0.5`}>Full unlimited access enabled</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
              planLabel === 'Max'
                ? 'bg-gradient-to-r from-black to-zinc-800 text-white'
                : 'bg-black dark:bg-white text-white dark:text-black'
            }`}>
              {planLabel === 'free' ? 'FREE' : 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={13} className={t.textMuted} />
                <span className={`text-[9px] uppercase font-bold tracking-wider ${t.textMuted}`}>Trial Started</span>
              </div>
              <p className={`text-xs font-semibold ${t.text}`}>{start}</p>
            </div>
            <div className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={13} className={t.textMuted} />
                <span className={`text-[9px] uppercase font-bold tracking-wider ${t.textMuted}`}>Ends On</span>
              </div>
              <p className={`text-xs font-semibold ${t.text}`}>{end} (+14 days)</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`rounded-xl border p-4 ${t.card} ${t.cardBorder}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[9px] uppercase font-bold tracking-wider ${t.textMuted}`}>Trial Progress</span>
              <span className={`text-[10px] font-semibold ${t.text}`}>{daysUsed} / 14 days used</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${t.progressTrack}`}>
              <motion.div
                className={`h-full rounded-full ${t.progressFill}`}
                initial={{ width: 0 }}
                animate={{ width: `${(daysUsed / 14) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <p className={`text-[10px] mt-1.5 ${t.textMuted}`}>
              {daysLeft > 0
                ? `${daysLeft} days remaining in your trial`
                : 'Trial has ended — upgrade to continue'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Plan Info Card */}
      <motion.div
        variants={item}
        className={`rounded-2xl border overflow-hidden mb-6 ${t.card} ${t.cardBorder}`}
      >
        <div className={`px-6 py-4 border-b ${t.divider} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.btnPrimary} ${t.btnPrimaryText}`}>
            <Shield size={15} />
          </div>
          <p className={`text-xs font-bold ${t.text}`}>Current Plan</p>
        </div>
        <div className="p-6">
          <div className={`flex items-center gap-3 p-3 rounded-xl border bg-gray-50/30 dark:bg-zinc-900/30 ${t.cardBorder}`}>
            <Crown size={15} className={t.textMuted} />
            <div className="flex-1 min-w-0">
              <p className={`text-[9px] uppercase font-bold tracking-wider ${t.textMuted}`}>Active Plan</p>
              <p className={`text-xs font-bold ${t.text}`}>
                Eldri {planLabel}
                {planLabel !== 'free' && (
                  <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${t.badge} ${t.badgeText}`}>
                    TRIAL
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Info Card */}
      <motion.div
        variants={item}
        className={`rounded-2xl border overflow-hidden ${t.card} ${t.cardBorder}`}
      >
        <div className={`px-6 py-4 border-b ${t.divider} flex items-center gap-3`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.btnPrimary} ${t.btnPrimaryText}`}>
            <User size={15} />
          </div>
          <p className={`text-xs font-bold ${t.text}`}>Account Details</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Email row */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border bg-gray-50/30 dark:bg-zinc-900/30 ${t.cardBorder}`}>
            <Mail size={15} className={t.textMuted} />
            <div className="flex-1 min-w-0">
              <p className={`text-[9px] uppercase font-bold tracking-wider ${t.textMuted}`}>Email Address</p>
              <p className={`text-xs font-medium ${t.text} truncate`}>{email}</p>
            </div>
          </div>

          {/* Logout Action */}
          {onSignOut && (
            <motion.button
              type="button"
              onClick={onSignOut}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition w-full md:w-auto"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <LogOut size={13} />
              Sign Out from Device
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
