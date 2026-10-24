# User Guide and Problem-Solving Workflows

## Introduction

Rough Notebook is designed to serve as an intuitive digital whiteboard for computer science students, software engineers, and candidates preparing for technical interviews. It removes the friction of drawing manual arrays and matrices while preserving the freedom of sketching and informal note-taking.

---

## Workspace Navigation

### 1. Canvas Navigation
- **Panning:**
  - Hold trackpad gesture or use mouse wheel to scroll horizontally and vertically, or drag with the middle mouse button.
- **Canvas Boundaries:**
  - The default workspace provides an open virtual surface of 3200px by 2400px.

### 2. Vertical Left Tool Palette
- Positioned on the left side of the viewport for rapid tool access:
  - **Note:** Instantly creates a freeform sticky note card in the current view or where dragged.
  - **Array:** Instantly inserts a 1D indexed array widget (`[0]`, `[1]`, `[2]`, ...).
  - **Matrix:** Instantly inserts a 2D dynamic programming grid.
  - **Pen:** Toggles freehand drawing layer on and off (keyboard shortcut: `P`).
- Drag-and-drop: Drag any structure button from the left dock and drop it directly where you want it on the canvas.

### 3. Notebook Multi-Page Sheets
- Switch between rough sheets cleanly without losing context:
  - `<` and `>` buttons or `Alt + [` / `Alt + ]`: Flip between notebook sheets.
  - `+ New Page` or `Alt + N`: Instantiate a fresh blank rough sheet.
  - Page states (structured blocks and freehand vector sketches) are preserved per page in memory.

### 4. Zen Mode (100% Edge-to-Edge Paper)
- Press `Z` or click the Zen button in the header:
  - Header and side toolbars slide off-screen to give you 100% immersion on paper.
  - Move mouse cursor to the top edge to briefly reveal controls, or press `Z` / `Esc` to exit Zen Mode.

---

## Keyboard-First Command Palette

Press `Cmd + /` (macOS) or `Ctrl + /` (Windows/Linux) anywhere on the canvas to open the command palette.

Available Commands:
- `/autoCreate`: Opens the smart paste modal for parsing strings or JSON arrays.
- `/array`: Prompts for length and inserts a 1D array.
- `/matrix`: Prompts for rows and columns and inserts a 2D matrix.
- `/text`: Inserts a freeform note card.
- `/lineBreak`: Inserts a full-width section divider line.

Navigation inside the palette:
- `Up Arrow` / `Down Arrow`: Highlight previous or next command.
- `Enter`: Execute the highlighted command.
- `Esc`: Close the palette.

---

## Working with Data Structure Widgets

### 1. 1D Array Widget
- **Indices:** Above each cell, an auto-computed index tag is displayed (`[0]`, `[1]`, `[2]`, ...).
- **Navigation:**
  - `Tab`: Moves focus to the next cell.
  - `Shift + Tab`: Moves focus to the previous cell.
- **Context Operations (Right-Click on Array):**
  - Add cell to the left.
  - Add cell to the right.
  - Remove first cell.
  - Remove last cell.
  - Remove entire array.

### 2. 2D Matrix Widget
- **Row and Column Indices:** Headers indicate column numbers along the top and row numbers along the left edge.
- **Cell Navigation:** Use `Tab` and `Shift + Tab` to cycle through row-major matrix cells.
- **Context Operations (Right-Click on Matrix):**
  - Insert row above or below.
  - Insert column left or right.
  - Delete row or column.
  - Delete entire matrix.

### 3. Note Cards
- Notes support multi-line text with auto-height adjustment.
- **List Continuation:**
  - Typing a hyphen and space (`- `) creates a bullet point. Pressing `Enter` automatically continues the bullet list on the next line.
  - Typing a number and dot (`1. `) creates an ordered list. Pressing `Enter` automatically increments the counter (for example, `2. `).
- Double-click on any empty canvas area to instantly spawn a new note block under the cursor.

### 4. Section Spines (Dividers)
- Inserts a visual horizontal separator across the canvas.
- Ideal for separating different phases of problem solving:
  1. Problem statement and constraints.
  2. Brute force approach analysis.
  3. Optimized two-pointer or dynamic programming approach.
  4. Complexity analysis (Time and Space).

---

## Smart Auto-Creation from Testcases

Rough Notebook includes a parser that converts copied strings into visual widgets.

How to use:
1. Press `Cmd + /` or `Ctrl + /` and select `Auto Create`.
2. Paste test inputs copied from problem descriptions, for example:
   - 1D Array: `[2, 7, 11, 15]` or `1, 3, 5, 7, 9`
   - String Array: `["flower", "flow", "flight"]`
   - 2D Matrix: `[[1, 2, 3], [4, 5, 6], [7, 8, 9]]`
3. Click Confirm or press `Enter` to place the parsed widget directly on the canvas.

---

## Freehand Annotation Pen Layer and Smart Handwriting

To draw diagrams, pointer arrows, recursion trees, or write handwritten notes:
1. Press `P` or click the Pen button in the top navigation bar.
2. The cursor changes to a crosshair.
3. Select the writing mode in the pen toolbar:
   - **Draw Mode:** Standard freehand drawing. Strokes remain permanently on the sketch layer.
   - **Smart Pen Mode:** Hybrid text and handwriting layer. Handwriting converts in the background and appends directly into the active NoteBlock.
4. Simultaneous Hybrid Input:
   - Click any note block to focus it and type with your keyboard.
   - Draw or write with pen/stylus on the canvas; handwriting automatically appends to the active note at the caret.
   - Consecutive characters and expressions (`arr`, `[`, `i`, `]`) append continuously. Press `Spacebar` (or tap `+ Space` on the floating island) to separate words.
   - Press `Enter` (or tap `New Line`) to add a newline.
   - Press `Escape` (or tap `New Note`) to deselect and start a fresh note on next handwriting.
5. Select an ink color:
   - **Ink:** Primary text color (dark charcoal in light mode, off-white in dark mode).
   - **Red:** For highlighting invalid states, conflicts, or base cases.
   - **Green:** For highlighting found solutions, matches, or valid ranges.
   - **Blue:** For marking pointer positions (`left`, `right`, `slow`, `fast`).
6. In Smart Pen mode, DSA terms such as `O(n)`, `O(1)`, `arr[i]`, and `->` are automatically normalized into clean formatting.
7. Block Selection and Moving in Writing Mode:
   - Tap any block (Note, Array, Matrix, or Divider) to select it.
   - A small, clean move icon appears at the top-left of every block on hover and selection.
   - Click and drag the move icon to reposition the block anywhere smoothly with zero interference with text editing.
   - Collision resolution automatically positions neighboring blocks upon release.
   - Tap `Deselect` on the floating island or press `Escape` to unselect the active block.
8. `Cmd/Ctrl + Z` undoes strokes or restores original handwriting if auto-converted.
9. Click "Clear Marks" in the pen menu to wipe all ink strokes while preserving all structured widgets.

---

## Common DSA Dry-Run Workflows

### 1. Two-Pointer Technique (e.g., Two Sum II, Valid Palindrome)
1. Insert a 1D array with the input numbers.
2. Toggle Pen mode (`P`) and select Blue ink.
3. Draw pointer labels `L` above index `0` and `R` above the last index.
4. As you trace iterations, use the pen to draw arrows showing the pointer adjustments until the termination condition is reached.

### 2. Sliding Window (e.g., Longest Substring Without Repeating Characters)
1. Insert a 1D array of characters or numbers.
2. Insert a Note card to track window state (e.g., character frequency map, `max_len`, current sum).
3. Use the pen layer with Green ink to outline the current window boundary.
4. Update the note card values at each step as the window expands or contracts.

### 3. Dynamic Programming Table
1. Insert a 2D Matrix representing the DP memoization grid.
2. Right-click the matrix to set the dimensions corresponding to string lengths or target capacities.
3. Fill in base cases in row 0 and column 0 using `Tab` navigation.
4. Step through the transition function cell-by-cell.
