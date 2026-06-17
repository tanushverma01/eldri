import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List,
  SlidersHorizontal,
  BookOpen,
  Settings as SettingsIcon,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Crown,
} from 'lucide-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { openUrl } from '@tauri-apps/plugin-opener';
import Sessions from './components/Sessions';
import Modes from './components/Modes';
import Settings from './components/Settings';
import Guide from './components/Guide';
import TrialProfile from './components/TrialProfile';
import { AppStorage } from './utils/storage';
import { applyTheme } from './utils/theme';
import { getThemeTokens, AppTheme } from './utils/themeTokens';

type Tab = 'sessions' | 'modes' | 'settings' | 'guide' | 'trial';

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
};

function EldriLogo({ tokens, size = 'md' }: { tokens: ReturnType<typeof getThemeTokens>; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <motion.img
      src={tokens.logo}
      alt="Eldri Logo"
      className={`${dim} shrink-0 select-none pointer-events-none`}
      whileHover={{ scale: 1.1, rotate: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    />
  );
}

function getTrialInfo(): { daysUsed: number; daysLeft: number; total: number } {
  const trialStartRaw = localStorage.getItem('eldri_trial_start');
  if (!trialStartRaw) {
    return { daysUsed: 0, daysLeft: 14, total: 14 };
  }
  const startDate = new Date(trialStartRaw);
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const daysUsed = Math.max(0, Math.min(14, Math.floor(diffMs / (1000 * 60 * 60 * 24))));
  return { daysUsed, daysLeft: 14 - daysUsed, total: 14 };
}

export default function Dashboard({ onSignOut }: { onSignOut?: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [config, setConfig] = useState(AppStorage.getSettings());

  const tokens = getThemeTokens(config.theme);
  const trialInfo = getTrialInfo();

  useEffect(() => {
    const reloadConfig = () => setConfig(AppStorage.getSettings());
    window.addEventListener('storage', reloadConfig);
    return () => window.removeEventListener('storage', reloadConfig);
  }, []);

  useEffect(() => {
    applyTheme(config.theme);
  }, [config.theme]);

  useEffect(() => {
    applyTheme(AppStorage.getSettings().theme);
  }, []);

  const handleThemeChange = (theme: AppTheme) => {
    const updated = { ...AppStorage.getSettings(), theme };
    AppStorage.saveSettings(updated);
    setConfig((prev) => ({ ...prev, theme }));
  };

  const startEldri = async () => {
    try {
      let widget = await WebviewWindow.getByLabel('widget');
      if (!widget) {
        widget = new WebviewWindow('widget', {
          url: 'widget.html',
          title: 'Eldri Godmode',
          width: 380,
          height: 520,
          transparent: true,
          decorations: false,
          alwaysOnTop: true,
          resizable: true,
          shadow: true,
        });
      } else {
        await widget.show();
        await widget.unminimize();
        await widget.setFocus();
      }
      // Hide main dashboard when widget launches per spec
      const main = await WebviewWindow.getByLabel('main');
      if (main) {
        await main.hide();
      }
    } catch (err) {
      console.error('Failed to launch widget:', err);
    }
  };

  const navItem = (id: string, icon: React.ReactNode, label: string, onClickOverride?: () => void) => {
    const isActive = activeTab === id && !onClickOverride;
    return (
      <motion.button
        key={id}
        type="button"
        onClick={onClickOverride || (() => setActiveTab(id as Tab))}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? tokens.navActive : tokens.navIdle
          } ${isCollapsed ? 'justify-center px-2' : ''}`}
        whileHover={{ x: isCollapsed ? 0 : 4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <motion.div
          animate={isActive ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {icon}
        </motion.div>
        {!isCollapsed && <span>{label}</span>}
      </motion.button>
    );
  };

  return (
    <div className={`flex h-screen w-screen font-sans overflow-hidden select-none antialiased ${tokens.shell} ${tokens.text}`}>
      {/* Sidebar */}
      <motion.aside
        className={`${tokens.sidebar} border-r ${tokens.sidebarBorder} flex flex-col shrink-0 relative`}
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <motion.button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-3 top-6 z-10 p-1 rounded-full border shadow-sm transition-colors ${tokens.card} ${tokens.cardBorder} ${tokens.textMuted}`}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </motion.button>

        <div className="p-5 flex-1 flex flex-col overflow-hidden">
          {/* Logo - NOT clickable, branding only per spec */}
          <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
            <EldriLogo tokens={tokens} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="font-bold text-lg tracking-tight text-black dark:text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  eldri
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Top Nav: Sessions, Modes */}
          <nav className="space-y-1">
            {navItem('sessions', <List size={18} />, 'Sessions')}
            {navItem('modes', <SlidersHorizontal size={18} />, 'Modes')}
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto space-y-4">
            {/* Clickable Trial Bar */}
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.button
                  key="collapsed-trial"
                  type="button"
                  onClick={() => setActiveTab('trial')}
                  title="Trial & Profile"
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${activeTab === 'trial'
                      ? `${tokens.navActive} ${tokens.cardBorder}`
                      : `border-transparent hover:border-current/10 ${tokens.navIdle}`
                    }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Crown size={18} className={activeTab === 'trial' ? '' : tokens.textMuted} />
                </motion.button>
              ) : (
                <motion.button
                  key="expanded-trial"
                  type="button"
                  onClick={() => setActiveTab('trial')}
                  className={`w-full text-left space-y-2 p-3 rounded-xl border transition-colors cursor-pointer ${activeTab === 'trial'
                      ? `${tokens.navActive} ${tokens.cardBorder}`
                      : `border-transparent hover:border-current/10 ${tokens.navIdle}`
                    }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={tokens.textMuted}>{trialInfo.daysLeft} / {trialInfo.total} days left</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tokens.badge} ${tokens.badgeText}`}>PRO</span>
                  </div>
                  <div className={`h-1 rounded-full overflow-hidden ${tokens.progressTrack}`}>
                    <motion.div
                      className={`h-full rounded-full ${tokens.progressFill}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(trialInfo.daysUsed / trialInfo.total) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                    />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Bottom Nav: Guide, Settings, Help */}
            <nav className="space-y-1 pt-2 border-t border-inherit">
              {navItem('guide', <BookOpen size={18} />, 'Get Guide')}
              {navItem('settings', <SettingsIcon size={18} />, 'Settings')}
              {navItem('support', <HelpCircle size={18} />, 'Help', async () => {
                try {
                  await openUrl('https://eldri.app/support');
                } catch (err) {
                  console.error('Failed to open support URL:', err);
                }
              })}
            </nav>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-0 p-5 ${tokens.main}`}>
        <div className={`flex-1 flex flex-col rounded-2xl shadow-sm border overflow-hidden min-h-0 ${tokens.mainCard} ${tokens.cardBorder}`}>
          <div className="flex-1 overflow-y-auto p-8 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full"
              >
                {activeTab === 'sessions' && <Sessions theme={config.theme} />}
                {activeTab === 'modes' && <Modes theme={config.theme} />}
                {activeTab === 'settings' && (
                  <Settings theme={config.theme} onThemeChange={handleThemeChange} onSignOut={onSignOut} />
                )}
                {activeTab === 'guide' && <Guide theme={config.theme} />}
                {activeTab === 'trial' && <TrialProfile theme={config.theme} onSignOut={onSignOut} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Start Eldri Button — always visible below content panel per spec */}
          <div className={`shrink-0 px-8 pb-6 pt-2 border-t ${tokens.divider}`}>
            <motion.button
              type="button"
              onClick={startEldri}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${tokens.btnPrimary} ${tokens.btnPrimaryText}`}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Play size={14} fill="currentColor" />
              Start Eldri
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
}