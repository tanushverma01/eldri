export interface SessionLog {
  id: string;
  timestamp: string;
  mode: string;
  query: string;
  response: string;
  screenshot?: string;
}

export interface AppSettings {
  provider: 'openai' | 'openrouter' | 'deepseek' | 'groq' | 'gemini';
  model: string;
  theme: 'dark' | 'light';
  customPrompts: { [key: string]: string };
}

const DEFAULT_PROMPTS: { [key: string]: string } = {
  'Code Reviewer': "You are Eldri Godmode. Review the codebase shown in the screenshot. Identify logic bugs, syntax issues, and optimization leaks. Offer clean, refactored code snippets.",
  'Interview Helper': "You are Eldri Godmode. The user is in a live technical interview. Analyze the screenshot, locate the problem statement, and provide code suggestions, optimized algorithms, and crucial hints.",
  'Exam Solver': "You are Eldri Godmode. Analyze the question on screen and provide the direct correct answer instantly. No fluff."
};

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'openai',
  model: 'gpt-4o',
  theme: 'dark',
  customPrompts: DEFAULT_PROMPTS
};

export const AppStorage = {
  getSettings(): AppSettings {
    const data = localStorage.getItem('eldri_settings');
    if (!data) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed, customPrompts: { ...DEFAULT_PROMPTS, ...(parsed.customPrompts || {}) } };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    localStorage.setItem('eldri_settings', JSON.stringify(settings));
    localStorage.setItem('eldri_provider', settings.provider);
    localStorage.setItem('eldri_model', settings.model);
    window.dispatchEvent(new Event('storage'));
  },

  getActiveProvider(): AppSettings['provider'] {
    const stored = localStorage.getItem('eldri_provider');
    if (stored && ['openai', 'openrouter', 'deepseek', 'groq', 'gemini'].includes(stored)) {
      return stored as AppSettings['provider'];
    }
    return this.getSettings().provider;
  },

  getActiveModel(): string {
    return localStorage.getItem('eldri_model') || this.getSettings().model;
  },

  getSystemPrompt(mode: string): string {
    const settings = this.getSettings();
    return settings.customPrompts[mode] || DEFAULT_PROMPTS[mode];
  },

  getSessions(): SessionLog[] {
    const data = localStorage.getItem('eldri_history');
    return data ? JSON.parse(data) : [];
  },

  addSession(log: Omit<SessionLog, 'id' | 'timestamp'>) {
    const history = this.getSessions();
    const newEntry: SessionLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString()
    };
    localStorage.setItem('eldri_history', JSON.stringify([newEntry, ...history]));
    window.dispatchEvent(new Event('storage'));
  }
};
