import { useState } from 'react';
import {
  Home, Clock, Grid, BookOpen, Settings, LifeBuoy, Plus,
  CheckCircle2, Search, MoreVertical, Play, Zap, ChevronRight,
  ExternalLink, Video, FileText, Send, ChevronLeft
} from 'lucide-react';
import { useAppStore, type ProviderType } from './store';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [isCollapsed, setIsCollapsed] = useState(false); // Brought back the collapse state!

  // Universal Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Bulletproof Godmode Launcher
  // Bulletproof Godmode Launcher (Tauri v2 Edition)
  const launchWidget = async () => {
    try {
      // Since it's already defined in tauri.conf.json, we just grab it by its label
      const widgetWindow = await WebviewWindow.getByLabel('widget');
      
      if (widgetWindow) {
        await widgetWindow.show(); // Unhide it
        await widgetWindow.setFocus(); // Bring it to the front
        showToast("Godmode Widget Activated");
      } else {
        showToast("Error: Widget window not found!");
      }
    } catch (e) {
      console.error("Failed to launch widget:", e);
      showToast("Error launching widget");
    }
  };
  const navItems = [
    { id: 'home', icon: <Home size={18} />, label: 'Home' },
    { id: 'sessions', icon: <Clock size={18} />, label: 'Sessions' },
    { id: 'modes', icon: <Grid size={18} />, label: 'Modes' },
  ];

  const bottomNavItems = [
    { id: 'guide', icon: <BookOpen size={18} />, label: 'Guide' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
    { id: 'support', icon: <LifeBuoy size={18} />, label: 'Support' },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-black selection:text-white relative overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-[260px]'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col justify-between shrink-0 z-10 relative`}>
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 z-50 transition-transform hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-8 px-2 overflow-hidden whitespace-nowrap">
            <div className="bg-black text-white rounded-xl w-8 h-8 flex items-center justify-center font-serif italic font-bold shadow-sm shrink-0">e</div>
            {!isCollapsed && <span className="font-bold text-lg tracking-tight animate-in fade-in duration-300">Eldri</span>}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <SidebarButton 
                key={item.id} icon={item.icon} label={item.label} 
                isActive={activeTab === item.id} isCollapsed={isCollapsed} 
                onClick={() => setActiveTab(item.id)} 
              />
            ))}
          </nav>
        </div>

        <div className="p-5">
          {!isCollapsed && (
            <div className="mb-6 px-2 animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Usage</span>
                <span className="bg-black text-white px-1.5 py-0.5 rounded text-[10px] font-bold">PRO</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-black h-full w-[35%] rounded-full"></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 font-medium">5 / 14 days remaining</p>
            </div>
          )}

          <nav className="space-y-1">
            {bottomNavItems.map((item) => (
              <SidebarButton 
                key={item.id} icon={item.icon} label={item.label} 
                isActive={activeTab === item.id} isCollapsed={isCollapsed} 
                onClick={() => setActiveTab(item.id)} 
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8 h-full flex flex-col">
          <div className="flex-1">
            {activeTab === 'home' && <HomeView launchWidget={launchWidget} />}
            {activeTab === 'sessions' && <SessionsView />}
            {activeTab === 'modes' && <ModesView showToast={showToast} />}
            {activeTab === 'guide' && <GuideView />}
            {activeTab === 'settings' && <SettingsView showToast={showToast} />}
            {activeTab === 'support' && <SupportView showToast={showToast} />}
          </div>
        </div>
      </main>

      {/* ================= GLOBAL TOAST NOTIFICATION ================= */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 z-[100] ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 size={18} className="text-green-400" />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

/* ================= COMPONENTS & VIEWS ================= */

function SidebarButton({ icon, label, isActive, isCollapsed, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      title={isCollapsed ? label : ''}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive ? 'bg-gray-100 text-black' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
      } ${isCollapsed ? 'justify-center px-0' : ''}`}
    >
      <div className="shrink-0">{icon}</div>
      {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function HomeView({ launchWidget }: { launchWidget: () => Promise<void> }) {
  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, User</h1>
      <p className="text-gray-500 mb-8">Ready to crush your next interview or debugging session?</p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <span className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2"><Zap size={16}/> Active Sessions</span>
          <span className="text-3xl font-bold">12</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <span className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2"><Clock size={16}/> Time Saved</span>
          <span className="text-3xl font-bold">4.5 hrs</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <span className="text-gray-500 text-sm font-medium mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> Eldri Responses</span>
          <span className="text-3xl font-bold">142</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-black to-gray-800 rounded-3xl p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Start a New Eldri Session</h2>
          <p className="text-gray-400 max-w-md">Launch the floating widget to get real-time AI assistance reading your screen and listening to your audio.</p>
        </div>
        <button 
          onClick={launchWidget}
          className="relative z-10 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 hover:scale-105 transition-all flex items-center gap-2 shadow-md active:scale-95"
        >
          <Play size={16} fill="currentColor" /> Launch Widget
        </button>
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 opacity-10 blur-3xl">
          <div className="w-64 h-64 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

function GuideView() {
  const guides = [
    { icon: <Video size={20} />, title: "How to use Interview Copilot", time: "3 min read" },
    { icon: <FileText size={20} />, title: "Connecting OpenAI & Anthropic", time: "2 min read" },
    { icon: <Zap size={20} />, title: "Mastering Keyboard Shortcuts", time: "1 min read" },
  ];

  return (
    <div className="animate-in fade-in duration-300 h-full">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Eldri Guide</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
            <div className="w-10 h-10 bg-gray-50 text-black rounded-xl flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition-colors">
              {guide.icon}
            </div>
            <h3 className="text-lg font-bold mb-2">{guide.title}</h3>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{guide.time}</span>
              <ChevronRight size={16} className="group-hover:text-black group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportView({ showToast }: any) {
  return (
    <div className="animate-in fade-in duration-300 h-full max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Help & Support</h1>
      <p className="text-gray-500 mb-8">Found a bug or need help setting up? Send us a direct message.</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
            <input type="text" placeholder="e.g. Widget is not capturing screen" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
            <textarea placeholder="Describe your issue in detail..." className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all min-h-[150px] resize-none" />
          </div>
          <button 
            onClick={() => showToast('Message sent to Support!')}
            className="w-full bg-black text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all"
          >
            <Send size={16} /> Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ showToast }: any) {
  const { providers, setKey, setModel, activeProvider, setActiveProvider } = useAppStore();
  const [selectedInUI, setSelectedInUI] = useState<ProviderType>('openai');

  const providerList: {id: ProviderType, name: string, models: string[]}[] = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4-turbo'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet', 'claude-3-opus'] },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
    { id: 'groq', name: 'Groq (Llama 3)', models: ['llama3-70b-8192', 'mixtral-8x7b-32768'] }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="flex gap-8">
        <div className="w-56 shrink-0 space-y-1">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-2">Providers</p>
           {providerList.map(p => (
             <button 
               key={p.id}
               onClick={() => setSelectedInUI(p.id)}
               className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedInUI === p.id ? 'bg-white shadow-sm border border-gray-200 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
             >
               {p.name}
               {activeProvider === p.id && <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
             </button>
           ))}
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 min-h-[500px] flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-bold">{providerList.find(p => p.id === selectedInUI)?.name} Configuration</h2>
              <p className="text-sm text-gray-500">Set up your API credentials and preferred model.</p>
            </div>
            <button 
              onClick={() => {
                setActiveProvider(selectedInUI);
                showToast(`${providerList.find(p => p.id === selectedInUI)?.name} set as Active`);
              }}
              disabled={activeProvider === selectedInUI || !providers[selectedInUI].key}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeProvider === selectedInUI ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-black text-white hover:bg-gray-800 disabled:opacity-30 active:scale-[0.98]'}`}
            >
              {activeProvider === selectedInUI ? 'Currently Active' : 'Set as Active'}
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">API Key</label>
              <input 
                type="password"
                value={providers[selectedInUI].key}
                onChange={(e) => setKey(selectedInUI, e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
                placeholder={`Enter ${selectedInUI} API Key...`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Preferred Model</label>
              <select 
                value={providers[selectedInUI].model}
                onChange={(e) => setModel(selectedInUI, e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none appearance-none cursor-pointer"
              >
                {providerList.find(p => p.id === selectedInUI)?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <a href="#" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 group">
              Get {selectedInUI} API Key <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <p className="text-[10px] text-gray-400 italic">Keys are stored locally on your machine.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsView() {
  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Recent Sessions</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search sessions..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black w-64 shadow-sm transition-all" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
              <th className="p-4 pl-6">Session Name</th>
              <th className="p-4">Mode</th>
              <th className="p-4">Date</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 cursor-pointer transition-colors">
              <td className="p-4 pl-6 font-medium text-gray-900">Frontend Engineer Interview</td>
              <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-100">Interview Helper</span></td>
              <td className="p-4 text-sm text-gray-500">Today, 2:30 PM</td>
              <td className="p-4 pr-6 text-right"><button className="p-1 hover:bg-gray-200 rounded-md transition-colors inline-flex"><MoreVertical size={18} className="text-gray-400" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModesView({ showToast }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const modes = [
    { title: "Interview Helper", description: "Listens to the interviewer and silently feeds you the perfect answers.", icon: "💼", tag: "Active", color: "bg-blue-50 border-blue-200 text-blue-500" },
    { title: "Code Assistant", description: "Reads your IDE in the background and suggests optimizations.", icon: "💻", tag: "Popular", color: "bg-purple-50 border-purple-200 text-purple-500" }
  ];

  return (
    <div className="animate-in fade-in duration-300 h-full flex flex-col pb-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Modes</h1>
          <p className="text-gray-500 mt-2">Select how you want Eldri to assist you right now.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-md hover:bg-gray-800 active:scale-[0.98] transition-all"
        >
          <Plus size={16} /> Create Custom
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modes.map((mode, index) => (
          <div key={index} className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col min-h-[220px]">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border text-2xl ${mode.color}`}>{mode.icon}</div>
              {mode.tag && <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${mode.tag === 'Active' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{mode.tag}</span>}
            </div>
            <h3 className="text-lg font-bold mb-2">{mode.title}</h3>
            <p className="text-sm text-gray-500 flex-1">{mode.description}</p>
          </div>
        ))}
      </div>

      {/* CREATE CUSTOM MODE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Custom Eldri Mode</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mode Name</label>
                <input type="text" placeholder="e.g. System Design Architect" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">System Prompt (Instructions)</label>
                <textarea 
                  placeholder="Tell Eldri how to act. e.g. 'You are a senior principal engineer evaluating architecture. Read the screen and suggest scalable cloud solutions...'" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors min-h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  showToast('Custom Mode Created Successfully!');
                }} 
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-black text-white hover:bg-gray-800 shadow-md active:scale-[0.98] transition-all"
              >
                Save Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}