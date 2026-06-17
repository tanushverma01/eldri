import { AppTheme, normalizeTheme } from './themeTokens';

export function applyTheme(theme: AppTheme | string) {
  const normalized = normalizeTheme(theme);
  const root = window.document.documentElement;
  root.setAttribute('data-theme', normalized);
  root.classList.remove('light', 'dark', 'mono', 'purple');
  root.classList.add(normalized === 'light' ? 'light' : normalized);
}

export type { AppTheme };
