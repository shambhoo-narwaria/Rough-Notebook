export const STORAGE_KEY = 'rough-notebook-data-v1';

export interface StoredPage {
  id: string;
  title: string;
  blocks: any[];
  sketches: any[];
}

export interface StoredNotebook {
  version: number;
  savedAt: number;
  activePageIndex: number;
  pages: StoredPage[];
}

export function readStoredNotebook(): StoredNotebook | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0) return null;
    const activePageIndex =
      typeof parsed.activePageIndex === 'number'
        ? Math.max(0, Math.min(parsed.activePageIndex, parsed.pages.length - 1))
        : 0;
    return {
      version: parsed.version || 1,
      savedAt: parsed.savedAt || Date.now(),
      activePageIndex,
      pages: parsed.pages,
    };
  } catch (err) {
    console.warn('Could not read stored notebook from localStorage:', err);
    return null;
  }
}

export function writeStoredNotebook(data: StoredNotebook): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('Could not save notebook to localStorage:', err);
    return false;
  }
}
