import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProviderType = 'openai' | 'anthropic' | 'groq' | 'gemini';

interface AppState { // Changed from EldriState to AppState
  activeProvider: ProviderType;
  providers: Record<ProviderType, { key: string, model: string }>;
  sessions: Array<{ id: string, name: string, date: string, lastAnswer: string }>;
  
  setKey: (p: ProviderType, key: string) => void;
  setModel: (p: ProviderType, model: string) => void;
  setActiveProvider: (p: ProviderType) => void;
  saveSession: (name: string, answer: string) => void;
}

// Named back to useAppStore so Dashboard and Widget stop complaining
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProvider: 'openai',
      providers: {
        openai: { key: '', model: 'gpt-4o' },
        anthropic: { key: '', model: 'claude-3-5-sonnet-20240620' },
        groq: { key: '', model: 'llama3-70b-8192' },
        gemini: { key: '', model: 'gemini-1.5-pro' },
      },
      sessions: [],
      setKey: (p, key) => set((s) => ({ providers: { ...s.providers, [p]: { ...s.providers[p], key } } })),
      setModel: (p, model) => set((s) => ({ providers: { ...s.providers, [p]: { ...s.providers[p], model } } })),
      setActiveProvider: (p) => set({ activeProvider: p }),
      saveSession: (name, answer) => set((s) => ({
        sessions: [{ id: Date.now().toString(), name, date: new Date().toLocaleString(), lastAnswer: answer }, ...s.sessions]
      })),
    }),
    { name: 'eldri-vault' }
  )
);