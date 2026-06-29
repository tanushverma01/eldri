import { motion } from 'framer-motion';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ExternalLink, Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import logoDark from '../assets/v1.svg';
import logoLight from '../assets/v2.svg';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const handleSignIn = async () => {
    try {
      await openUrl('https://eldri.app/auth/signin');
    } catch (err) {
      console.error('Browser OAuth launch failed:', err);
    }
    // Simulate callback for dev — deep link handler in App.tsx handles production
    onLoginSuccess();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white select-none relative">
      {/* Window Controls */}
      <div className="absolute top-0 right-0 p-4 flex items-center gap-1.5 z-50">
        <button
          type="button"
          onClick={() => getCurrentWindow().minimize()}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => getCurrentWindow().toggleMaximize()}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          onClick={() => getCurrentWindow().close()}
          className="p-1.5 rounded-lg hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Left Panel - 40% Width per spec */}
      <motion.div
        data-tauri-drag-region
        className="w-[40%] h-full flex flex-col justify-between p-16 border-r border-gray-100 cursor-move"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top: Logo + Wordmark — NOT clickable, branding only */}
        <div className="flex items-center gap-3 relative z-10 pointer-events-auto">
          <motion.img
            src={logoLight}
            alt="Eldri Logo"
            className="w-8 h-8 pointer-events-none select-none"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <span className="text-xl font-bold tracking-tight text-black">eldri</span>
        </div>

        {/* Center: Hero Text + CTA */}
        <div className="flex flex-col gap-10 my-auto max-w-sm">
          {/* Heading — spec: large, bold, black, left-aligned */}
          <motion.h1
            className="text-4xl font-extrabold tracking-tight text-black leading-[1.15]"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Whatever's On
            <br />
            Screen, Handled
          </motion.h1>

          {/* No subtitle between heading and button — breathing room only (per spec) */}

          {/* CTA + Legal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="space-y-5"
          >
            {/* CTA Button — spec: full width, dark/black fill, white text, rounded rectangle, ↗ arrow */}
            <button
              type="button"
              onClick={handleSignIn}
              className="w-full bg-black text-white py-4 px-6 rounded-xl font-bold text-sm hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-between shadow-sm group"
            >
              <span>Sign in with Browser</span>
              <ExternalLink size={16} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Legal copy — spec: small, light grey, links clickable */}
            <p className="text-gray-400 text-[11px] leading-relaxed">
              By signing up, you agree to our{' '}
              <a
                href="https://eldri.app/terms"
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-black hover:underline transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://eldri.app/privacy"
                target="_blank"
                rel="noreferrer"
                className="text-gray-500 hover:text-black hover:underline transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </motion.div>
        </div>

        {/* Bottom: Version */}
        <motion.div
          className="text-gray-300 text-[10px] font-mono tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          v2.0.0 &bull; PRIVATE BETA
        </motion.div>
      </motion.div>

      {/* Right Panel - 60% Width per spec — non-white, premium animation */}
      <motion.div
        data-tauri-drag-region
        className="w-[60%] h-full bg-black flex items-center justify-center relative overflow-hidden cursor-move"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Premium concentric geometric animation */}
        <div className="relative w-96 h-96 flex items-center justify-center">
          {/* Ring 1 - Outer dotted circle */}
          <motion.div
            className="absolute w-[360px] h-[360px] border border-zinc-800/80 rounded-full border-dashed"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />

          {/* Ring 2 - Rounded square, counter-rotating */}
          <motion.div
            className="absolute w-[290px] h-[290px] border border-zinc-800/50 rounded-[40px]"
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />

          {/* Ring 3 - Thin circle */}
          <motion.div
            className="absolute w-[220px] h-[220px] border border-zinc-700/30 rounded-full"
            animate={{ rotate: 180 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />

          {/* Ring 4 - Inner dashed square */}
          <motion.div
            className="absolute w-[160px] h-[160px] border border-zinc-600/20 rounded-2xl border-dashed"
            animate={{ rotate: -180 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />

          {/* Orbital dots */}
          <motion.div
            className="absolute w-[330px] h-[330px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-600 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-zinc-700 rounded-full" />
          </motion.div>

          {/* Center piece: Logo display */}
          <motion.div
            className="absolute w-28 h-28 border border-zinc-800 bg-zinc-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-black"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={logoDark}
              alt="Eldri"
              className="w-14 h-14 select-none pointer-events-none"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
