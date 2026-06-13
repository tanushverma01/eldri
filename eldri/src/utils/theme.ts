import { AppSettings } from './storage';

export function applyTheme(theme: AppSettings['theme']) {
  const root = window.document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }
}
