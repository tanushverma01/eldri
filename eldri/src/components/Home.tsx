import { Zap, Clock, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../utils/storage';

export default function Home({ theme }: { theme: AppSettings['theme'] }) {
  const isLight = theme === 'light';

  return (
    <div className={`font-sans ${isLight ? 'text-gray-900' : 'text-white'}`}>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
      <p className={`text-xs mb-8 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
        Ready for your next interview or debugging session?
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Zap, label: 'Active Sessions', value: '12' },
          { icon: Clock, label: 'Time Saved', value: '4.5 hrs' },
          { icon: CheckCircle2, label: 'Responses', value: '142' },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 border ${
              isLight ? 'bg-white border-gray-200' : 'bg-[#141414] border-[#262626]'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
              isLight ? 'text-gray-500' : 'text-zinc-500'
            }`}>
              <Icon size={13} className="text-purple-400" /> {label}
            </span>
            <span className="text-2xl font-bold">{value}</span>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl p-6 border ${
        isLight
          ? 'bg-purple-50 border-purple-200'
          : 'bg-gradient-to-br from-purple-900/40 to-[#141414] border-purple-500/20'
      }`}>
        <h2 className="text-lg font-bold mb-2">Start a New Eldri Session</h2>
        <p className={`text-xs max-w-md ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
          Launch the floating widget from the sidebar to get real-time AI assistance reading your screen.
        </p>
      </div>
    </div>
  );
}
