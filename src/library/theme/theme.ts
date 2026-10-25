export type ThemeMode = 'light' | 'paper' | 'dark';

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('paper', 'dark');
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (mode === 'paper') {
    document.documentElement.classList.add('paper');
  }
  document.documentElement.setAttribute('data-theme', mode);
  try {
    localStorage.setItem('leetpad-theme', mode);
  } catch {
    // Ignore storage errors in restricted iframe/sandboxes
  }
}

export function getInitialTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem('leetpad-theme');
    if (saved === 'dark' || saved === 'paper' || saved === 'light') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}
