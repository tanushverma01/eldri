import { motion } from 'framer-motion';
import { openUrl } from '@tauri-apps/plugin-opener';

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
    onLoginSuccess();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <motion.div
        className="w-1/2 bg-white flex flex-col justify-center p-20"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-serif italic font-bold text-lg mb-8"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          whileHover={{ scale: 1.1, rotate: 8 }}
        >
          e
        </motion.div>

        <motion.h1
          className="text-5xl font-bold mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Whatever&apos;s On
          <br />
          Screen, Handled
        </motion.h1>

        <motion.button
          type="button"
          onClick={handleSignIn}
          className="bg-black text-white px-8 py-4 rounded-xl font-bold w-fit hover:bg-gray-800 transition-colors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          whileHover={{ scale: 1.03, x: 4 }}
          whileTap={{ scale: 0.97 }}
        >
          Sign in with Browser ↗
        </motion.button>

        <motion.p
          className="text-gray-400 text-sm mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </motion.p>
      </motion.div>

      <motion.div
        className="w-1/2 bg-gray-950 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="w-64 h-64 border border-gray-800 rounded-full flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.4 }}
        >
          <motion.span
            className="text-gray-800 text-9xl font-bold"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            e
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
}
