<p align="center">
  <img src="public/og.svg" alt="Rough Notebook Banner" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);" />
</p>

<h1 align="center">Rough Notebook</h1>

<p align="center">
  <strong>The digital scratchpad LeetCode forgot to build.</strong><br>
  A keyboard-first digital rough notebook designed for algorithm dry-runs, two-pointer traces, DP state tables, and technical coding interviews.
</p>

<p align="center">
  <a href="https://shambhoo-narwaria.github.io/Rough-Notebook/"><strong>🚀 Launch Live Application (Free &amp; No Signup) &rarr;</strong></a>
</p>

<p align="center">
  <a href="https://shambhoo-narwaria.github.io/Rough-Notebook/"><img src="https://img.shields.io/badge/Live_App-GitHub_Pages-7C3AED.svg?style=flat-square&logo=github&logoColor=white" alt="Live Demo"></a>
  <a href="https://svelte.dev/"><img src="https://img.shields.io/badge/Svelte-5.x_(Runes)-FF3E00.svg?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5 Runes"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0_Strict-3178C6.svg?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict"></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981.svg?style=flat-square" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Privacy-100%25_Client--Side-blueviolet.svg?style=flat-square" alt="100% Client-Side">
</p>

---

## Why Rough Notebook?

When tackling algorithmic problems on LeetCode or in live technical interviews, software engineers are stuck choosing between flawed options:

- **Physical Scrap Paper:** Natural and rapid, but rigid. You run out of margin space, can't expand array capacities, can't duplicate testcases, and erasing ink ruins your flow.
- **Generic Whiteboard Apps (Excalidraw, Miro):** Built for high-level system architecture boxes. Drawing a simple array requires manually aligning 10 rectangles, typing indices one-by-one, and constant mouse dragging.
- **Code Editors & Plain Text Notes:** Great for syntax, but completely lack 2D spatial layouts, cell-by-cell matrix tab traversal, and freehand pointer sketches (like two-pointer markers `L` and `R`, sliding window spans, or recursion call trees).

**Rough Notebook bridges this gap:** It combines the tactile freedom of scrap paper with structured computational widgets native to computer science workflows, all driven through a strict keyboard-first interface.

---

## Feature Comparison

| Capability | Rough Notebook | Excalidraw | Physical Scrap Paper | Miro |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Domain** | **DSA & Algorithm Dry-Runs** | General Diagramming | Manual Notes | Team Whiteboarding |
| **Indexed Array Widgets** | **Native** (Auto `[0]`, `[1]`, `[2]`) | Manual Shapes | Manual Pen | None |
| **DP Matrix Grid with Tab** | **Native** (Fast Tab traversal) | None | Manual Grid | None |
| **Paste LeetCode Testcases** | **Instant Auto-Detect** | None | None | None |
| **Pointer & Shape Tracing** | **Native Arrow / Square / Line** | Manual Shapes | Manual Ink | Generic Shapes |
| **Multi-Sheet Workspaces** | **Minimal Bottom Switcher** | Endless Canvas | Stack of Papers | Boards |
| **Keyboard Accelerators** | **Full** (`/`, `P`, `E`, `S`, `Tab`, `Alt+N`) | Mouse-Centric | None | Mouse-Centric |
| **Zero Account / Local-Only**| **100% Client-Side** | Yes | Yes | Requires Login |

---

## Superpowers for Interview Prep

### 1. Instant Testcase Ingestion
Copy raw test inputs directly from LeetCode problem descriptions or terminal output and paste (`Cmd+V` / `Ctrl+V`) anywhere on the canvas:
- Parses 1D arrays: `[2, 7, 11, 15]`, `2, 7, 11, 15`, or `["flower", "flow", "flight"]`.
- Parses 2D matrices: `[[1,2,3],[4,5,6]]` or whitespace-delimited rows.
- Automatically instantiates populated, fully interactive widgets at your cursor position with zero manual formatting.

### 2. Spatial Two-Pointer & Sliding Window Tracing
- Drop directional arrows, bounding boxes, and pointer markers (`L`, `R`, `slow`, `fast`) directly over array elements.
- Dedicated vector sketch layer with curated ink colors tailored for visual contrast:
  - **Ink:** Primary structural traces and notes.
  - **Red:** High-priority markers, boundary checks, and error conditions.
  - **Green:** Validated solutions, accepted base cases, and matches.
  - **Blue:** Auxiliary pointers, secondary runners, and traversal paths.
- Isolated stroke undo stack: pressing `Cmd+Z` while drawing cleanly undos the last stroke without modifying placed data blocks.

### 3. Dynamic Programming Grids & Trace Tables
- Grid widgets supporting custom dimensions, row and column headers, and seamless bidirectional cell navigation via `Tab` and `Shift+Tab`.
- Fill recurrence relations (`dp[i][j] = dp[i-1][j] + ...`) at the speed of thought without touching the mouse.

### 4. Freeform Notes & Section Spines
- **Markdown Sticky Notes:** Unobtrusive cards designed for edge case checklists, time/space complexity calculations, and invariant tracking.
- **Section Spines:** Sleek glowing boundary lines that logically divide your canvas into stages (e.g., Brute Force vs. Optimized Two-Pointer vs. Binary Search).

### 5. Multi-Sheet Rough Pages
- Flip between rough sheets seamlessly without losing previous dry runs (`Page 1`, `Page 2`, `Page 3`) via the minimal floating bottom bar.
- Instant keyboard accelerators: `Alt+[` (previous page), `Alt+]` (next page), and `Alt+N` (new clean sheet).

### 6. AI Smart Handwriting Engine
- Write naturally on the canvas using a stylus, pen, or touch input; strokes are recognized and automatically converted into editable text within active notes.
- Normalizes Big-O complexity (`O(1)`, `O(n)`, `O(log n)`), pointer operations (`arr[i]`, `node->next`), and common variable names (`prev`, `curr`, `dummy`).

---

## The 3-Step Interview Playbook

```
1. Paste Input ──▶ 2. Trace Invariant ──▶ 3. Code with Confidence
   (Cmd+V LeetCode    (Two-pointers, DP       (Airtight mental model,
    testcase arrays)   tables, edge cases)     zero edge-case surprises)
```

1. **Step 1: Ingest Testcases (`Cmd+V`)**: Copy sample inputs straight from the problem description and paste them into live interactive array/matrix blocks.
2. **Step 2: Dry-Run the Invariant**: Use the pen and shape tools to mark pointers, trace table state transitions, and test off-by-one edge cases.
3. **Step 3: Code with Confidence**: Switch back to your IDE or interview screening tab with an airtight mental model and zero hidden surprises.

---

## 60-Second Keyboard Cheatsheet

Rough Notebook is designed so your hands never have to leave the keyboard:

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `Cmd+V` / `Ctrl+V` | **Paste Testcase** | Parse raw string into interactive 1D Array or 2D Matrix |
| `/` or `Cmd+/` | **Slash Palette** | Open command menu to insert Notes, Arrays, Matrices, or Spines |
| `P` | **Toggle Pen** | Switch between pointer mode and freehand vector drawing |
| `E` | **Toggle Eraser** | Erase freehand sketches and pointer annotations |
| `S` | **Shapes Tool** | Access Arrow, Square box, and Line drawing tools |
| `D` | **DSA Hub** | Open data structures quick-insert menu |
| `Tab` / `Shift+Tab` | **Cell Traversal** | Navigate forward and backward across array/matrix cells |
| `Alt+N` | **New Sheet** | Instantiate a clean rough page for your next problem |
| `Alt+[` / `Alt+]` | **Flip Sheets** | Navigate to previous / next rough notebook sheet |
| `Cmd+Z` / `Cmd+Y` | **Undo / Redo** | Undo or redo strokes and structural placements |

---

## Project Structure

```text
Rough-Notebook/
├── public/                 # Static assets, manifests, and search metadata
│   ├── favicon.svg         # Scalable vector notebook favicon
│   ├── og.svg              # Social banner and open graph asset
│   ├── site.webmanifest    # Progressive Web App configuration
│   └── llms.txt            # Machine-readable summary for AI assistants
├── src/
│   ├── components/
│   │   ├── blocks/         # NoteBlock, ArrayBlock, MatrixBlock, SpineBlock
│   │   ├── canvas/         # ScratchCanvas, SideToolbar, PenRadialMenu
│   │   ├── modals/         # HelpModal, AutoCreateModal, DimensionModal
│   │   └── navigation/     # Header bar, BottomPageBar, SlashPalette
│   ├── library/            # Logic, data structures, and algorithmic helpers
│   │   ├── commands/       # Slash command definitions and filtering
│   │   ├── focus/          # Keyboard focus tracking and registry
│   │   ├── handwriting/    # Handwriting pipeline and DSA token normalizer
│   │   ├── layout/         # Widget collision resolution and placement
│   │   ├── parser/         # String, array, and matrix input parsing
│   │   └── state/          # Svelte 5 document and sketch reactive stores
│   ├── RoughNotebook.svelte # Root canvas coordinator
│   ├── main.ts             # Application bootstrapping
│   └── theme.css           # Design tokens and dual warm theme rules
├── document/               # Technical specs and user guides
│   ├── user_guide.md       # Comprehensive problem-solving workflows
│   ├── architecture.md     # In-depth architectural documentation
│   └── auto_handwriting_mode.md # Handwriting recognition pipeline
└── package.json            # Scripts and dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** or modern LTS installed.
- **npm 9+** package manager.

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/shambhoo-narwaria/Rough-Notebook.git
cd Rough-Notebook

# 2. Install dependencies
npm install

# 3. Launch local development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

To run strict type validation and Svelte component checks:

```bash
npm run check
```

---

## Privacy & Local-First Philosophy

- **Zero Tracking:** No telemetry, no analytics, no third-party trackers.
- **Zero Account Barriers:** No logins, passwords, or emails.
- **100% Client-Side:** All sketch strokes, data structures, and notes are processed directly in your browser memory and never uploaded to any remote server.

---

## Community & Contributing

Contributions, bug reports, and ideas are warmly welcomed!

- **Found a bug or have an idea?** Open an [Issue](https://github.com/shambhoo-narwaria/Rough-Notebook/issues).
- **Want to add a new DSA widget?** (e.g., Linked List pointer nodes, Binary Tree visualizer, Graph adjacency matrix) PRs are always appreciated!
- **Star the Repo:** If Rough Notebook helps you with LeetCode practice or coding interviews, please consider giving it a ⭐ on GitHub!

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for complete details.

Crafted with care by [**Shambhoo Narwaria**](https://github.com/shambhoo-narwaria).
