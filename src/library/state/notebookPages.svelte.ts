import { doc, setBlocksDirect, type PlacedBlock } from './document.svelte';
import { sketchStrokes, replaceSketches, type SketchStroke } from './sketches.svelte';

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

export const notebookPages = $state<NotebookPage[]>([createInitialPage()]);
export const activePageIndex = $state({ value: 0 });

export function saveCurrentPageSnapshot() {
  const idx = activePageIndex.value;
  if (idx >= 0 && idx < notebookPages.length) {
    notebookPages[idx].blocks = JSON.parse(JSON.stringify(doc.blocks));
    notebookPages[idx].sketches = JSON.parse(JSON.stringify(sketchStrokes));
  }
}

export function switchToPage(targetIndex: number) {
  if (targetIndex < 0 || targetIndex >= notebookPages.length) return;
  if (targetIndex === activePageIndex.value) return;

  saveCurrentPageSnapshot();
  activePageIndex.value = targetIndex;

  const target = notebookPages[targetIndex];
  setBlocksDirect(target.blocks);
  replaceSketches(target.sketches);
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
  return true;
}

export function deleteCurrentPage(): boolean {
  return deletePage(activePageIndex.value);
}
