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
  import { notebookPages, activePageIndex, createNewPage, goToPrevPage, goToNextPage,} from './library/state/notebookPages.svelte';

  let zenMode = $state(false);
  let showZenToast = $state(false);
  let zenToastTimer: ReturnType<typeof setTimeout> | null = null;
  let showHeaderInZen = $state(false);

  function toggleZenMode() {
    zenMode = !zenMode;
    if (zenMode) {
      showZenToast = true;
      if (zenToastTimer) clearTimeout(zenToastTimer);
      zenToastTimer = setTimeout(() => {
        showZenToast = false;
      }, 2400);
    } else {
      showZenToast = false;
      showHeaderInZen = false;
    }
  }

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
  let dark = $state(typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

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

  const slashCommands = $derived(filterCommands(slashFilter));

  const penStrokeColor = $derived(
    penColorKey === 'r'
      ? '#C94A3A'   /* warm red */
      : penColorKey === 'g'
        ? '#3A7D5C'  /* earthy green */
        : penColorKey === 'b'
          ? '#2B6EA8'  /* calm blue */
          : dark
            ? '#F5F0E8'  /* warm parchment */
            : '#252525',  /* primary ink */
  );

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
    dark = !dark;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('leetpad-theme', dark ? 'dark' : 'light');
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

    if (e.altKey && e.key === '[') {
      e.preventDefault();
      goToPrevPage();
      return;
    }

    if (e.altKey && e.key === ']') {
      e.preventDefault();
      goToNextPage();
      return;
    }

    if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      createNewPage();
      return;
    }

    if (e.key === 'Escape') {
      if (zenMode) {
        toggleZenMode();
        return;
      }
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

    if (e.key.toLowerCase() === 'z' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditingTextField() && !isInAppModalField()) {
      e.preventDefault();
      toggleZenMode();
      return;
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
  onpointermove={(e) => {
    if (zenMode) {
      if (e.clientY < 28) {
        showHeaderInZen = true;
      } else if (e.clientY > 80) {
        showHeaderInZen = false;
      }
    }
  }}
/>

<main
  class="shell"
  class:zen-mode={zenMode}
  class:show-header={showHeaderInZen}
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
  {#if showZenToast}
    <div class="zen-toast" role="status">
      <span>Zen Mode Active — Press Z or Esc to exit</span>
    </div>
  {/if}

  <Header
    {penActive}
    {penColorKey}
    {dark}
    currentPageIndex={activePageIndex.value}
    totalPages={notebookPages.length}
    {zenMode}
    onPrevPage={goToPrevPage}
    onNextPage={goToNextPage}
    onNewPage={createNewPage}
    onToggleZen={toggleZenMode}
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

  .shell.zen-mode :global(.top) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    transform: translateY(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .shell.zen-mode :global(.top:hover),
  .shell.zen-mode.show-header :global(.top) {
    transform: translateY(0);
  }

  .shell.zen-mode :global(.side-toolbar) {
    transform: translateY(-50%) translateX(-140%);
    opacity: 0;
    pointer-events: none;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .shell.zen-mode.show-header :global(.side-toolbar) {
    transform: translateY(-50%) translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  .zen-toast {
    position: fixed;
    top: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--accent-primary);
    color: var(--text-h);
    font-size: 11px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    animation: toastFade 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes toastFade {
    0% {
      opacity: 0;
      transform: translate(-50%, -10px);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    75% {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -10px);
    }
  }
</style>
