import { Clock, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store';

export default function SessionsView() {
  const sessions = useAppStore((s) => s.sessions);

  return (
    <div className="animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Sessions</h1>
      <p className="text-gray-500 mb-8">Your past Eldri captures and AI responses.</p>

      {sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <MessageSquare size={32} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No sessions yet</p>
          <p className="text-sm text-gray-400 mt-1">Launch the widget and run Analyze to save your first session.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-bold">{session.name}</h3>
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <Clock size={12} /> {session.date}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{session.lastAnswer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
