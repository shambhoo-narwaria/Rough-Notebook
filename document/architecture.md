# Architecture and Technical Design

## Overview

Rough Notebook is a browser-based, keyboard-first digital scratch pad built for Data Structures and Algorithms (DSA) problem solving. The application combines reactive structured widgets (such as indexed arrays and matrix grids) with a freehand vector drawing layer on an infinite canvas workspace.

The architecture emphasizes:
- Low-latency keyboard interactions.
- Deterministic state management via Svelte 5 Runes.
- Separation between canvas navigation, structured widgets, and vector pen sketching.
- Zero server-side dependency (pure client-side static application).

---

## State Management Architecture

State in Rough Notebook is centralized within reactive module stores using Svelte 5 Runes (`$state` and `$derived`). State is not wrapped inside opaque store classes or external flux libraries, ensuring clean synchronous mutation and microtask-level batching.

### 1. Document Store (`src/library/state/document.svelte.ts`)

The document store maintains the active structured blocks, selection state, and the structural undo/redo history.

```typescript
export type PlacedBlock = Block & {
  x: number;
  y: number;
  width?: number;
  height?: number;
};

export const doc = $state({
  blocks: [] as PlacedBlock[],
  selectedBlockId: null as string | null,
  cellLinearFocus: null as { blockId: string; index: number } | null,
  insertAnchor: null as { x: number; y: number } | null,
});
```

Key Responsibilities:
- **Block Lifecycle:** Creation (`placeBlockAt`), modification (`moveBlock`, `resizeBlock`), and deletion (`removeBlock`).
- **Selection System:** Tracks `selectedBlockId` and `cellLinearFocus` to allow keyboard events to distinguish between widget-level manipulation and text-editing inside cells.
- **Undo History:** A lightweight immutable snapshot stack (`undoStack` and `redoStack`) storing document block arrays. Snapshots are pushed synchronously prior to destructive operations.

### 2. Freehand Sketch Store (`src/library/state/sketches.svelte.ts`)

Sketches are stored independently from the document widget tree to keep pen tracing fluid and decouple high-frequency drawing points from widget re-renders.

```typescript
export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface SketchStroke {
  id: string;
  points: StrokePoint[];
  color: string;
  width: number;
}
```

Key Responsibilities:
- Holds the reactive `sketchStrokes` array.
- Manages an isolated undo/redo stack (`sketchUndoStack`, `sketchRedoStack`) dedicated to freehand pen paths.
- Provides `appendSketchStroke`, `undoSketchStroke`, `removeStrokesByIds`, and `clearAllSketches`.
- Tracks `conversionHistory` to support reverting auto-converted text back into original ink strokes.

### 3. Handwriting Recognition Pipeline (`src/library/handwriting/handwritingRecognizer.ts`)

The background recognition engine decouples ink gathering from text conversion:
- Translates ink coordinates relative to bounding box origins.
- Calls Google Handwriting Input Tools asynchronously via client-side fetch.
- Rejects noise and low-confidence candidates (threshold >= 0.70).
- Applies algorithmic heuristics to clean common DSA notation (`O(n)`, `arr[i]`, `->`, etc.).
- Seamlessly places converted text into standard `NoteBlock` widgets without modal review prompts.

---

## Component Hierarchy and Interaction Model

The UI is divided into distinct layers positioned in a unified viewport:

```
RoughNotebook.svelte (Main Coordinator)
|
+-- Header.svelte (Toolbar, Mode Toggles, Color Selector, Theme Switch)
|
+-- ScratchCanvas.svelte (Interactive Canvas Workspace)
|   |
|   +-- Viewport Container (CSS dot-grid background, pan/scroll handler)
|   |   |
|   +-- Canvas Surface (Virtual boundary: 3200px x 2400px)
|   |       |
|   |       +-- Vector Sketch Display (SVG element rendering finalized strokes)
|   |       +-- Interactive Pen Capture Layer (Active when pen mode is toggled)
|   |       +-- Placed Block Containers (Positioned via inline style transform)
|   |       |   +-- ArrayBlock.svelte
|   |       |   +-- MatrixBlock.svelte
|   |       |   +-- NoteBlock.svelte
|   |       |   +-- SpineBlock.svelte
|   |       +-- CanvasRadialMenu.svelte (Quick tools wheel on empty canvas click)
|   |       +-- StructureMenu.svelte (Context menu on block right-click)
|
+-- SlashPalette.svelte (Keyboard Command Palette, bound to Cmd/Ctrl + /)
+-- AutoCreateModal.svelte (Smart string/JSON parser modal)
+-- DimensionModal.svelte (Grid size prompt modal)
+-- ClearConfirmModal.svelte (Destructive action confirmation)
+-- HelpModal.svelte (Keyboard reference and guide)
```

---

## Canvas Layout and Collision Resolution

### Coordinate Space
- The canvas surface operates on an absolute pixel plane initialized at `3200px x 2400px`.
- Users navigate using trackpad gestures or by toggling Hand mode (`H` key) to click-and-drag.
- Widget positions are anchored by their top-left `(x, y)` coordinates.

### Non-Overlap Engine (`src/library/layout/layoutResolve.ts`)
When a block is inserted or pasted, `resolveNonOverlapForBlock` calculates the bounding box of the incoming widget against all existing widgets. If an intersection is detected:
1. The engine checks horizontal and vertical clearances.
2. It translates the candidate position downwards or sideways to the nearest unoccupied slot.
3. This prevents blocks from visually overlapping when multiple structures are instantiated rapidly.

---

## Input Parsing and Smart Auto-Creation

The parser module (`src/library/parser/parseStructureInput.ts`) allows users to copy raw inputs from problem statements or LeetCode testcases and convert them directly into interactive widgets.

Supported Formats:
- **1D Arrays:** Comma-separated numbers (`[2, 7, 11, 15]` or `2, 7, 11, 15` or strings `["a", "b", "c"]`).
- **2D Matrices:** Nested JSON array lists (`[[1, 2, 3], [4, 5, 6]]` or multiline whitespace-delimited rows).

Processing Flow:
1. Input is stripped of trailing comments and normalized.
2. The parser attempts JSON array parsing.
3. If JSON parsing fails, fallback regular expression tokenizers detect delimiter patterns.
4. Returns an AST-like result (`{ ok: true, kind: 'array', values: [...] }` or `{ ok: true, kind: 'matrix', rows: [...] }`).
5. On success, `RoughNotebook.svelte` instantiates the widget at the designated cursor anchor.

---

## Focus and Keyboard Event Pipeline

A primary goal of Rough Notebook is fluid keyboard control without accidental keystroke leakage.

### Global Event Handler (`RoughNotebook.svelte`)
- Listens on `window.addEventListener('keydown', onGlobalKeydown)`.
- Inspects `isEditingTextField(document.activeElement)` from `focus-util.ts`.
- If the user is currently editing an input cell or note textarea, alphanumeric keys are passed through to the browser.
- If no text input is focused, single-key accelerators are triggered:
  - `P`: Toggle pen drawing layer.
  - `H`: Toggle canvas hand pan mode.
  - `Delete` / `Backspace`: Remove selected block.
  - `Cmd/Ctrl + C`: Copy active block to internal structure clipboard.
  - `Cmd/Ctrl + V`: Paste block at mouse position or offset anchor.
  - `Cmd/Ctrl + Z`: Undo operation (dispatched to sketches or document based on pen active state).

### Focus Registry (`src/library/focus/focusRegistry.ts`)
Maintains a registry of HTMLElement references for each placed block. This enables smooth programmatically-directed focus transitions (for example, focusing the first cell of an array immediately after insertion).

---

## Design System and Theming

The styling architecture is declared in `src/theme.css` using native CSS variables.

Themes:
- **Light Theme (Warm Paper):** Off-white parchment background (`#F7F6F2`), subtle warm borders (`#E6E3DC`), and royal violet primary accents (`#7C3AED`).
- **Dark Theme (Warm Obsidian):** Deep dark paper background (`#141210`), lifted charcoal surface cards (`#1E1B18`), and luminous violet accents (`#9D68F7`).

Theme switching toggles the `.dark` class on `document.documentElement` and synchronizes with `localStorage`. No style re-evaluations or layout shifts occur during switching.
