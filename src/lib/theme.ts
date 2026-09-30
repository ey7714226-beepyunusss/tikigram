export type ThemeMode = 'light' | 'dark' | 'system';

export const APP_NAME = 'Tiksta';

export const THEME_STORAGE_KEY = 'tiksta-theme';

export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  return stored ?? 'system';
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}

export function initTheme() {
  applyTheme(getStoredTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') applyTheme('system');
  });
}
