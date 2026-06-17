import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanSelectionScreenProps {
  onPlanSelected: (plan: string) => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free Tier',
    price: '$0',
    detail: 'Core capture & 10 daily analyses',
    featured: false,
  },
  {
    id: 'pro',
    name: 'Eldri Pro',
    price: '$19',
    detail: 'Unlimited access for 2 weeks — no card required',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    detail: 'Team seats, SSO, and dedicated support',
    featured: false,
  },
] as const;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function PlanSelectionScreen({ onPlanSelected }: PlanSelectionScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');

  const activePlan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[1];

  return (
    <div className="flex h-screen bg-gray-50 p-10 gap-8">
      <motion.div
        className="w-1/2 p-10 flex flex-col justify-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="wait">
          {activePlan.featured && (
            <motion.div
              key="badge"
              className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold w-fit mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              ★ 2-Week Free Trial
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h1 variants={item} className="text-5xl font-bold mb-6 leading-tight">
          You&apos;ve been upgraded to{' '}
          <AnimatePresence mode="wait">
            <motion.span
              key={activePlan.name}
              className="italic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {activePlan.name}!
            </motion.span>
          </AnimatePresence>
        </motion.h1>

        <motion.p variants={item} className="text-gray-600 mb-8">{activePlan.detail}</motion.p>

        <motion.div variants={item} className="grid gap-3 mb-8">
          {PLANS.map((plan) => (
            <motion.button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedPlan === plan.id
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">{plan.name}</span>
                <span className="text-sm font-semibold text-gray-500">{plan.price}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{plan.detail}</p>
            </motion.button>
          ))}
        </motion.div>

        <motion.button
          type="button"
          onClick={() => onPlanSelected(activePlan.name)}
          className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 w-fit"
          variants={item}
          whileHover={{ scale: 1.03, x: 4 }}
          whileTap={{ scale: 0.97 }}
        >
          Great, Continue
        </motion.button>
      </motion.div>

      <motion.div
        className="w-1/2 bg-gray-950 rounded-3xl flex flex-col items-center justify-center text-white overflow-hidden relative"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Decorative glow */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl bg-white"
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activePlan.id}
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-4xl font-bold">
              Eldri{' '}
              <span className="bg-gray-800 px-2 rounded ml-1">
                {activePlan.id === 'pro' ? 'PRO' : activePlan.id === 'enterprise' ? 'ENT' : 'FREE'}
              </span>
            </h2>
            <p className="text-gray-500 mt-2">
              {activePlan.id === 'pro' ? 'Unlimited for 2 weeks' : activePlan.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
