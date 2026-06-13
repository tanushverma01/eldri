import { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, Eye } from 'lucide-react';
import { AppStorage, SessionLog, AppSettings } from '../utils/storage';

export default function Sessions({ theme }: { theme: AppSettings['theme'] }) {
  const [sessions, setSessions] = useState<SessionLog[]>(AppStorage.getSessions());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionLog | null>(null);
  const isLight = theme === 'light';

  useEffect(() => {
    const handleSync = () => setSessions(AppStorage.getSessions());
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const purgeHistory = () => {
    if (confirm('Are you sure you want to completely erase the analytical session database?')) {
      localStorage.removeItem('eldri_history');
      setSessions([]);
      setSelectedSession(null);
    }
  };

  const filteredLogs = sessions.filter((s) =>
    s.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const card = isLight ? 'bg-white border-gray-200' : 'bg-[#121214] border-[#222226]';
  const cardHover = isLight ? 'hover:bg-gray-50' : 'hover:bg-[#16161B]';
  const textPrimary = isLight ? 'text-gray-900' : 'text-white';
  const textMuted = isLight ? 'text-gray-500' : 'text-zinc-500';
  const textBody = isLight ? 'text-gray-700' : 'text-zinc-300';
  const innerCard = isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#18181C] border-[#2E2E36]';

  return (
    <div className={`grid grid-cols-12 gap-5 font-sans h-[calc(100vh-60px)] ${textPrimary}`}>

      <div className="col-span-5 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Log Archive</h1>
            <p className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>Stored Analysed Frames</p>
          </div>
          {sessions.length > 0 && (
            <button onClick={purgeHistory} className={`${textMuted} hover:text-red-400 transition-colors p-1.5 rounded-lg`}>
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className={`${card} p-2 rounded-xl flex items-center gap-2 shrink-0 border`}>
          <Search size={14} className={`ml-1 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} />
          <input
            type="text"
            placeholder="Filter by term, code snippet, mode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent text-xs outline-none flex-1 font-medium placeholder:${isLight ? 'text-gray-400' : 'text-zinc-600'} ${textBody}`}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredLogs.length === 0 ? (
            <div className={`text-center p-8 border border-dashed rounded-2xl text-xs font-semibold ${
              isLight ? 'border-gray-300 text-gray-400' : 'border-zinc-800 text-zinc-600'
            }`}>
              No historical matches logged.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedSession(log)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  selectedSession?.id === log.id
                    ? 'bg-purple-600/10 border-purple-500/40 shadow-md'
                    : `${card} ${cardHover}`
                }`}
              >
                <div className="flex justify-between items-center w-full text-[10px]">
                  <span className="bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-md font-bold tracking-wider uppercase">{log.mode}</span>
                  <span className={`font-medium ${textMuted}`}>{log.timestamp.split(' - ')[0]}</span>
                </div>
                <p className={`text-xs font-bold line-clamp-1 ${isLight ? 'text-gray-800' : 'text-zinc-200'}`}>
                  {log.query || 'Standard Workspace Target Scan'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`col-span-7 ${card} rounded-2xl p-4 flex flex-col h-full overflow-hidden shadow-2xl border`}>
        {selectedSession ? (
          <div className="flex flex-col h-full overflow-hidden space-y-4 animate-in fade-in duration-200">
            <div className={`border-b pb-3 shrink-0 ${isLight ? 'border-gray-200' : 'border-[#222226]'}`}>
              <span className={`text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider mb-1 ${textMuted}`}>
                <Calendar size={12} /> {selectedSession.timestamp}
              </span>
              <h2 className="text-sm font-bold">{selectedSession.query || 'Implicit Matrix Prompt Frame Analysis'}</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedSession.screenshot && (
                <div className={`rounded-xl overflow-hidden border max-h-44 bg-black relative ${isLight ? 'border-gray-300' : 'border-[#2E2E36]'}`}>
                  <img src={selectedSession.screenshot} alt="Historical Reference State" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest border border-purple-500/20">
                    Archived Frame State
                  </div>
                </div>
              )}

              <div className={`${innerCard} p-3 rounded-xl border`}>
                <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${textMuted}`}>Eldri Architectural Verdict</p>
                <div className={`text-xs font-medium leading-relaxed whitespace-pre-wrap select-text ${textBody}`}>
                  {selectedSession.response}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center text-center text-xs font-bold ${textMuted}`}>
            <Eye size={24} className="mb-1.5 opacity-30 text-purple-500" />
            SELECT AN ELEMENT ENTRY TO DECRYPT SOLUTION INSIGHTS
          </div>
        )}
      </div>
    </div>
  );
}
