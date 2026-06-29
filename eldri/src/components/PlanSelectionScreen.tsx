import { motion } from 'framer-motion';
import { Check, Crown, Zap, Sparkles, ArrowRight, Minus, Square, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import logoLight from '../assets/v2.svg';

interface PlanSelectionScreenProps {
  onPlanSelected: (plan: string) => void;
}

interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  cta: string;
  recommended?: boolean;
  icon: React.ReactNode;
}

const PLANS: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Get started with essentials',
    price: '$0',
    period: 'forever',
    features: [
      'Basic screen analysis',
      '3 sessions per day',
      '1 default mode',
      'Community support',
      'Standard AI models',
    ],
    cta: 'Start Free',
    icon: <Sparkles size={20} />,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Unlock the full experience',
    price: '$19',
    period: '/month after 14-day trial',
    badge: '★ MOST POPULAR',
    features: [
      '14-day free trial first',
      'Unlimited screen analysis',
      'All modes + custom creation',
      'Voice input & analysis',
      'Priority support',
      'Advanced AI models',
      'Session history & export',
      'Custom keybinds',
    ],
    cta: 'Start Free Trial',
    recommended: true,
    icon: <Crown size={20} />,
  },
  {
    id: 'max',
    name: 'Max',
    tagline: 'Maximum power for professionals',
    price: '$29',
    period: '/month',
    badge: 'ULTIMATE',
    features: [
      'Everything in Pro',
      'Premium AI models (GPT-4o, Claude)',
      'Team collaboration features',
      'Dedicated priority support',
      'Priority API routing',
      'Advanced analytics dashboard',
      'Custom integrations',
      'Unlimited session storage',
    ],
    cta: 'Go Max',
    icon: <Zap size={20} />,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 26 },
  },
};

export default function PlanSelectionScreen({ onPlanSelected }: PlanSelectionScreenProps) {

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white select-none">
      {/* Top Bar */}
      <motion.div
        data-tauri-drag-region
        className="flex items-center justify-between px-8 pt-5 pb-2 shrink-0 cursor-move"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2.5 relative z-10 pointer-events-auto">
          <motion.img
            src={logoLight}
            alt="Eldri Logo"
            className="w-6 h-6 pointer-events-none"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <span className="text-base font-bold tracking-tight text-black">eldri</span>
        </div>
        <div className="flex items-center gap-4 relative z-10 pointer-events-auto">
          <span className="text-[9px] text-gray-400 font-mono tracking-wider">CHOOSE YOUR PLAN</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => getCurrentWindow().minimize()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
              title="Minimize"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={() => getCurrentWindow().toggleMaximize()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
              title="Maximize"
            >
              <Square size={12} />
            </button>
            <button
              type="button"
              onClick={() => getCurrentWindow().close()}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        className="text-center px-8 pb-5 shrink-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mb-1.5 leading-tight">
          Unlock your full potential
        </h1>
        <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
          Start with a 14-day Pro trial — no credit card required. Upgrade anytime.
        </p>
      </motion.div>

      {/* Plan Cards */}
      <motion.div
        className="flex-1 flex items-stretch justify-center gap-5 px-8 pb-8 overflow-y-auto min-h-0"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {PLANS.map((plan) => {
          const isRecommended = plan.recommended;

          return (
            <motion.div
              key={plan.id}
              variants={cardVariant}
              className={`relative flex flex-col rounded-2xl border transition-all duration-300 w-full max-w-[320px] shrink-0 ${
                isRecommended
                  ? 'bg-black text-white border-black shadow-2xl shadow-black/20 scale-[1.01]'
                  : 'bg-white text-gray-900 border-gray-200 hover:border-gray-400 hover:shadow-lg'
              }`}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                    isRecommended
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div className="p-5 flex flex-col flex-1 justify-between">
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isRecommended ? 'bg-white/10' : 'bg-gray-100'
                    }`}
                  >
                    <span className={isRecommended ? 'text-white' : 'text-black'}>
                      {plan.icon}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold">{plan.name}</h2>
                    <p
                      className={`text-[10px] ${
                        isRecommended ? 'text-zinc-400' : 'text-gray-400'
                      }`}
                    >
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold">{plan.price}</span>
                    <span
                      className={`text-[11px] font-medium ${
                        isRecommended ? 'text-zinc-400' : 'text-gray-400'
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`h-px mb-4 ${
                    isRecommended ? 'bg-zinc-700' : 'bg-gray-100'
                  }`}
                />

                {/* Features */}
                <div className="space-y-2.5 flex-1 mb-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isRecommended ? 'bg-white/15' : 'bg-gray-100'
                        }`}
                      >
                        <Check
                          size={9}
                          strokeWidth={3}
                          className={isRecommended ? 'text-white' : 'text-black'}
                        />
                      </div>
                      <span
                        className={`text-[11px] leading-relaxed ${
                          isRecommended ? 'text-zinc-300' : 'text-gray-600'
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  type="button"
                  onClick={() => onPlanSelected(plan.id)}
                  className={`w-full mt-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isRecommended
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.cta}
                  <ArrowRight size={12} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer */}
      <motion.div
        className="text-center pb-4 shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-gray-400 text-[10px]">
          All plans include core screen capture and AI analysis. Cancel or change plans anytime.
        </p>
      </motion.div>
    </div>
  );
}
