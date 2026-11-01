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
  let pointerMenuEl: HTMLDivElement | null = $state(null);
  let pointerMenuOpen = $state(false);
  let selectedPointerId = $state<string | null>(null);
  let editingPointerId = $state<string | null>(null);
  let editPointerName = $state('');
  let isHovered = $state(false);

  $effect(() => {
    registerBlockRoot(block.id, root);
    return () => registerBlockRoot(block.id, null);
  });

  function handleDocumentClick(e: MouseEvent) {
    if (pointerMenuOpen && pointerMenuEl && !pointerMenuEl.contains(e.target as Node)) {
      pointerMenuOpen = false;
    }
  }

  $effect(() => {
    if (pointerMenuOpen) {
      window.addEventListener('mousedown', handleDocumentClick);
      return () => window.removeEventListener('mousedown', handleDocumentClick);
    }
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
        pointerMenuOpen = false;
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
    const defaultNames = ['L', 'R', 'i', 'j', 'slow', 'fast', 'mid', 'cur'];
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
  <!-- Top Pointers Control Strip: [ ⇄ Pointers ▾ ] [ Clear ] -->
  <div class="pointer-header-strip" class:is-visible={isHovered || selected || pointers.length > 0 || pointerMenuOpen}>
    <div class="pointer-menu-wrap" bind:this={pointerMenuEl}>
      <button
        type="button"
        class="capsule-btn"
        class:is-active={pointerMenuOpen}
        onclick={(e) => {
          e.stopPropagation();
          pointerMenuOpen = !pointerMenuOpen;
        }}
        title="Pointers algorithm presets"
        aria-haspopup="menu"
        aria-expanded={pointerMenuOpen}
      >
        <span class="capsule-icon">⇄</span>
        <span class="capsule-label">
          {#if pointers.length === 0}
            Pointers
          {:else}
            Pointers ({pointers.length})
          {/if}
        </span>
        <svg
          class="chevron-icon"
          class:rotate={pointerMenuOpen}
          viewBox="0 0 20 20"
          width="8"
          height="8"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>

      <!-- Dropdown of Pointer Options -->
      {#if pointerMenuOpen}
        <div class="pointer-dropdown" role="menu">
          <div class="dropdown-header">
            <span class="dropdown-header-title">Pointer Algorithms</span>
          </div>

          <div class="dropdown-section">
            <button
              type="button"
              class="dropdown-item-btn"
              onclick={() => {
                setArrayPointerPreset(block.id, 'two_pointer');
                pointerMenuOpen = false;
              }}
            >
              <div class="item-dots">
                <span class="dot dot-cyan"></span>
                <span class="dot dot-rose"></span>
              </div>
              <div class="item-text">
                <span class="item-title">Two-Pointer (L & R)</span>
                <span class="item-desc">Left at 0, Right at end</span>
              </div>
            </button>

            <button
              type="button"
              class="dropdown-item-btn"
              onclick={() => {
                setArrayPointerPreset(block.id, 'ij');
                pointerMenuOpen = false;
              }}
            >
              <div class="item-dots">
                <span class="dot dot-purple"></span>
                <span class="dot dot-amber"></span>
              </div>
              <div class="item-text">
                <span class="item-title">Index Scan (i & j)</span>
                <span class="item-desc">i at 0, j at 1</span>
              </div>
            </button>

            <button
              type="button"
              class="dropdown-item-btn"
              onclick={() => {
                setArrayPointerPreset(block.id, 'slow_fast');
                pointerMenuOpen = false;
              }}
            >
              <div class="item-dots">
                <span class="dot dot-emerald"></span>
                <span class="dot dot-cyan"></span>
              </div>
              <div class="item-text">
                <span class="item-title">Slow & Fast (Floyd's Cycle)</span>
                <span class="item-desc">slow at 0, fast at 0</span>
              </div>
            </button>
          </div>

          <div class="dropdown-divider"></div>

          <div class="dropdown-section">
            <button
              type="button"
              class="dropdown-item-btn"
              onclick={() => {
                handleAddCustomPointer();
                pointerMenuOpen = false;
              }}
            >
              <div class="item-icon-box">
                <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="10" y1="4" x2="10" y2="16" />
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
              </div>
              <div class="item-text">
                <span class="item-title">Add Custom Pointer</span>
                <span class="item-desc">Create tagged pointer</span>
              </div>
            </button>
          </div>
        </div>
      {/if}
    </div>

    <!-- Clear Button (shows when pointers are placed on the array) -->
    {#if pointers.length > 0}
      <button
        type="button"
        class="clear-capsule-btn"
        onclick={(e) => {
          e.stopPropagation();
          setArrayPointerPreset(block.id, 'clear');
        }}
        title="Clear all pointers"
      >
        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span>Clear</span>
      </button>
    {/if}
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

      <!-- Separated Add / Remove Cell Action at the tail of the array -->
      <div class="add-cell-col" class:is-visible={isHovered || selected}>
        <div class="pointer-track-spacer"></div>
        <div class="idx-spacer"></div>
        <div class="cell-action-group">
          <button
            type="button"
            class="cell-add-btn"
            onclick={handleAddCell}
            title="Add cell to array"
            aria-label="Add cell"
          >
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="10" y1="4" x2="10" y2="16" />
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>

          {#if block.values.length > 1}
            <button
              type="button"
              class="cell-remove-btn"
              onclick={handleRemoveCell}
              title="Remove last cell"
              aria-label="Remove cell"
            >
              <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <line x1="4" y1="10" x2="16" y2="10" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
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

  /* ── Pointer Header Strip: [ ⇄ Pointers ▾ ] [ Clear ] ───────────────────── */
  .pointer-header-strip {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    opacity: 0;
    transform: translateY(2px);
    pointer-events: none;
    transition: opacity 0.16s ease, transform 0.16s ease;
    user-select: none;
  }

  .pointer-header-strip.is-visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .pointer-menu-wrap {
    position: relative;
    display: inline-flex;
  }

  .capsule-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 22px;
    padding: 0 8px;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    color: var(--text-h);
    font: 600 11px var(--sans);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .capsule-btn:hover,
  .capsule-btn.is-active {
    background: var(--surface-2);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
    color: var(--accent-primary);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
    transform: translateY(-1px);
  }

  .capsule-icon {
    font-size: 11px;
    line-height: 1;
  }

  .chevron-icon {
    color: var(--muted);
    transition: transform 0.15s ease;
  }

  .chevron-icon.rotate {
    transform: rotate(180deg);
  }

  .clear-capsule-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 7px;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    color: var(--muted);
    font: 600 10.5px var(--sans);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .clear-capsule-btn:hover {
    background: color-mix(in srgb, var(--accent-r) 10%, var(--surface));
    border-color: color-mix(in srgb, var(--accent-r) 40%, var(--border));
    color: var(--accent-r);
    transform: translateY(-1px);
  }

  /* ── Dropdown of Pointer Options ────────────────────────────────────────── */
  .pointer-dropdown {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    width: 220px;
    background: color-mix(in srgb, var(--surface) 97%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
    z-index: 300;
    padding: 5px;
    animation: dropdownSlideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes dropdownSlideIn {
    from {
      opacity: 0;
      transform: translateY(-5px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dropdown-header {
    padding: 5px 7px 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 3px;
  }

  .dropdown-header-title {
    font: 700 10.5px var(--sans);
    color: var(--muted);
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .dropdown-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
  }

  .dropdown-item-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-h);
    cursor: pointer;
    text-align: left;
    transition: all 0.12s ease;
  }

  .dropdown-item-btn:hover {
    background: var(--surface-2);
    transform: translateX(2px);
  }

  .item-dots {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .dot-cyan { background: #06b6d4; }
  .dot-rose { background: #f43f5e; }
  .dot-purple { background: #a855f7; }
  .dot-amber { background: #f59e0b; }
  .dot-emerald { background: #10b981; }

  .item-icon-box {
    width: 17px;
    height: 17px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--accent-primary) 12%, var(--surface-2));
    color: var(--accent-primary);
    flex-shrink: 0;
  }

  .item-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .item-title {
    font: 600 11.5px var(--sans);
    color: var(--text-h);
    line-height: 1.2;
  }

  .item-desc {
    font: 500 10px var(--sans);
    color: var(--muted);
    line-height: 1.1;
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
    gap: 8px;
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

  /* ── Separated Add/Remove Cell Action ──────────────────────────────────── */
  .add-cell-col {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.35;
    transition: opacity 0.15s ease;
  }

  .add-cell-col.is-visible,
  .add-cell-col:hover {
    opacity: 1;
  }

  .pointer-track-spacer {
    min-height: 26px;
    margin-bottom: 2px;
  }

  .idx-spacer {
    height: 18px;
  }

  .cell-action-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 54px;
    justify-content: center;
  }

  .cell-add-btn,
  .cell-remove-btn {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px dashed var(--border-strong);
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    color: var(--muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.15s ease;
    box-shadow: var(--shadow-sm);
  }

  .cell-add-btn:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    background: var(--surface-2);
    transform: scale(1.08);
  }

  .cell-remove-btn:hover {
    border-color: var(--accent-r);
    color: var(--accent-r);
    background: color-mix(in srgb, var(--accent-r) 10%, var(--surface));
    transform: scale(1.08);
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
