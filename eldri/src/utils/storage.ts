export interface SessionLog {
  id: string;
  timestamp: string;
  mode: string;
  query: string;
  response: string;
  screenshot?: string;
  provider?: string;
  model?: string;
  voiceTranscript?: string;
}

import { AppTheme, normalizeTheme } from './themeTokens';

export interface ModeConfig {
  name: string;
  prompt: string;
  outputFormat: 'Text' | 'JSON' | 'Bullet Points';
  inputRegion: 'Full Screen' | 'Region Select' | 'Window';
  inputSources: ('Screen Capture' | 'Voice Input')[];
  model: string;
  provider: string;
}

export interface AppSettings {
  provider: 'openai' | 'openrouter' | 'deepseek' | 'groq' | 'gemini' | 'anthropic';
  model: string;
  theme: AppTheme;
  customPrompts: { [key: string]: string };
  modesConfig: { [key: string]: ModeConfig };
}

const DEFAULT_PROMPTS: { [key: string]: string } = {
  'Code Reviewer': "You are Eldri, an elite AI code reviewer. Analyze the code shown on screen. Identify bugs, logic issues, security vulnerabilities, and performance problems. Provide clean, refactored code snippets with explanations. Be concise and direct.",
  'Interview Helper': "You are Eldri, an AI interview assistant. The user is in a live technical interview. Analyze the screen to find the problem statement. If voice input is provided, also consider the interviewer's spoken question. Provide clear solutions with optimized algorithms, code suggestions, and key hints. Be fast and direct — this is real-time.",
  'Exam Solver': "You are Eldri, an AI exam assistant. Analyze the question visible on screen and provide the correct answer immediately. Show your work briefly but prioritize speed and accuracy. If multiple choice, identify the correct option and explain why."
};

const DEFAULT_MODES_CONFIG: { [key: string]: ModeConfig } = {
  'Code Reviewer': {
    name: 'Code Reviewer',
    prompt: DEFAULT_PROMPTS['Code Reviewer'],
    outputFormat: 'Text',
    inputRegion: 'Full Screen',
    inputSources: ['Screen Capture'],
    model: 'gpt-4o',
    provider: 'openai'
  },
  'Interview Helper': {
    name: 'Interview Helper',
    prompt: DEFAULT_PROMPTS['Interview Helper'],
    outputFormat: 'Text',
    inputRegion: 'Region Select',
    inputSources: ['Screen Capture', 'Voice Input'],
    model: 'gpt-4o',
    provider: 'openai'
  },
  'Exam Solver': {
    name: 'Exam Solver',
    prompt: DEFAULT_PROMPTS['Exam Solver'],
    outputFormat: 'Bullet Points',
    inputRegion: 'Region Select',
    inputSources: ['Screen Capture'],
    model: 'gpt-4o',
    provider: 'openai'
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'openai',
  model: 'gpt-4o',
  theme: 'light',
  customPrompts: DEFAULT_PROMPTS,
  modesConfig: DEFAULT_MODES_CONFIG
};

// Session storage size limit — prevent localStorage from growing too large
const MAX_SESSIONS = 100;

export const AppStorage = {
  getSettings(): AppSettings {
    const data = localStorage.getItem('eldri_settings');
    if (!data) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(data);
      const customPrompts = { ...DEFAULT_PROMPTS, ...(parsed.customPrompts || {}) };

      // Upgrade logic for modesConfig
      const modesConfig = { ...DEFAULT_MODES_CONFIG };
      if (parsed.modesConfig) {
        Object.assign(modesConfig, parsed.modesConfig);
      } else {
        // Fallback for custom modes created before config update
        Object.keys(customPrompts).forEach(key => {
          if (!modesConfig[key]) {
            modesConfig[key] = {
              name: key,
              prompt: customPrompts[key],
              outputFormat: 'Text',
              inputRegion: 'Full Screen',
              inputSources: ['Screen Capture'],
              model: parsed.model || 'gpt-4o',
              provider: parsed.provider || 'openai'
            };
          }
        });
      }

      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        theme: normalizeTheme(parsed.theme),
        customPrompts,
        modesConfig
      };
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
    if (stored && ['openai', 'openrouter', 'deepseek', 'groq', 'gemini', 'anthropic'].includes(stored)) {
      return stored as AppSettings['provider'];
    }
    return this.getSettings().provider;
  },

  getActiveModel(): string {
    return localStorage.getItem('eldri_model') || this.getSettings().model;
  },

  getSystemPrompt(mode: string): string {
    const settings = this.getSettings();
    const modeConfig = settings.modesConfig[mode];
    if (modeConfig) return modeConfig.prompt;
    return settings.customPrompts[mode] || DEFAULT_PROMPTS[mode] || 'Analyze the screen content and provide helpful insights.';
  },

  getModeConfig(mode: string): ModeConfig {
    const settings = this.getSettings();
    return settings.modesConfig[mode] || {
      name: mode,
      prompt: settings.customPrompts[mode] || DEFAULT_PROMPTS[mode] || '',
      outputFormat: 'Text',
      inputRegion: 'Full Screen',
      inputSources: ['Screen Capture'],
      model: settings.model,
      provider: settings.provider
    };
  },

  getSessions(): SessionLog[] {
    try {
      const data = localStorage.getItem('eldri_history');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSession(log: Omit<SessionLog, 'id' | 'timestamp'>) {
    const history = this.getSessions();
    const newEntry: SessionLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString()
    };

    // Trim old sessions if over limit
    const updated = [newEntry, ...history].slice(0, MAX_SESSIONS);
    localStorage.setItem('eldri_history', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  // Trial management
  getTrialStart(): Date {
    const raw = localStorage.getItem('eldri_trial_start');
    if (raw) return new Date(raw);
    const now = new Date();
    localStorage.setItem('eldri_trial_start', now.toISOString());
    return now;
  },

  getSelectedPlan(): string {
    return localStorage.getItem('eldri_selected_plan') || 'pro';
  },
};
