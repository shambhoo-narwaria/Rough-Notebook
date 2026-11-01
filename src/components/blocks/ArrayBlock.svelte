<script lang="ts">
  import {
    doc,
    setSelectedBlock,
    exitCellFocus,
    clearSelection,
    pushUndoPoint,
    randomSampleInt,
    addArrayPointer,
    moveArrayPointer,
    removeArrayPointer,
    setArrayPointerPreset,
    type PlacedBlock,
  } from '@/library/state/document.svelte';
  import type { ArrayPointer } from '@/library/state/types';
  import { registerBlockRoot } from '@/library/focus/focusRegistry';

  type Props = { block: PlacedBlock & { type: 'array' } };
  let { block }: Props = $props();

  let root: HTMLDivElement | null = $state(null);
  let selectedPointerId = $state<string | null>(null);
  let editingPointerId = $state<string | null>(null);
  let editPointerName = $state('');
  let isHovered = $state(false);

  $effect(() => {
    registerBlockRoot(block.id, root);
    return () => registerBlockRoot(block.id, null);
  });

  const selected = $derived(doc.selectedBlockId === block.id);
  const pointers = $derived(block.pointers ?? []);

  // Compute sliding window range if multiple pointers exist
  const windowRange = $derived.by(() => {
    if (!pointers || pointers.length < 2) return null;
    let minIdx = Infinity;
    let maxIdx = -Infinity;
    for (const p of pointers) {
      if (p.index < minIdx) minIdx = p.index;
      if (p.index > maxIdx) maxIdx = p.index;
    }
    if (minIdx === Infinity || maxIdx === -Infinity || minIdx === maxIdx) return null;
    return { min: minIdx, max: maxIdx };
  });

  function isCellInWindow(i: number): boolean {
    return windowRange !== null && i >= windowRange.min && i <= windowRange.max;
  }

  function pointersAtIndex(i: number): ArrayPointer[] {
    return pointers.filter((p) => p.index === i);
  }

  function inputSize(v: string): number {
    return Math.max(4, Math.min(18, String(v ?? '').length + 2));
  }

  function cellInputs(): HTMLInputElement[] {
    if (!root) return [];
    return [...root.querySelectorAll<HTMLInputElement>('[data-cell-input]')];
  }

  function cellKeydown(e: KeyboardEvent, i: number) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const inputs = cellInputs();
      const cur = inputs.indexOf(e.target as HTMLInputElement);
      if (cur === -1) return;
      const next = (cur + (e.shiftKey ? -1 : 1) + inputs.length) % inputs.length;
      inputs[next]?.focus();
      return;
    }
    if (e.key === 'Backspace') {
      const inp = e.target as HTMLInputElement;
      if (inp.value !== '' || e.repeat) return;
      e.preventDefault();
      const inputs = cellInputs();
      const cur = inputs.indexOf(inp);
      if (cur > 0) inputs[cur - 1]?.focus();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      root?.focus();
      exitCellFocus();
      return;
    }
    if (e.key === 'Delete' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      block.values[i] = '';
      return;
    }
  }

  function onWrapKeydown(e: KeyboardEvent) {
    if (selectedPointerId) {
      if (e.key === 'ArrowLeft' || e.key === '[' || e.key === ',') {
        e.preventDefault();
        e.stopPropagation();
        moveArrayPointer(block.id, selectedPointerId, -1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ']' || e.key === '.') {
        e.preventDefault();
        e.stopPropagation();
        moveArrayPointer(block.id, selectedPointerId, 1);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        removeArrayPointer(block.id, selectedPointerId);
        selectedPointerId = null;
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        selectedPointerId = null;
        return;
      }
    }

    if (e.target !== e.currentTarget) return;
    if (!selected) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSelection();
    }
  }

  function handleSelectPointer(p: ArrayPointer, e: MouseEvent) {
    e.stopPropagation();
    selectedPointerId = p.id;
    setSelectedBlock(block.id);
  }

  function handleStepPointer(p: ArrayPointer, dir: -1 | 1, e: MouseEvent) {
    e.stopPropagation();
    selectedPointerId = p.id;
    moveArrayPointer(block.id, p.id, dir);
  }

  function handleDeletePointer(p: ArrayPointer, e: MouseEvent) {
    e.stopPropagation();
    if (selectedPointerId === p.id) selectedPointerId = null;
    removeArrayPointer(block.id, p.id);
  }

  function startRenamePointer(p: ArrayPointer, e: MouseEvent) {
    e.stopPropagation();
    editingPointerId = p.id;
    editPointerName = p.name;
  }

  function finishRenamePointer(p: ArrayPointer) {
    if (!editingPointerId) return;
    const trimmed = editPointerName.trim();
    if (trimmed) {
      p.name = trimmed;
    }
    editingPointerId = null;
  }

  function handleIndexClick(i: number) {
    if (selectedPointerId) {
      moveArrayPointer(block.id, selectedPointerId, i, true);
    }
  }

  function handleAddCell() {
    pushUndoPoint();
    block.values.push(randomSampleInt(1, 20));
  }

  function handleRemoveCell() {
    if (block.values.length <= 1) return;
    pushUndoPoint();
    block.values.pop();
    const maxIdx = block.values.length - 1;
    if (block.pointers) {
      for (const p of block.pointers) {
        if (p.index > maxIdx) p.index = maxIdx;
      }
    }
  }

  function handleAddCustomPointer() {
    const defaultNames = ['L', 'R', 'i', 'j', 'slow', 'fast', 'p'];
    const usedNames = new Set((block.pointers ?? []).map((p) => p.name));
    const nextName = defaultNames.find((n) => !usedNames.has(n)) ?? `p${(block.pointers?.length ?? 0) + 1}`;
    addArrayPointer(block.id, nextName, 0);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="wrap"
  bind:this={root}
  tabindex="0"
  role="application"
  aria-label="Array"
  onkeydown={onWrapKeydown}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
  onclick={() => setSelectedBlock(block.id)}
>
  <!-- Interactive Two-Pointer Action Toolbar -->
  <div class="pointer-toolbar" class:is-visible={isHovered || selected || pointers.length > 0}>
    <div class="preset-group">
      <button
        type="button"
        class="preset-btn"
        title="Apply Left & Right Two-Pointer algorithm setup"
        onclick={() => setArrayPointerPreset(block.id, 'two_pointer')}
      >
        <span class="btn-dot dot-cyan"></span>
        <span class="btn-dot dot-rose"></span>
        <span>L & R</span>
      </button>

      <button
        type="button"
        class="preset-btn"
        title="Apply i & j index pointer setup"
        onclick={() => setArrayPointerPreset(block.id, 'ij')}
      >
        <span class="btn-dot dot-purple"></span>
        <span class="btn-dot dot-amber"></span>
        <span>i & j</span>
      </button>

      <button
        type="button"
        class="preset-btn"
        title="Apply Fast & Slow pointer (Floyd's cycle detection) setup"
        onclick={() => setArrayPointerPreset(block.id, 'slow_fast')}
      >
        <span class="btn-dot dot-emerald"></span>
        <span class="btn-dot dot-cyan"></span>
        <span>Slow / Fast</span>
      </button>

      <button
        type="button"
        class="preset-btn add-btn"
        title="Add new pointer badge"
        onclick={handleAddCustomPointer}
      >
        <svg viewBox="0 0 20 20" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="10" y1="4" x2="10" y2="16" />
          <line x1="4" y1="10" x2="16" y2="10" />
        </svg>
        <span>Pointer</span>
      </button>

      {#if pointers.length > 0}
        <button
          type="button"
          class="preset-btn clear-ptr-btn"
          title="Remove all pointers"
          onclick={() => setArrayPointerPreset(block.id, 'clear')}
        >
          <span>Clear</span>
        </button>
      {/if}
    </div>

    <!-- Cell Count Controls -->
    <div class="cell-ctrl-group">
      <button
        type="button"
        class="cell-adj-btn"
        title="Add cell to array"
        onclick={handleAddCell}
        aria-label="Add cell"
      >
        +
      </button>
      <button
        type="button"
        class="cell-adj-btn"
        disabled={block.values.length <= 1}
        title="Remove last cell"
        onclick={handleRemoveCell}
        aria-label="Remove cell"
      >
        −
      </button>
    </div>
  </div>

  <div class="scale">
    <div class="row">
      {#each block.values as v, i (i)}
        {@const cellPointers = pointersAtIndex(i)}
        {@const inWindow = isCellInWindow(i)}

        <div class="col" class:in-window={inWindow}>
          <!-- Dynamic Pointer Badges Header -->
          <div class="pointer-track" class:has-pointers={cellPointers.length > 0}>
            {#each cellPointers as p (p.id)}
              {@const isSelectedPtr = selectedPointerId === p.id}
              <div
                class="ptr-badge ptr-{p.color ?? 'cyan'}"
                class:is-active-pointer={isSelectedPtr}
                role="button"
                tabindex="0"
                title={`Pointer ${p.name} at index ${p.index}. Click to select, [ or ] to step.`}
                onclick={(e) => handleSelectPointer(p, e)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectPointer(p, e as unknown as MouseEvent);
                  }
                }}
              >
                <!-- Step Left -->
                <button
                  type="button"
                  class="ptr-step-btn"
                  title="Step pointer left"
                  aria-label="Step left"
                  onclick={(e) => handleStepPointer(p, -1, e)}
                  disabled={p.index <= 0}
                >
                  ‹
                </button>

                <!-- Name Label / Inline Editor -->
                {#if editingPointerId === p.id}
                  <input
                    class="ptr-edit-input"
                    type="text"
                    bind:value={editPointerName}
                    maxlength="6"
                    onblur={() => finishRenamePointer(p)}
                    onkeydown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        finishRenamePointer(p);
                      }
                    }}
                    autofocus
                  />
                {:else}
                  <span
                    class="ptr-label"
                    ondblclick={(e) => startRenamePointer(p, e)}
                  >
                    {p.name}
                  </span>
                {/if}

                <!-- Step Right -->
                <button
                  type="button"
                  class="ptr-step-btn"
                  title="Step pointer right"
                  aria-label="Step right"
                  onclick={(e) => handleStepPointer(p, 1, e)}
                  disabled={p.index >= block.values.length - 1}
                >
                  ›
                </button>

                <!-- Delete X -->
                <button
                  type="button"
                  class="ptr-del-btn"
                  title="Remove pointer"
                  aria-label="Remove pointer"
                  onclick={(e) => handleDeletePointer(p, e)}
                >
                  ×
                </button>

                <!-- Downward pointer arrow indicator -->
                <div class="ptr-arrow"></div>
              </div>
            {/each}
          </div>

          <!-- Cell Index Tag -->
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="idx"
            class:idx-window={inWindow}
            title={selectedPointerId ? `Click to snap selected pointer to index [${i}]` : `Index ${i}`}
            onclick={() => handleIndexClick(i)}
          >
            {i}
          </div>

          <!-- Array Cell -->
          <div class="cell" class:cell-window={inWindow}>
            <input
              class="val"
              data-cell-input
              value={v}
              size={inputSize(v)}
              aria-label={`Index ${i}`}
              onfocus={() => setSelectedBlock(block.id, i)}
              onkeydown={(e) => cellKeydown(e, i)}
              oninput={(e) => {
                block.values[i] = e.currentTarget.value;
              }}
            />
          </div>
        </div>
      {/each}
    </div>

    <!-- Sliding Window Underline Bracket (when active) -->
    {#if windowRange}
      <div class="window-caption">
        <span class="window-tag">Window: [{windowRange.min}..{windowRange.max}]</span>
        <span class="window-len">len = {windowRange.max - windowRange.min + 1}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .wrap {
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    padding: 4px;
    outline: none;
    transition: all 0.15s ease;
    min-width: 0;
    width: fit-content;
    max-width: min(92vw, 960px);
    position: relative;
  }

  .wrap:focus-visible {
    border-color: var(--border-glow);
  }

  /* ── Interactive Pointer Toolbar ────────────────────────────────────────── */
  .pointer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    opacity: 0;
    transform: translateY(2px);
    pointer-events: none;
    transition: opacity 0.16s ease, transform 0.16s ease;
    user-select: none;
  }

  .pointer-toolbar.is-visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .preset-group {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: color-mix(in srgb, var(--surface) 90%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2px 4px;
    box-shadow: var(--shadow-sm);
  }

  .preset-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 6px;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    font: 600 10.5px var(--sans);
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }

  .preset-btn:hover {
    background: var(--surface-2);
    border-color: var(--border);
    color: var(--text-h);
  }

  .preset-btn.add-btn:hover {
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 30%, var(--border));
  }

  .preset-btn.clear-ptr-btn:hover {
    color: var(--accent-r);
  }

  .btn-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .dot-cyan { background: #06b6d4; }
  .dot-rose { background: #f43f5e; }
  .dot-purple { background: #a855f7; }
  .dot-emerald { background: #10b981; }
  .dot-amber { background: #f59e0b; }

  .cell-ctrl-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: color-mix(in srgb, var(--surface) 90%, transparent);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2px 3px;
    box-shadow: var(--shadow-sm);
  }

  .cell-adj-btn {
    width: 18px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    font: 600 12px var(--mono);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.12s ease;
  }

  .cell-adj-btn:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: var(--border);
  }

  .cell-adj-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* ── Array Structure ────────────────────────────────────────────────────── */
  .scale {
    width: fit-content;
    max-width: min(92vw, 960px);
  }

  .row {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-end;
    gap: 10px;
  }

  .col {
    flex: 0 0 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    width: min-content;
    position: relative;
    transition: transform 0.15s ease;
  }

  /* ── Pointer Badges & Track ─────────────────────────────────────────────── */
  .pointer-track {
    min-height: 26px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: 100%;
    margin-bottom: 2px;
  }

  .ptr-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 1px;
    height: 20px;
    padding: 0 2px;
    border-radius: 5px;
    font: 700 10.5px var(--mono);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    transition: all 0.15s ease;
    animation: ptrPopIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 20;
    user-select: none;
  }

  @keyframes ptrPopIn {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.92);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .ptr-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.14);
  }

  .ptr-badge.is-active-pointer {
    transform: translateY(-2px);
    box-shadow: 0 0 0 2px var(--accent-primary-glow), 0 4px 12px rgba(0, 0, 0, 0.18);
  }

  /* Color themes for pointer badges */
  .ptr-cyan {
    background: color-mix(in srgb, #06b6d4 15%, var(--surface));
    border: 1px solid #06b6d4;
    color: #0891b2;
  }

  .ptr-rose {
    background: color-mix(in srgb, #f43f5e 15%, var(--surface));
    border: 1px solid #f43f5e;
    color: #e11d48;
  }

  .ptr-purple {
    background: color-mix(in srgb, #a855f7 15%, var(--surface));
    border: 1px solid #a855f7;
    color: #9333ea;
  }

  .ptr-emerald {
    background: color-mix(in srgb, #10b981 15%, var(--surface));
    border: 1px solid #10b981;
    color: #059669;
  }

  .ptr-amber {
    background: color-mix(in srgb, #f59e0b 15%, var(--surface));
    border: 1px solid #f59e0b;
    color: #d97706;
  }

  /* Dark mode overrides for high-contrast clarity */
  :global(.dark) .ptr-cyan, :global([data-theme="dark"]) .ptr-cyan { color: #22d3ee; }
  :global(.dark) .ptr-rose, :global([data-theme="dark"]) .ptr-rose { color: #fb7185; }
  :global(.dark) .ptr-purple, :global([data-theme="dark"]) .ptr-purple { color: #c084fc; }
  :global(.dark) .ptr-emerald, :global([data-theme="dark"]) .ptr-emerald { color: #34d399; }
  :global(.dark) .ptr-amber, :global([data-theme="dark"]) .ptr-amber { color: #fbbf24; }

  .ptr-step-btn {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 11px;
    font-weight: 700;
    width: 12px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    border-radius: 3px;
    opacity: 0.7;
    transition: all 0.1s ease;
  }

  .ptr-step-btn:hover:not(:disabled) {
    opacity: 1;
    background: color-mix(in srgb, currentColor 18%, transparent);
  }

  .ptr-step-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .ptr-del-btn {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 11px;
    font-weight: 700;
    width: 12px;
    height: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    border-radius: 3px;
    opacity: 0.5;
    transition: all 0.1s ease;
    margin-left: -1px;
  }

  .ptr-del-btn:hover {
    opacity: 1;
    color: #ef4444;
    background: color-mix(in srgb, #ef4444 15%, transparent);
  }

  .ptr-label {
    padding: 0 2px;
    cursor: pointer;
  }

  .ptr-edit-input {
    width: 28px;
    border: none;
    background: color-mix(in srgb, var(--surface) 90%, transparent);
    color: inherit;
    font: inherit;
    padding: 0 2px;
    border-radius: 2px;
    outline: 1px solid currentColor;
    text-align: center;
  }

  .ptr-arrow {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 3.5px solid transparent;
    border-right: 3.5px solid transparent;
    border-top: 4px solid currentColor;
  }

  /* ── Index and Cell Styles ─────────────────────────────────────────────── */
  .idx {
    font: 600 11px var(--mono);
    color: var(--muted-2);
    text-align: center;
    padding: 2px 0;
    line-height: 1.15;
    letter-spacing: 0.02em;
    user-select: none;
    transition: all 0.15s ease;
    cursor: pointer;
    width: 100%;
  }

  .idx:hover {
    color: var(--accent-primary);
  }

  .col:focus-within .idx {
    color: var(--accent-cyan);
    font-weight: 700;
  }

  .idx.idx-window {
    color: var(--accent-primary);
    font-weight: 700;
  }

  .cell {
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    min-width: 54px;
    min-height: 54px;
    max-width: 22ch;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    box-shadow: var(--shadow-sm);
    transition: all 0.15s ease;
  }

  .cell:hover {
    border-color: var(--border-strong);
    background: var(--surface-2);
  }

  .cell.cell-window {
    border-color: color-mix(in srgb, var(--accent-primary) 55%, var(--border));
    background: color-mix(in srgb, var(--accent-primary) 8%, var(--surface));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-primary) 20%, transparent), var(--shadow-sm);
  }

  .cell:focus-within {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow), var(--shadow-sm);
    background: var(--surface);
    transform: translateY(-1px);
  }

  .val {
    box-sizing: border-box;
    border: none;
    background: transparent;
    text-align: center;
    font: 600 14px/1.35 var(--mono);
    color: var(--text-h);
    padding: 8px 10px;
    outline: none;
    min-height: 54px;
    min-width: 54px;
    max-width: 22ch;
    field-sizing: content;
    width: 100%;
  }

  /* ── Sliding Window Caption ────────────────────────────────────────────── */
  .window-caption {
    margin-top: 6px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font: 600 10.5px var(--mono);
    color: var(--muted);
    padding: 2px 6px;
    background: color-mix(in srgb, var(--surface-2) 65%, transparent);
    border-radius: 4px;
    border: 1px dashed var(--border);
    user-select: none;
  }

  .window-tag {
    color: var(--accent-primary);
  }

  .window-len {
    color: var(--muted-2);
  }
</style>
