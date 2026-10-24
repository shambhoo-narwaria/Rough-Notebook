import { doc, removeBlock } from './document.svelte';

export type SketchStroke = { id: string; points: { x: number; y: number }[]; color: string };

const MAX_SKETCH_UNDO = 50;

export const sketchStrokes = $state<SketchStroke[]>([]);
export const autoHandwritingActive = $state({ value: false });

export interface ConversionRecord {
  blockId: string;
  strokes: SketchStroke[];
  prevContent?: string;
  isNewBlock: boolean;
}

const conversionHistory = $state<ConversionRecord[]>([]);

const sketchUndoStack = $state<SketchStroke[][]>([]);
const sketchRedoStack = $state<SketchStroke[][]>([]);

function cloneStrokes(): SketchStroke[] {
  return JSON.parse(JSON.stringify(sketchStrokes)) as SketchStroke[];
}

export function appendSketchStroke(stroke: SketchStroke) {
  sketchUndoStack.push(cloneStrokes());
  if (sketchUndoStack.length > MAX_SKETCH_UNDO) sketchUndoStack.shift();
  sketchRedoStack.length = 0;
  sketchStrokes.push(stroke);
}

export function removeStrokesByIds(ids: string[]): SketchStroke[] {
  const idSet = new Set(ids);
  const removed: SketchStroke[] = [];
  const remaining: SketchStroke[] = [];

  for (const s of sketchStrokes) {
    if (idSet.has(s.id)) {
      removed.push(s);
    } else {
      remaining.push(s);
    }
  }

  if (removed.length > 0) {
    sketchUndoStack.push(cloneStrokes());
    if (sketchUndoStack.length > MAX_SKETCH_UNDO) sketchUndoStack.shift();
    sketchRedoStack.length = 0;
    sketchStrokes.length = 0;
    sketchStrokes.push(...remaining);
  }

  return removed;
}

export function registerHandwritingConversion(record: ConversionRecord) {
  conversionHistory.push(record);
  if (conversionHistory.length > 30) {
    conversionHistory.shift();
  }
}

export function undoLastHandwritingConversion(): boolean {
  if (conversionHistory.length === 0) return false;
  const last = conversionHistory.pop()!;
  if (last.isNewBlock) {
    // Remove generated block without polluting document undo stack
    removeBlock(last.blockId, true);
  } else if (last.prevContent !== undefined) {
    const b = doc.blocks.find((x) => x.id === last.blockId);
    if (b && b.type === 'note') {
      b.content = last.prevContent;
    }
  }
  // Restore original ink strokes
  sketchStrokes.push(...last.strokes);
  return true;
}

export function hasPendingHandwritingConversion(): boolean {
  return conversionHistory.length > 0;
}

export function clearAllSketches() {
  if (sketchStrokes.length > 0) {
    sketchUndoStack.push(cloneStrokes());
    if (sketchUndoStack.length > MAX_SKETCH_UNDO) sketchUndoStack.shift();
    sketchRedoStack.length = 0;
  }
  sketchStrokes.length = 0;
}

export function undoSketchStroke(): boolean {
  // If the most recent action was an auto-conversion, revert it first
  if (conversionHistory.length > 0) {
    return undoLastHandwritingConversion();
  }
  if (sketchUndoStack.length === 0) return false;
  sketchRedoStack.push(cloneStrokes());
  const prev = sketchUndoStack.pop()!;
  sketchStrokes.length = 0;
  sketchStrokes.push(...prev);
  return true;
}

export function redoSketchStroke(): boolean {
  if (sketchRedoStack.length === 0) return false;
  sketchUndoStack.push(cloneStrokes());
  const next = sketchRedoStack.pop()!;
  sketchStrokes.length = 0;
  sketchStrokes.push(...next);
  return true;
}

export function replaceSketches(newStrokes: SketchStroke[]) {
  sketchUndoStack.length = 0;
  sketchRedoStack.length = 0;
  conversionHistory.length = 0;
  sketchStrokes.length = 0;
  sketchStrokes.push(...JSON.parse(JSON.stringify(newStrokes)));
}
