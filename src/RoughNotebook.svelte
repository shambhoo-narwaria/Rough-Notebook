<script lang="ts">
  import { tick } from 'svelte';
  import {
    doc,
    setSelectedBlock,
    placeBlockAt,
    createArrayBlock,
    createMatrixBlock,
    removeBlock,
    replaceBlocks,
    undoEditor,
    redoEditor,
    copyStructureById,
    pasteStructureAt,
    structureClipboard,
    newId,
    clearSelection,
  } from './library/state/document.svelte';
  import {
    undoSketchStroke,
    redoSketchStroke,
    clearAllSketches,
    sketchStrokes,
    hasPendingHandwritingConversion,
  } from './library/state/sketches.svelte';
  import { filterCommands, applyCommand, type CommandDef } from './library/commands/commands';
  import { focusBlockRoot } from './library/focus/focusRegistry';
  import { isEditingTextField, isInAppModalField } from './library/focus/focus-util';
  import type { Block } from './library/state/types';
  import { parseStructureInput } from './library/parser/parseStructureInput';
  import ScratchCanvas from '@/components/canvas/ScratchCanvas.svelte';
  import SlashPalette from '@/components/navigation/SlashPalette.svelte';
  import Header from '@/components/navigation/Header.svelte';
  import HelpModal from '@/components/modals/HelpModal.svelte';
  import AutoCreateModal, { type AutoCreateState } from '@/components/modals/AutoCreateModal.svelte';
  import DimensionModal, { type DimState } from '@/components/modals/DimensionModal.svelte';
  import ClearConfirmModal from '@/components/modals/ClearConfirmModal.svelte';
  import type { PenColorKey } from './library/handwriting/penColor';
  import { applyTheme, getInitialTheme, type ThemeMode } from './library/theme/theme';
  import {
    notebookPages,
    activePageIndex,
    createNewPage,
    goToPrevPage,
    goToNextPage,
    switchToPage,
    renamePage,
    deletePage,
  } from './library/state/notebookPages.svelte';

  let slashOpen = $state(false);
  let slashFilter = $state('');
  let slashActive = $state(0);

  let insertAt = $state<{ x: number; y: number }>({ x: 80, y: 100 });

  let dim = $state<DimState | null>(null);
  let autoCreateModal = $state<AutoCreateState | null>(null);
  let clearModalOpen = $state(false);
  let helpOpen = $state(false);
  let penActive = $state(false);
  let penColorKey = $state<PenColorKey>('ink');
  let themeMode = $state<ThemeMode>(getInitialTheme());
  let dark = $derived(themeMode === 'dark');

  function setPenActive(active: boolean) {
    penActive = active;
    if (penActive) {
      doc.insertAnchor = null;
      doc.selectedBlockId = null;
      doc.cellLinearFocus = null;
    }
  }

  function togglePen() {
    setPenActive(!penActive);
  }

  function cycleTheme() {
    const next: ThemeMode = themeMode === 'light' ? 'paper' : themeMode === 'paper' ? 'dark' : 'light';
    themeMode = next;
    applyTheme(next);
  }

  const slashCommands = $derived(filterCommands(slashFilter));

  const penStrokeColor = $derived.by(() => {
    if (themeMode === 'paper') {
      if (penColorKey === 'r') return '#C44742';  /* Red ink */
      if (penColorKey === 'b') return '#2866B2';  /* Blue ink */
      if (penColorKey === 'v') return '#7045C4';  /* Violet ink */
      if (penColorKey === 'g') return '#7045C4';  /* Green / Violet ink */
      return '#332D27';                           /* Graphite ink */
    }
    if (themeMode === 'dark') {
      if (penColorKey === 'r') return '#C94A3A';  /* Red ink */
      if (penColorKey === 'b') return '#2B6EA8';  /* Blue ink */
      if (penColorKey === 'v') return '#B49AFF';  /* Lavender ink */
      if (penColorKey === 'g') return '#3A7D5C';  /* Green ink */
      return '#F0ECF5';                           /* White ink */
    }
    // Light mode
    if (penColorKey === 'r') return '#C94A3A';    /* Red ink */
    if (penColorKey === 'b') return '#2B6EA8';    /* Blue ink */
    if (penColorKey === 'v') return '#7045C4';    /* Violet ink */
    if (penColorKey === 'g') return '#3A7D5C';    /* Green ink */
    return '#29272E';                             /* Black ink */
  });

  $effect(() => {
    slashFilter;
    slashActive = 0;
  });

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.toggleAttribute('data-pen-draw', penActive);
  });

  $effect(() => {
    if (!autoCreateModal) return;
    void tick().then(() => {
      document.getElementById('auto-create-ta')?.focus();
    });
  });

  function openSlash(anchor?: { x: number; y: number }) {
    if (penActive) setPenActive(false);
    autoCreateModal = null;
    slashOpen = true;
    slashFilter = '';
    slashActive = 0;
    insertAt = anchor ?? doc.insertAnchor ?? { x: 100, y: 120 };
  }

  function closeSlash() {
    slashOpen = false;
    doc.insertAnchor = null;
  }

  function onCanvasContextInsert(pos: { x: number; y: number }) {
    doc.insertAnchor = pos;
    openSlash(pos);
  }

  async function pickSlash(cmd: CommandDef) {
    if (cmd.id === 'autoCreate') {
      closeSlash();
      autoCreateModal = { x: insertAt.x, y: insertAt.y, text: '', error: '' };
      return;
    }
    if (cmd.needsDimensions) {
      closeSlash();
      autoCreateModal = null;
      if (cmd.id === 'array') {
        dim = { kind: 'array', x: insertAt.x, y: insertAt.y, length: 5 };
      } else {
        dim = { kind: 'matrix', x: insertAt.x, y: insertAt.y, rows: 2, cols: 3 };
      }
      return;
    }

    const anchor = doc.selectedBlockId;
    const placed = applyCommand(cmd, anchor, insertAt);
    closeSlash();
    setSelectedBlock(placed.id, null);
    await tick();
    focusBlockRoot(placed.id);
  }

  function confirmDim() {
    if (!dim) return;
    let bl;
    if (dim.kind === 'array') {
      const n = Math.min(32, Math.max(1, Math.round(dim.length)));
      bl = placeBlockAt(createArrayBlock(n), dim.x, dim.y);
    } else {
      const r = Math.min(16, Math.max(1, Math.round(dim.rows)));
      const c = Math.min(16, Math.max(1, Math.round(dim.cols)));
      bl = placeBlockAt(createMatrixBlock(r, c), dim.x, dim.y);
    }
    dim = null;
    void tick().then(() => {
      setSelectedBlock(bl.id, null);
      focusBlockRoot(bl.id);
    });
  }

  function cancelDim() {
    dim = null;
  }

  function openAutoCreateAt(pos: { x: number; y: number }) {
    slashOpen = false;
    dim = null;
    autoCreateModal = { x: pos.x, y: pos.y, text: '', error: '' };
  }

  function cancelAutoCreate() {
    autoCreateModal = null;
  }

  async function confirmAutoCreate() {
    if (!autoCreateModal) return;
    const parsed = parseStructureInput(autoCreateModal.text);
    if (!parsed.ok) {
      autoCreateModal = { ...autoCreateModal, error: parsed.error };
      return;
    }
    let block: Block;
    if (parsed.kind === 'array') {
      block = { id: newId(), type: 'array', values: parsed.values };
    } else {
      block = { id: newId(), type: 'matrix', rows: parsed.rows };
    }
    const placed = placeBlockAt(block, autoCreateModal.x, autoCreateModal.y);
    autoCreateModal = null;
    setSelectedBlock(placed.id, null);
    await tick();
    focusBlockRoot(placed.id);
  }

  function clearEntireBoard() {
    if (doc.blocks.length === 0 && sketchStrokes.length === 0) return;
    clearModalOpen = true;
  }

  function handleConfirmClear() {
    clearAllSketches();
    replaceBlocks([]);
    clearSelection();
    clearModalOpen = false;
  }

  function toggleTheme() {
    cycleTheme();
  }

  function closeHelp() {
    helpOpen = false;
  }

  function onPaletteKeydown(e: KeyboardEvent) {
    if (!slashOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeSlash();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      slashActive = Math.min(slashActive + 1, Math.max(0, slashCommands.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      slashActive = Math.max(slashActive - 1, 0);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = slashCommands[slashActive];
      if (cmd) void pickSlash(cmd);
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      slashFilter = slashFilter.slice(0, -1);
      return;
    }

    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      slashFilter += e.key;
    }
  }

  function onGlobalKeydown(e: KeyboardEvent) {
    if (dim && e.key === 'Escape') {
      e.preventDefault();
      cancelDim();
      return;
    }

    if (autoCreateModal && e.key === 'Escape') {
      e.preventDefault();
      cancelAutoCreate();
      return;
    }

    if (clearModalOpen && e.key === 'Escape') {
      e.preventDefault();
      clearModalOpen = false;
      return;
    }

    if (helpOpen && e.key === 'Escape') {
      e.preventDefault();
      closeHelp();
      return;
    }

    if (slashOpen) {
      onPaletteKeydown(e);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && doc.selectedBlockId && !isEditingTextField()) {
      e.preventDefault();
      copyStructureById(doc.selectedBlockId);
      return;
    }

    if (
      (e.metaKey || e.ctrlKey) &&
      e.key.toLowerCase() === 'v' &&
      !isEditingTextField() &&
      !isInAppModalField() &&
      structureClipboard.snapshot
    ) {
      e.preventDefault();
      const pos = doc.insertAnchor ?? { x: 120, y: 100 };
      const pasted = pasteStructureAt(pos);
      if (pasted) {
        void tick().then(() => {
          setSelectedBlock(pasted.id, null);
          focusBlockRoot(pasted.id);
        });
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
      if (!isEditingTextField() && !isInAppModalField()) {
        e.preventDefault();
        if (penActive) redoSketchStroke();
        else redoEditor();
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      if (!isEditingTextField() && !isInAppModalField()) {
        e.preventDefault();
        if (penActive || hasPendingHandwritingConversion()) undoSketchStroke();
        else undoEditor();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      if (!isEditingTextField() && !isInAppModalField()) {
        e.preventDefault();
        if (penActive) redoSketchStroke();
        else redoEditor();
      }
      return;
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && doc.selectedBlockId && !isEditingTextField()) {
      e.preventDefault();
      removeBlock(doc.selectedBlockId);
      return;
    }

    if (e.altKey && e.key === '[' && !isEditingTextField()) {
      e.preventDefault();
      goToPrevPage();
      return;
    }

    if (e.altKey && e.key === ']' && !isEditingTextField()) {
      e.preventDefault();
      goToNextPage();
      return;
    }

    if (e.altKey && e.key.toLowerCase() === 'n' && !isEditingTextField()) {
      e.preventDefault();
      createNewPage();
      return;
    }

    if (e.key === 'Escape') {
      if (penActive) {
        setPenActive(false);
        return;
      }
      if (doc.insertAnchor) {
        doc.insertAnchor = null;
        return;
      }
      if (doc.selectedBlockId && !isEditingTextField()) {
        e.preventDefault();
        const id = doc.selectedBlockId;
        const b = doc.blocks.find((x) => x.id === id);
        if (b?.type === 'note' && !String(b.content ?? '').trim()) {
          removeBlock(id);
        } else {
          doc.selectedBlockId = null;
          doc.cellLinearFocus = null;
        }
        return;
      }
    }

    if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !isEditingTextField() && !isInAppModalField()) {
      e.preventDefault();
      togglePen();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      const host = (document.activeElement as HTMLElement | null)?.closest?.('[data-placed-root]');
      if (host) {
        const id = host.getAttribute('data-block-id');
        if (id) {
          window.dispatchEvent(new CustomEvent('leetpad-open-structure-menu', { detail: { id } }));
          return;
        }
      }
      openSlash();
      return;
    }
  }
</script>

<svelte:window
  oncontextmenu={(e) => {
    if ((e.target as HTMLElement).closest('[data-placed-root]')) return;
    e.preventDefault();
  }}
  onkeydown={onGlobalKeydown}
/>

<main
  class="shell"
  data-editor-shell
  onpointerdown={(e) => {
    const el = e.target as HTMLElement;
    if (el.closest('.viewport') || el.closest('.side-toolbar')) return;
    doc.insertAnchor = null;
    const id = doc.selectedBlockId;
    if (id) {
      const b = doc.blocks.find((x) => x.id === id);
      if (b?.type === 'note' && !String(b.content ?? '').trim()) {
        removeBlock(id);
      }
    }
  }}
>
  <Header
    {penActive}
    {penColorKey}
    {dark}
    {themeMode}
    currentPageIndex={activePageIndex.value}
    totalPages={notebookPages.length}
    pages={notebookPages}
    onPrevPage={goToPrevPage}
    onNextPage={goToNextPage}
    onNewPage={createNewPage}
    onSwitchPage={switchToPage}
    onRenamePage={renamePage}
    onDeletePage={deletePage}
    onTogglePen={togglePen}
    onPickColor={(k) => (penColorKey = k)}
    onClearSketches={clearAllSketches}
    onOpenSlash={() => openSlash()}
    onClearBoard={clearEntireBoard}
    onToggleTheme={toggleTheme}
    onOpenHelp={() => (helpOpen = true)}
  />

  <ScratchCanvas
    {penActive}
    penStrokeColor={penStrokeColor}
    onSlash={() => openSlash()}
    onTogglePen={togglePen}
    onEmptyContextMenu={onCanvasContextInsert}
    onOpenAutoCreate={openAutoCreateAt}
  />

  <SlashPalette
    open={slashOpen}
    filter={slashFilter}
    commands={slashCommands}
    active={slashActive}
    onClose={closeSlash}
    onPick={(c) => void pickSlash(c)}
    onActiveChange={(i) => (slashActive = i)}
  />

  <AutoCreateModal
    bind:modal={autoCreateModal}
    onCancel={cancelAutoCreate}
    onConfirm={() => void confirmAutoCreate()}
  />

  <DimensionModal
    bind:dim={dim}
    onCancel={cancelDim}
    onConfirm={confirmDim}
  />

  <HelpModal open={helpOpen} onClose={closeHelp} />

  <ClearConfirmModal
    open={clearModalOpen}
    blockCount={doc.blocks.length}
    strokeCount={sketchStrokes.length}
    onConfirm={handleConfirmClear}
    onCancel={() => (clearModalOpen = false)}
  />
</main>

<style>
  .shell {
    position: relative;
    height: 100dvh;
    min-height: 100svh;
    max-height: 100dvh;
    overflow: hidden;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
    display: flex;
    flex-direction: column;
  }
</style>
