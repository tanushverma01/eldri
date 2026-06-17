import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home as HomeIcon,
  List,
  SlidersHorizontal,
  BookOpen,
  Sun,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Crown,
} from 'lucide-react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import Home from './components/Home';
import Sessions from './components/Sessions';
import Modes from './components/Modes';
import Settings from './components/Settings';
import Guide from './components/Guide';
import Support from './components/Support';
import TrialProfile from './components/TrialProfile';
import { AppStorage } from './utils/storage';
import { applyTheme } from './utils/theme';
import { getThemeTokens, AppTheme } from './utils/themeTokens';

type Tab = 'home' | 'sessions' | 'modes' | 'settings' | 'guide' | 'support' | 'trial';

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
};

function EldriLogo({ tokens, size = 'md' }: { tokens: ReturnType<typeof getThemeTokens>; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base';
  return (
    <motion.div
      className={`${dim} rounded-full ${tokens.logoBg} ${tokens.logoText} flex items-center justify-center font-serif italic font-bold shrink-0`}
      whileHover={{ scale: 1.1, rotate: 8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      e
    </motion.div>
  );
}

export default function Dashboard({ onSignOut }: { onSignOut?: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [config, setConfig] = useState(AppStorage.getSettings());

  const tokens = getThemeTokens(config.theme);

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
      const widget = await WebviewWindow.getByLabel('widget');
      if (widget) {
        await widget.show();
        await widget.setFocus();
      }
    } catch (err) {
      console.error('Failed to launch widget:', err);
    }
  };

  const trialDays = 5;
  const trialTotal = 14;

  const navItem = (id: Tab, icon: React.ReactNode, label: string) => (
    <motion.button
      key={id}
      type="button"
      onClick={() => setActiveTab(id)}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        activeTab === id ? tokens.navActive : tokens.navIdle
      } ${isCollapsed ? 'justify-center px-2' : ''}`}
      whileHover={{ x: isCollapsed ? 0 : 4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        animate={activeTab === id ? { scale: 1.1 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>
      {!isCollapsed && <span>{label}</span>}
    </motion.button>
  );

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
          <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
            <EldriLogo tokens={tokens} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="font-bold text-lg tracking-tight"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  Eldri
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <nav className="space-y-1">
            {navItem('home', <HomeIcon size={18} />, 'Home')}
            {navItem('sessions', <List size={18} />, 'Sessions')}
            {navItem('modes', <SlidersHorizontal size={18} />, 'Modes')}
          </nav>

          <div className="mt-auto space-y-4">
            {/* Clickable Trial Bar */}
            <AnimatePresence mode="wait">
              {isCollapsed ? (
                <motion.button
                  key="collapsed-trial"
                  type="button"
                  onClick={() => setActiveTab('trial')}
                  title="Trial & Profile"
                  className={`w-full flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeTab === 'trial'
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
                  className={`w-full text-left space-y-2 p-3 rounded-xl border transition-colors cursor-pointer ${
                    activeTab === 'trial'
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
                    <span className={tokens.textMuted}>{trialDays} / {trialTotal} days</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tokens.badge} ${tokens.badgeText}`}>PRO</span>
                  </div>
                  <div className={`h-1 rounded-full overflow-hidden ${tokens.progressTrack}`}>
                    <motion.div
                      className={`h-full rounded-full ${tokens.progressFill}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(trialDays / trialTotal) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                    />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>

            <nav className="space-y-1 pt-2 border-t border-inherit">
              {navItem('guide', <BookOpen size={18} />, 'Guide')}
              {navItem('settings', <Sun size={18} />, 'Settings')}
              {navItem('support', <HelpCircle size={18} />, 'Help & Support')}
            </nav>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
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
                {activeTab === 'home' && <Home theme={config.theme} onStart={startEldri} />}
                {activeTab === 'sessions' && <Sessions theme={config.theme} />}
                {activeTab === 'modes' && <Modes theme={config.theme} />}
                {activeTab === 'settings' && (
                  <Settings theme={config.theme} onThemeChange={handleThemeChange} onSignOut={onSignOut} />
                )}
                {activeTab === 'guide' && <Guide theme={config.theme} />}
                {activeTab === 'support' && <Support theme={config.theme} />}
                {activeTab === 'trial' && <TrialProfile theme={config.theme} onSignOut={onSignOut} />}
              </motion.div>
            </AnimatePresence>
          </div>

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