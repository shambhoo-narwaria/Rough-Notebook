# Auto Handwriting Mode — Implementation and Architecture Specification

## Overview

The Smart Handwriting Mode in Rough Notebook enables users to write naturally on the digital canvas using a pen or stylus, while the system automatically recognizes handwriting and converts it into clean, editable text blocks in the background without opening a modal review dialog or interrupting the user's focus.

This document describes the architectural flow, asynchronous recognition pipeline, confidence scoring heuristics, DSA post-processing dictionary, and reversible state management.

---

## High-Level Implementation Flow

```
+-------------------------------------------------------------+
| 1. Write Naturally                                          |
| User writes freehand ink on canvas with pen or stylus       |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 2. Temporal Batching & Inactivity Detection                 |
| On pen up, stroke buffered with 900ms inactivity timer      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 3. Asynchronous Background Recognition                      |
| Normalized ink points sent to recognition service           |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 4. Confidence Evaluation & Noise Rejection                  |
| Score evaluated: confidence >= 0.70 and noise checks passed? |
+-------------------------------------------------------------+
              /                                   \
             / Yes                                 \ No
            v                                       v
+------------------------------------+  +----------------------------+
| 5. Automatic Replacement           |  | Retain Original Ink        |
| - Remove ink strokes from canvas   |  | Uncertain marks remain     |
| - Place editable NoteBlock         |  | as standard freehand ink.  |
| - Apply DSA-aware normalization    |  | Zero interruptions or      |
| - Register reversible undo entry   |  | false conversions.         |
+------------------------------------+  +----------------------------+
```

---

## Core Principles and Behavior

### 1. Zero-Review Frictionless Flow
Unlike traditional handwriting OCR solutions that force the user into a modal correction interface or pop-up confirmation screen, Rough Notebook converts handwriting directly in place on the canvas into standard editable NoteBlocks. If the converted text requires minor adjustment, the user can click directly into the note to edit it.

### 2. High Confidence Acceptance
Handwriting is converted only when recognition exceeds the defined confidence threshold (minimum score of 0.70 out of 1.0) and passes sanity checks.

### 3. Low Confidence Ink Preservation
When confidence is below 0.70, or when the stroke sequence appears to be a diagram, geometric shape, arrow, or stray mark, the system leaves the original ink on the canvas. No incorrect text is placed, and the user's diagram remains intact.

### 4. Continuous Writing & Active Note Appending
When writing words or expressions, recognized characters and tokens append directly into the currently active or focused NoteBlock rather than creating disconnected blocks on canvas.
- **Word and Token Continuity:** Consecutive characters and code tokens (such as `arr`, `[`, `i`, `]`) append directly without extra spaces, ensuring algorithmic expressions retain correct formatting (`arr[i]`, `node->next`).
- **Spacebar Word Separation:** Pressing the Spacebar (on the physical keyboard or tapping `+ Space` on the floating island) inserts a word boundary space. Subsequent handwriting appends after the space.
- **New Note Initiation:** Pressing `Escape` or tapping `New Note` on the island deselects the current note so the next stroke sequence starts a brand new block wherever written.

### 5. Dual-Active Hybrid Input (Simultaneous Pen and Keyboard)
Users are not locked into one input modality. While Smart Pen mode is active:
- Tapping or clicking any note block focuses the textarea, allowing immediate typing, editing, backspacing, or formatting with the keyboard.
- Dragging on the canvas with a pen or stylus writes freehand strokes that convert into text and append at the active cursor position.
- Both input methods operate concurrently without requiring manual tool switches.

### 6. Instant Reversibility (Undo Support)
Every automatic conversion registers an entry with the prior stroke geometry, previous note content (if appending), and block identifier. Pressing `Cmd + Z` or `Ctrl + Z` undoes the conversion in one step:
- If a new block was spawned, the block is deleted and original ink strokes are restored.
- If text was appended, previous note content is restored and the original ink strokes return to the canvas.

---

## Dual Mode Design

Rough Notebook supports two complementary modes within the Pen tool:

| Mode | Trigger | Behavior | Ideal Use Cases |
| :--- | :--- | :--- | :--- |
| **Draw Mode** | "Draw" pill in Pen menu | Standard freehand drawing layer. Pen strokes draw across all canvas elements without focusing textareas. | Pointer arrows, recursion trees, memory layout diagrams, graph nodes. |
| **Smart Pen Mode** | "Smart Pen" pill in Pen menu | Hybrid text and handwriting layer. Continuous recognition appends to active notes, Spacebar separates words, and keyboard typing remains live. | Writing notes, complexity notations, algorithm steps, pseudo-code variables. |

---

## Floating Smart Pen Island

When Smart Pen mode is active, an interactive floating island appears at the bottom-center of the canvas:
- **Status Indicator:** Shows whether recognition is actively converting (`Converting text...`), appending to the active note (`Writing into Active Note`), or ready to spawn a new note (`Smart Pen`).
- **Quick Action Buttons:**
  - `+ Space`: Inserts a word separator space into the target note (matching keyboard `Spacebar`).
  - `New Line`: Inserts a newline (matching keyboard `Enter`).
  - `New Note`: Deselects the active note so the next handwriting creates a fresh block (matching keyboard `Escape`).

---

## Technical Architecture

### 1. Ink Coordinate Normalization
Freehand strokes recorded on the canvas contain absolute surface coordinates. Before sending to the recognition engine:
- The collective bounding box of all strokes in the pending batch is calculated (`minX`, `minY`, `maxX`, `maxY`).
- Coordinates are translated relative to the bounding box with a 20px margin:
  `x_rel = x - minX + 20`
  `y_rel = y - minY + 20`
- Monotonic timestamps are assigned per sample point (`t = index * 16ms`) to emulate pen movement dynamics.

### 2. Recognition Service Integration (`src/library/handwriting/handwritingRecognizer.ts`)
The application formats ink data into coordinate arrays and communicates with Google Handwriting Input Tools:
- Endpoint: `https://www.google.com.tw/inputtools/request?ime=handwriting`
- Method: `POST` with JSON payload containing writing area dimensions and ink stroke vectors.
- Response: Ranked candidate strings.

### 3. DSA-Aware Post-Processing Dictionary
Handwriting engines trained on standard English text frequently misinterpret common algorithmic notation (for example, reading `O(1)` as `o(1)`, `0(1)`, or `O ( 1 )`). Rough Notebook runs candidate strings through an algorithmic normalization dictionary:

```typescript
const DSA_REPLACEMENTS: Array<[RegExp, string]> = [
  // Big-O notations
  [/\b[oO0]\s*\(\s*1\s*\)/gi, 'O(1)'],
  [/\b[oO0]\s*\(\s*n\s*\)/gi, 'O(n)'],
  [/\b[oO0]\s*\(\s*log\s*n\s*\)/gi, 'O(log n)'],
  [/\b[oO0]\s*\(\s*n\s*log\s*n\s*\)/gi, 'O(n log n)'],
  [/\b[oO0]\s*\(\s*n\s*[\^2]\s*\)/gi, 'O(n^2)'],
  [/\b[oO0]\s*\(\s*v\s*\+\s*e\s*\)/gi, 'O(V + E)'],
  [/\b[oO0]\s*\(\s*k\s*\)/gi, 'O(k)'],

  // Algorithm keywords
  [/\bdfs\b/gi, 'DFS'],
  [/\bbfs\b/gi, 'BFS'],
  [/\bdp\b/gi, 'dp'],
  [/\bmod\b/gi, 'MOD'],

  // Data structure indexing and pointers
  [/\b(arr|nums|dp|grid|vals|matrix)\s*\[\s*([a-zA-Z0-9_\-+]+)\s*\]/gi, '$1[$2]'],
  [/\b([a-zA-Z0-9_]+)\s*\-\s*>\s*([a-zA-Z0-9_]+)/g, '$1->$2'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*next\b/gi, '$1.next'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*val\b/gi, '$1.val'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*left\b/gi, '$1.left'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*right\b/gi, '$1.right'],

  // Comparison and assignment operators
  [/\s*<=\s*/g, ' <= '],
  [/\s*>=\s*/g, ' >= '],
  [/\s*===\s*/g, ' === '],
  [/\s*==\s*/g, ' == '],
  [/\s*!=\s*/g, ' != '],
];
```

### 4. State Management and Reversibility (`src/library/state/sketches.svelte.ts`)
- `autoHandwritingActive`: Reactive boolean state toggled via the pen menu.
- `conversionHistory`: A stack storing `{ blockId: string, strokes: SketchStroke[] }`.
- `removeStrokesByIds(ids)`: Atomically extracts converted strokes from the active sketch layer and pushes an undo checkpoint.
- `undoLastHandwritingConversion()`: Reverts the conversion by deleting the generated block (`removeBlock(last.blockId, true)`) and restoring the original ink array to `sketchStrokes`.

### 5. Block Selection and Moving in Writing Mode (`src/components/canvas/ScratchCanvas.svelte`)
- In Smart Pen mode, all canvas blocks (NoteBlock, ArrayBlock, MatrixBlock, SpineBlock) can be selected and moved across the canvas.
- When a block is selected (`doc.selectedBlockId === b.id`), clicking and dragging the block directly repositions it with active `cursor: grabbing` feedback and an elevated shadow.
- Dragging array/matrix cells or note text beyond a 6px threshold activates movement, while clicks below 6px preserve text typing and cell value editing.
- Dropping a block invokes `resolveNonOverlapForBlock` to prevent collision with neighboring widgets.
- The Smart Pen floating island updates dynamically with contextual cues (`Writing into Active Note (Drag to move)`, `Block Selected (Drag to move)`) and includes a `Deselect` action.

---

## Error Handling and Fallbacks

1. **Network Disconnection:** If the user is offline or the recognition request times out, the catch block silently retains the handwritten ink. The user does not lose their notes.
2. **Noise and Stray Marks:** Dot marks or stray scratches with fewer than 6 points are discarded from text conversion so they remain as normal canvas markings.
3. **Canvas Clear During Active Timer:** If the user invokes "Clear Marks" while a recognition timer is pending, the timer is cancelled and the pending ID buffer is cleared to avoid placing orphaned text blocks.

