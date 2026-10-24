<p align="center">
  <img src="public/og.svg" alt="Rough Notebook Banner" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);" />
</p>

<h1 align="center">Rough Notebook</h1>

<p align="center">
  <strong>Think it. Trace it. Solve it.</strong><br>
  A keyboard-first digital rough notebook designed for DSA, algorithm trace-tables, and technical interviews.
</p>

<p align="center">
  <a href="https://shambhoo-narwaria.github.io/Rough-Notebook/"><strong>Launch Live Application</strong></a>
</p>

<p align="center">
  <a href="https://shambhoo-narwaria.github.io/Rough-Notebook/"><img src="https://img.shields.io/badge/Live_Demo-GitHub_Pages-7C3AED.svg?style=flat-square&logo=github&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/shambhoo-narwaria/Rough-Notebook/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-7C3AED.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://svelte.dev/"><img src="https://img.shields.io/badge/Svelte-5.x-FF3E00.svg?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.0-646CFF.svg?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
</p>

---

## Why Rough Notebook?

When solving Data Structures and Algorithms (DSA) problems on LeetCode or in technical interviews, engineers face a dilemma:
- **Physical paper** is fast and natural, but you cannot easily move sections, resize arrays, or copy and paste testcase inputs.
- **Traditional whiteboards** are clumsy, mouse-heavy, and lack DSA-specific abstractions (like indexed arrays and matrix grids).
- **Text editors / scratchpads** cannot handle manual diagramming, pointer arrows (such as left/right two-pointer markers), or recursion state trees.

**Rough Notebook** bridges this gap. It gives you the friction-free feel of warm rough paper combined with keyboard-first DSA widgets and a responsive freehand trace pen layer.

---

## Features

- **Keyboard-First Velocity:**
  - `⌘/` or `Ctrl+/`: Summon the instant Command Palette.
  - `Tab` / `Shift+Tab`: Effortlessly jump between array elements and matrix cells.
  - `⌘C` / `⌘V` (`Ctrl+C` / `Ctrl+V`): Clone selected structures directly at your cursor.
  - `Delete` / `Backspace`: Remove selected elements cleanly.
  - `⌘Z` / `⌘⇧Z` (`Ctrl+Z` / `Ctrl+Y`): Full multi-level undo and redo.

- **Smart DSA Structures:**
  - **1D Arrays:** Cell-based array widgets with auto-computed index tags (`[0]`, `[1]`, `[2]`, ...), dynamic column resizing, and cell insertion/deletion.
  - **2D Matrices:** Grid-based matrix blocks with intuitive row and column controls.
  - **Notes and Dividers:** Freeform sticky note blocks and vertical divider spines to organize stages of your solution.

- **Smart Paste Auto-Detection:**
  - Copy raw test inputs directly from LeetCode or problem descriptions (for example `[2, 7, 11, 15]` or `[[1,2,3],[4,5,6]]`) and paste (`⌘V` / `Ctrl+V`) onto the canvas.
  - Rough Notebook parses the input and instantiates an interactive widget instantly.

- **Freehand Trace and Pen Layer:**
  - Toggle the drawing mode to sketch two-pointer arrows, graph edges, binary tree branches, or hash map associations.
  - Radial palette with curated ink colors (Ink, Red, Green, Blue).
  - Independent stroke history with per-stroke undo.

- **Smart Handwriting Mode (AI / Vector Stroke Engine):**
  - Continuous background handwriting recognition without modal review screens.
  - Automatic DSA token normalization for Big-O notation (`O(1)`, `O(n)`, `O(log n)`, `O(n^2)`), pointers (`arr[i]`, `node->next`), and operators.
  - Simultaneous hybrid input: type with keyboard and write with stylus concurrently.
  - Fail-safe ink preservation when offline or for stray annotations.

- **Dual Warm Themes:**
  - **Light Mode:** Gentle warm paper canvas with dot grid.
  - **Dark Mode:** Deep warm obsidian with contrast-tuned DSA accents designed to eliminate eye strain during late-night practice.

---

## Comparison: Why Rough Notebook vs Alternatives

| Feature | Rough Notebook | Excalidraw | Physical Paper | Miro |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Focus** | **DSA & Algorithm Dry-Runs** | General Diagramming | Manual Notes | Enterprise Collaboration |
| **Indexed Array Widgets** | **Yes** (Auto `[0]`, `[1]`, `[2]`) | No (Manual shapes) | Yes (Manual pen) | No |
| **DP Matrix Grid with Tab** | **Yes** (Rapid Tab navigation) | No | Yes (Manual grid) | No |
| **Paste Raw LeetCode Arrays** | **Yes** (Instant parsing) | No | No | No |
| **Handwriting to Code Conversion** | **Yes** (DSA Token Normalizer) | No | No | No |
| **Keyboard Velocity** | **Yes** (`Cmd+/`, `Tab`, `Cmd+C/V`)| Mouse-heavy | Manual | Mouse-heavy |
| **Zero Account / 100% Private** | **Yes** (Runs in browser) | Yes | Yes | Requires login |

## Keyboard Shortcuts Reference

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>/</kbd> | **Insert Menu** | Open Command Palette to insert arrays, matrices, notes, or dividers |
| <kbd>Click Canvas</kbd> | **Quick Tools Wheel** | Open radial action wheel at click point to insert notes, structures, or toggle tools |
| <kbd>Double Click</kbd> | **Quick Note** | Spawn a note block directly at the clicked position |
| <kbd>H</kbd> | **Hand (Pan) Tool** | Drag canvas freely with cursor to pan viewport without scrollbars |
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | **Cell Navigation** | Jump forward/backward across array cells or matrix grid |
| <kbd>P</kbd> | **Toggle Pen** | Enable or disable the freehand annotation pen layer |
| <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>C</kbd> | **Copy** | Copy the active block structure to the clipboard |
| <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>V</kbd> | **Paste** | Paste copied structure or raw testcase array/matrix at cursor |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Delete** | Delete selected structure (when not editing cell text) |
| <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>Z</kbd> | **Undo** | Undo last canvas operation or pen stroke |
| <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | **Redo** | Redo previously undone operation |
| <kbd>Escape</kbd> | **Deselect** | Deselect active block, exit Hand mode, or close radial wheel |

---

## Tech Stack

- **UI Framework:** [Svelte 5](https://svelte.dev/) with modern Runes reactivity (`$state`, `$derived`, `$props`, `$effect`)
- **Language:** TypeScript 6.0 with strict type safety and project references
- **Styling:** Modular Vanilla CSS with scoped component styling and CSS design tokens
- **Build Tool:** [Vite 8](https://vite.dev/)
- **Hosting & Deployment:** [GitHub Pages](https://pages.github.com/)

---

## Project Structure

```
Rough-Notebook/
├── public/                 # Static assets and SEO files
│   ├── favicon.svg         # Scalable vector purple notebook favicon
│   ├── og.svg              # Vector social banner source
│   ├── site.webmanifest    # Progressive Web App manifest
│   ├── robots.txt          # Search engine crawler policies
│   ├── sitemap.xml         # XML sitemap
│   ├── humans.txt          # Author and tech stack attribution
│   └── llms.txt            # Machine-readable documentation
├── src/
│   ├── components/
│   │   ├── blocks/         # 1D Array, 2D Matrix, Note, and Section Divider
│   │   ├── canvas/         # Freehand pen, radial color picker and canvas layer
│   │   ├── modals/         # Help, auto-create, dimensions, and clear modals
│   │   └── navigation/     # Header bar, action buttons and slash palette
│   ├── library/            # Core business logic and state management
│   │   ├── state/          # Document and sketch Svelte 5 stores, block types
│   │   ├── handwriting/    # IME handwriting recognizer and pen color definitions
│   │   ├── focus/          # Keyboard focus tracking and DOM focus registry
│   │   ├── layout/         # Collision detection and overlap resolution
│   │   ├── parser/         # String and testcase data structure parser
│   │   └── commands/       # Slash command palette registry
│   ├── RoughNotebook.svelte # Main application canvas coordinator
│   ├── theme.css           # Design tokens and theme styles
│   └── main.ts             # Application bootstrapping
├── vite.config.ts          # Vite build pipeline configuration
└── package.json            # Project dependencies and npm scripts
```

---

## Getting Started

### Prerequisites

Ensure you have **Node.js 18+** (or modern LTS) installed.

### 1. Clone the repository

```bash
git clone https://github.com/shambhoo-narwaria/Rough-Notebook.git
cd Rough-Notebook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start sketching.

### 4. Run type check and linting

```bash
npm run check
```

### 5. Build for production

```bash
npm run build
```

---

## Live Demo & Deployment

Rough Notebook is deployed live on **GitHub Pages**:

- **Live Application:** [https://shambhoo-narwaria.github.io/Rough-Notebook/](https://shambhoo-narwaria.github.io/Rough-Notebook/)
- **Deploy to GitHub Pages:**
  ```bash
  npm run deploy
  ```

---

## Frequently Asked Questions (FAQ)

### What is Rough Notebook?
Rough Notebook is a free, open-source digital rough notebook and visual whiteboard tailored for computer science students and software engineers practicing Data Structures and Algorithms (DSA) and preparing for technical coding interviews.

### How does Rough Notebook differ from Excalidraw?
Excalidraw is built for general architecture diagrams. Rough Notebook is purpose-built for algorithmic dry-running with native 1D indexed arrays, 2D dynamic programming matrices, LeetCode testcase paste parsing, and background handwriting-to-text recognition with DSA code token normalization.

### Can I use Rough Notebook offline?
Yes. Rough Notebook runs 100% client-side in your browser. All structured blocks, canvas interactions, and keyboard shortcuts work offline with zero telemetry and no account required.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<p align="left">
  Crafted by <a href="https://github.com/shambhoo-narwaria"><strong>Shambhoo Narwaria</strong></a>
</p>
