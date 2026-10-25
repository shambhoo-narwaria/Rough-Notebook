# Contributing and Developer Guide

> **Live Application:** [https://shambhoo-narwaria.github.io/Rough-Notebook/](https://shambhoo-narwaria.github.io/Rough-Notebook/)

To contribute to Rough Notebook, ensure your environment meets the following requirements:
- **Node.js:** Version 18.0.0 or higher (LTS recommended).
- **Package Manager:** `npm` (bundled with Node.js).
- **TypeScript:** Version 5.x or 6.x.
- **Git:** Version 2.30 or higher.

---

## Local Development Workflow

### 1. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/shambhoo-narwaria/Rough-Notebook.git
cd Rough-Notebook
npm install
```

### 2. Running Dev Server
Launch Vite development server with hot module reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### 3. Type Checking and Verification
Rough Notebook enforces strict type checking across all Svelte and TypeScript files:

```bash
npm run check
```

This runs `svelte-check` and `tsc --noEmit` against the root `tsconfig.json`. Ensure this passes with 0 errors and 0 warnings before submitting any changes.

### 4. Building for Production
Generate the production bundle into the `dist/` folder:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Codebase Architecture Conventions

### Svelte 5 Runes Standard
Rough Notebook is written for Svelte 5 and uses Runes exclusively:
- Use `$state(...)` for reactive variables. Do not use legacy Svelte 3/4 `let` bindings for reactivity.
- Use `$derived(...)` for computed properties instead of `$:` statements.
- Use `$props()` to declare component inputs with strict TypeScript typing.
- Use `$effect(...)` for side effects and browser synchronization (e.g. document title, attributes, DOM measurements).
- In standalone TypeScript files, name reactive modules with the `.svelte.ts` extension (such as `src/library/document.svelte.ts` and `src/library/sketches.svelte.ts`).

### CSS and Styling Guidelines
- Maintain pure modular Vanilla CSS within component `<style>` blocks.
- Do not introduce CSS frameworks (such as Tailwind or Bootstrap) unless explicitly discussed.
- Always use semantic design tokens from `src/theme.css` rather than hardcoding hex colors:
  - Backgrounds: `var(--bg)`, `var(--surface)`, `var(--surface-2)`.
  - Borders: `var(--border)`, `var(--border-strong)`, `var(--border-glow)`.
  - Text: `var(--text)`, `var(--text-h)`, `var(--muted)`.
  - Primary Accent: `var(--accent-primary)`, `var(--accent-primary-hover)`, `var(--accent-primary-glow)`.
- Ensure all components support both Light (warm paper) and Dark (warm obsidian) modes automatically through CSS variable inheritance.

---

## Guide: How to Add a New Data Structure Block

Follow these steps to add a new block type (for example, a Linked List Node or Binary Tree Node):

### Step 1: Define the Type in `src/library/types.ts`
Add the new block type definition to the `Block` union:

```typescript
export interface LinkedListNodeBlock {
  id: string;
  type: 'linkedListNode';
  val: string;
  nextId?: string | null;
  caption?: string;
}

export type Block =
  | ArrayBlock
  | MatrixBlock
  | NoteBlock
  | SpineBlock
  | LinkedListNodeBlock;
```

### Step 2: Create the Component in `src/components/blocks/`
Create `LinkedListNodeBlock.svelte`:
- Accept `{ block, isSelected, onSelect }` as component props via `$props()`.
- Register the root element with `registerBlockRoot(block.id, el)` from `src/library/focusRegistry.ts`.
- Implement keyboard navigation and cell editing behaviors.

### Step 3: Register in Command Palette (`src/library/commands.ts`)
Add a new command definition to the `COMMANDS` list:

```typescript
{
  id: 'linkedListNode',
  title: 'Linked List Node',
  description: 'Single or doubly linked list node pointer',
  needsDimensions: false,
}
```

### Step 4: Wire Rendering in `src/components/canvas/ScratchCanvas.svelte`
Import the new component and add a branch inside the block rendering loop:

```svelte
{#if item.type === 'array'}
  <ArrayBlock block={item} ... />
{:else if item.type === 'matrix'}
  <MatrixBlock block={item} ... />
{:else if item.type === 'linkedListNode'}
  <LinkedListNodeBlock block={item} ... />
{/if}
```

### Step 5: Verify Changes
Run the verification suite:

```bash
npm run check
npm run build
```

---

## Submitting Pull Requests

1. Create a descriptive branch name (`git checkout -b feature/tree-visualization`).
2. Keep commits atomic and clearly titled.
3. Verify that `npm run check` reports zero errors.
4. Verify that `npm run build` succeeds without bundle warnings.
5. Open a Pull Request on GitHub against the `main` branch with a summary of the implemented feature or fix.
