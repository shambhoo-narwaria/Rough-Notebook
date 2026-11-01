import { doc, setBlocksDirect, type PlacedBlock } from './document.svelte';
import { sketchStrokes, replaceSketches, type SketchStroke } from './sketches.svelte';
import { readStoredNotebook, writeStoredNotebook } from './storage';

export interface NotebookPage {
  id: string;
  title: string;
  blocks: PlacedBlock[];
  sketches: SketchStroke[];
}

function createInitialPage(): NotebookPage {
  return {
    id: 'page-1',
    title: 'Page 1',
    blocks: [],
    sketches: [],
  };
}

const initialStored = readStoredNotebook();

function initialPages(): NotebookPage[] {
  if (initialStored && initialStored.pages && initialStored.pages.length > 0) {
    return initialStored.pages.map((p) => ({
      id: p.id || `page-${crypto.randomUUID()}`,
      title: p.title || 'Page',
      blocks: Array.isArray(p.blocks) ? p.blocks : [],
      sketches: Array.isArray(p.sketches) ? p.sketches : [],
    }));
  }
  return [createInitialPage()];
}

export const notebookPages = $state<NotebookPage[]>(initialPages());
export const activePageIndex = $state({ value: initialStored?.activePageIndex ?? 0 });

export function saveCurrentPageSnapshot() {
  const idx = activePageIndex.value;
  if (idx >= 0 && idx < notebookPages.length) {
    notebookPages[idx].blocks = JSON.parse(JSON.stringify(doc.blocks));
    notebookPages[idx].sketches = JSON.parse(JSON.stringify(sketchStrokes));
  }
}

export function persistNotebookToStorageNow(): boolean {
  saveCurrentPageSnapshot();
  return writeStoredNotebook({
    version: 1,
    savedAt: Date.now(),
    activePageIndex: activePageIndex.value,
    pages: notebookPages,
  });
}

export function switchToPage(targetIndex: number) {
  if (targetIndex < 0 || targetIndex >= notebookPages.length) return;
  if (targetIndex === activePageIndex.value) return;

  saveCurrentPageSnapshot();
  activePageIndex.value = targetIndex;

  const target = notebookPages[targetIndex];
  setBlocksDirect(target.blocks);
  replaceSketches(target.sketches);
  persistNotebookToStorageNow();
}

export function createNewPage(): number {
  saveCurrentPageSnapshot();
  const nextNum = notebookPages.length + 1;
  const newPage: NotebookPage = {
    id: `page-${crypto.randomUUID()}`,
    title: `Page ${nextNum}`,
    blocks: [],
    sketches: [],
  };
  notebookPages.push(newPage);
  activePageIndex.value = notebookPages.length - 1;
  setBlocksDirect([]);
  replaceSketches([]);
  persistNotebookToStorageNow();
  return activePageIndex.value;
}

export function goToPrevPage(): boolean {
  if (activePageIndex.value > 0) {
    switchToPage(activePageIndex.value - 1);
    return true;
  }
  return false;
}

export function goToNextPage(): boolean {
  if (activePageIndex.value < notebookPages.length - 1) {
    switchToPage(activePageIndex.value + 1);
    return true;
  }
  return false;
}

export function renamePage(index: number, newTitle: string): boolean {
  if (index >= 0 && index < notebookPages.length) {
    const trimmed = newTitle.trim();
    if (trimmed) {
      notebookPages[index].title = trimmed;
      persistNotebookToStorageNow();
      return true;
    }
  }
  return false;
}

export function deletePage(index: number): boolean {
  if (notebookPages.length <= 1) return false;
  if (index < 0 || index >= notebookPages.length) return false;

  const wasActive = index === activePageIndex.value;
  notebookPages.splice(index, 1);

  if (wasActive) {
    const nextIdx = Math.min(index, notebookPages.length - 1);
    activePageIndex.value = nextIdx;
    const target = notebookPages[nextIdx];
    setBlocksDirect(target.blocks);
    replaceSketches(target.sketches);
  } else if (index < activePageIndex.value) {
    activePageIndex.value -= 1;
  }
  persistNotebookToStorageNow();
  return true;
}

export function deleteCurrentPage(): boolean {
  return deletePage(activePageIndex.value);
}

export function exportNotebookAsJson(): string {
  saveCurrentPageSnapshot();
  const data = {
    app: 'rough-notebook',
    version: 1,
    exportedAt: new Date().toISOString(),
    activePageIndex: activePageIndex.value,
    pages: notebookPages,
  };
  return JSON.stringify(data, null, 2);
}

export function importNotebookFromJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.pages) || data.pages.length === 0) {
      return false;
    }
    notebookPages.length = 0;
    for (const p of data.pages) {
      notebookPages.push({
        id: p.id || `page-${crypto.randomUUID()}`,
        title: p.title || 'Page',
        blocks: Array.isArray(p.blocks) ? p.blocks : [],
        sketches: Array.isArray(p.sketches) ? p.sketches : [],
      });
    }

    const targetIdx =
      typeof data.activePageIndex === 'number'
        ? Math.max(0, Math.min(data.activePageIndex, notebookPages.length - 1))
        : 0;
    activePageIndex.value = targetIdx;

    const activePage = notebookPages[targetIdx];
    setBlocksDirect(activePage.blocks);
    replaceSketches(activePage.sketches);
    persistNotebookToStorageNow();
    return true;
  } catch (err) {
    console.error('Failed to import notebook JSON:', err);
    return false;
  }
}

