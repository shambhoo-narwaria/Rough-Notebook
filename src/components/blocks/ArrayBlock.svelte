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
  let activeContextMenuPointerId = $state<string | null>(null);
  let activeContextMenuEl = $state<HTMLDivElement | null>(null);
  let contextMenuPos = $state<{ x: number; y: number } | null>(null);
  let cellContextMenu = $state<{ index: number; x: number; y: number } | null>(null);
  let cellContextMenuEl = $state<HTMLDivElement | null>(null);
  let customPointerNameInput = $state('');
  let showCustomNameInput = $state(false);

  $effect(() => {
    registerBlockRoot(block.id, root);
    return () => registerBlockRoot(block.id, null);
  });

  function handleDocumentClick(e: MouseEvent) {
    if (pointerMenuOpen && pointerMenuEl && !pointerMenuEl.contains(e.target as Node)) {
      pointerMenuOpen = false;
    }
    if (activeContextMenuPointerId && activeContextMenuEl && !activeContextMenuEl.contains(e.target as Node)) {
      activeContextMenuPointerId = null;
    }
    if (cellContextMenu && cellContextMenuEl && !cellContextMenuEl.contains(e.target as Node)) {
      cellContextMenu = null;
      showCustomNameInput = false;
    }
  }

  $effect(() => {
    if (pointerMenuOpen || activeContextMenuPointerId || cellContextMenu) {
      window.addEventListener('mousedown', handleDocumentClick);
      return () => window.removeEventListener('mousedown', handleDocumentClick);
    }
  });

  const selected = $derived(doc.selectedBlockId === block.id);
  const pointers = $derived(block.pointers ?? []);
  const activeContextMenuPointer = $derived(
    pointers.find((p) => p.id === activeContextMenuPointerId) ?? null
  );

  const pointerColors: NonNullable<ArrayPointer['color']>[] = [
    'cyan',
    'rose',
    'purple',
    'emerald',
    'amber',
  ];

  // Compute sliding window range if multiple pointers exist
  const windowRange = $derived.by(() => {
    if (!pointers || pointers.length < 2) return null;
    let minIdx = Infinity;
    let maxIdx = -Infinity;
    for (const p of pointers) {
      if (p.index < minIdx) minIdx = p.index;
      if (p.index > maxIdx) maxIdx = p.index;
    }
    if (minIdx === Infinity || maxIdx === -Infinity) return null;
    return { min: minIdx, max: maxIdx };
  });

  const windowStats = $derived.by(() => {
    if (!windowRange) return null;
    const { min, max } = windowRange;
    const slice = block.values.slice(min, max + 1);
    const len = max - min + 1;

    // Boundary pointers
    const leftPointers = pointers.filter((p) => p.index === min);
    const rightPointers = pointers.filter((p) => p.index === max);

    // Numeric parsing and stats
    const parsedNums: (number | null)[] = slice.map((v) => {
      const s = String(v ?? '').trim();
      if (s === '') return null;
      const num = Number(s);
      return Number.isNaN(num) ? null : num;
    });

    const isAllNumeric = parsedNums.length > 0 && parsedNums.every((n): n is number => n !== null);

    let sum: number | null = null;
    let minVal: number | null = null;
    let maxVal: number | null = null;
    let avg: number | null = null;

    if (isAllNumeric) {
      const nums = parsedNums as number[];
      sum = nums.reduce((acc, n) => acc + n, 0);
      minVal = Math.min(...nums);
      maxVal = Math.max(...nums);
      const rawAvg = sum / len;
      avg = Number.isInteger(rawAvg) ? rawAvg : Math.round(rawAvg * 10) / 10;
    }

    // String / character preview
    const isSingleCharStrings = slice.length > 0 && slice.every((v) => String(v ?? '').length <= 1);
    const formedString = slice.join('');

    // Distinct & duplicate check
    const uniqueSet = new Set(slice.map((v) => String(v ?? '').trim()));
    const distinctCount = uniqueSet.size;
    const hasDuplicates = distinctCount < len;

    return {
      min,
      max,
      len,
      leftPointers,
      rightPointers,
      isAllNumeric,
      sum,
      minVal,
      maxVal,
      avg,
      isSingleCharStrings,
      formedString,
      distinctCount,
      hasDuplicates,
    };
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
      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        const ptr = block.pointers?.find((pt) => pt.id === selectedPointerId);
        if (ptr) {
          editingPointerId = ptr.id;
          editPointerName = ptr.name;
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        selectedPointerId = null;
        pointerMenuOpen = false;
        activeContextMenuPointerId = null;
        cellContextMenu = null;
        showCustomNameInput = false;
        return;
      }
    }

    if ((activeContextMenuPointerId || cellContextMenu) && e.key === 'Escape') {
      activeContextMenuPointerId = null;
      cellContextMenu = null;
      showCustomNameInput = false;
      return;
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

  function startRenamePointer(p: ArrayPointer, e?: MouseEvent) {
    e?.stopPropagation();
    editingPointerId = p.id;
    editPointerName = p.name;
  }

  function handlePointerContextMenu(p: ArrayPointer, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    selectedPointerId = p.id;
    activeContextMenuPointerId = p.id;

    if (root) {
      const rect = root.getBoundingClientRect();
      const x = e.clientX ? e.clientX - rect.left : 20;
      const y = e.clientY ? e.clientY - rect.top : 20;
      const maxX = Math.max(0, rect.width - 180);
      contextMenuPos = {
        x: Math.max(4, Math.min(maxX, x)),
        y: Math.max(4, y),
      };
    } else {
      contextMenuPos = { x: 20, y: 20 };
    }
  }

  function handleContextMenuRename(p: ArrayPointer, e: MouseEvent) {
    e.stopPropagation();
    activeContextMenuPointerId = null;
    startRenamePointer(p, e);
  }

  function handleContextMenuColor(p: ArrayPointer, color: NonNullable<ArrayPointer['color']>, e: MouseEvent) {
    e.stopPropagation();
    pushUndoPoint();
    p.color = color;
    activeContextMenuPointerId = null;
  }

  function handleContextMenuDelete(p: ArrayPointer, e: MouseEvent) {
    e.stopPropagation();
    activeContextMenuPointerId = null;
    handleDeletePointer(p, e);
  }

  let copyFeedback = $state(false);

  function handleShiftWindow(dir: -1 | 1, e: MouseEvent) {
    e.stopPropagation();
    if (!windowRange || !pointers || pointers.length < 2) return;
    if (dir === -1 && windowRange.min <= 0) return;
    if (dir === 1 && windowRange.max >= block.values.length - 1) return;
    pushUndoPoint();
    for (const p of pointers) {
      moveArrayPointer(block.id, p.id, dir);
    }
  }

  function handleCellContextMenu(index: number, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    activeContextMenuPointerId = null;
    pointerMenuOpen = false;
    showCustomNameInput = false;
    customPointerNameInput = '';

    if (root) {
      const rect = root.getBoundingClientRect();
      const x = e.clientX ? e.clientX - rect.left : 20;
      const y = e.clientY ? e.clientY - rect.top : 20;
      const maxX = Math.max(0, rect.width - 215);
      cellContextMenu = {
        index,
        x: Math.max(4, Math.min(maxX, x)),
        y: Math.max(4, y),
      };
    } else {
      cellContextMenu = { index, x: 20, y: 20 };
    }
  }

  function handleAddPointerAtIndex(index: number, name?: string, color?: ArrayPointer['color']) {
    const defaultNames = ['i', 'j', 'mid', 'L', 'R', 'k', 'cur', 'slow', 'fast'];
    const usedNames = new Set((block.pointers ?? []).map((p) => p.name));
    const pointerName = name || defaultNames.find((n) => !usedNames.has(n)) || `p${(block.pointers?.length ?? 0) + 1}`;
    addArrayPointer(block.id, pointerName, index, color);
    const newPtr = block.pointers?.[block.pointers.length - 1];
    if (newPtr) selectedPointerId = newPtr.id;
    cellContextMenu = null;
    showCustomNameInput = false;
  }

  function handleMoveSelectedPointerTo(index: number) {
    if (!selectedPointerId) return;
    moveArrayPointer(block.id, selectedPointerId, index, true);
    cellContextMenu = null;
  }

  function handleCopyWindowSlice(e: MouseEvent) {
    e.stopPropagation();
    if (!windowRange) return;
    const slice = block.values.slice(windowRange.min, windowRange.max + 1);
    navigator.clipboard?.writeText(JSON.stringify(slice));
    copyFeedback = true;
    setTimeout(() => {
      copyFeedback = false;
    }, 1400);
  }

  function selectOnMount(el: HTMLInputElement) {
    el.focus();
    el.select();
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
    if (block.values.length >= 32) return;
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
  class:menu-open={pointerMenuOpen || activeContextMenuPointerId !== null || cellContextMenu !== null}
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
  <div
    class="pointer-header-strip"
    class:menu-open={pointerMenuOpen}
    class:is-visible={isHovered || selected || pointers.length > 0 || pointerMenuOpen}
  >
    <div class="pointer-menu-wrap" class:menu-open={pointerMenuOpen} bind:this={pointerMenuEl}>
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
                title={`Pointer ${p.name} at index ${p.index}. Right-click for options (rename, color, delete).`}
                onclick={(e) => handleSelectPointer(p, e)}
                oncontextmenu={(e) => handlePointerContextMenu(p, e)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectPointer(p, e as unknown as MouseEvent);
                  }
                }}
              >
                <!-- Step Left -->
                <button
                  type="button"
                  class="ptr-step-btn ptr-step-left"
                  title="Step pointer left (Key: [ or ←)"
                  aria-label="Step pointer left"
                  onclick={(e) => handleStepPointer(p, -1, e)}
                  disabled={p.index <= 0}
                >
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13L5 8l5-5" />
                  </svg>
                </button>

                <!-- Name Label / Inline Editor -->
                {#if editingPointerId === p.id}
                  <input
                    use:selectOnMount
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
                  />
                {:else}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <span
                    class="ptr-label"
                    title="Double-click or right-click to rename"
                    ondblclick={(e) => startRenamePointer(p, e)}
                  >
                    {p.name}
                  </span>
                {/if}

                <!-- Step Right -->
                <button
                  type="button"
                  class="ptr-step-btn ptr-step-right"
                  title="Step pointer right (Key: ] or →)"
                  aria-label="Step pointer right"
                  onclick={(e) => handleStepPointer(p, 1, e)}
                  disabled={p.index >= block.values.length - 1}
                >
                  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
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
            title={selectedPointerId ? `Click to snap selected pointer to index [${i}]` : `Index ${i}. Right-click to add pointer.`}
            onclick={() => handleIndexClick(i)}
            oncontextmenu={(e) => handleCellContextMenu(i, e)}
          >
            {i}
          </div>

          <!-- Array Cell -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="cell"
            class:cell-window={inWindow}
            oncontextmenu={(e) => handleCellContextMenu(i, e)}
          >
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
              oncontextmenu={(e) => handleCellContextMenu(i, e)}
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
            disabled={block.values.length >= 32}
            title={block.values.length >= 32 ? "Maximum 32 cells reached" : "Add cell to array"}
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

    <!-- Sliding Window Chip Bar (Option A) -->
    {#if windowRange && windowStats}
      <div class="window-bar" role="region" aria-label="Sliding window information">
        <!-- Quick Window Shifter (Slide Entire Window) -->
        <div class="window-nav-group" title="Slide window (moves all pointers in lockstep)">
          <button
            type="button"
            class="window-nav-btn"
            title="Slide window left"
            aria-label="Slide window left"
            disabled={windowStats.min <= 0}
            onclick={(e) => handleShiftWindow(-1, e)}
          >
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13L5 8l5-5" />
            </svg>
          </button>
          <span class="window-nav-divider"></span>
          <button
            type="button"
            class="window-nav-btn"
            title="Slide window right"
            aria-label="Slide window right"
            disabled={windowStats.max >= block.values.length - 1}
            onclick={(e) => handleShiftWindow(1, e)}
          >
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>
        </div>

        <!-- Window Range & Bound Pointers Chip -->
        <div class="window-chip window-chip-range">
          <span class="chip-label">Window</span>
          <span class="chip-val">
            {#if windowStats.leftPointers.length > 0}
              <span class="chip-ptrs">
                {#each windowStats.leftPointers as lp (lp.id)}
                  <span class="chip-ptr-tag ptr-tag-{lp.color ?? 'cyan'}">{lp.name}</span>
                {/each}
              </span>
            {/if}
            <span class="range-bounds">[{windowStats.min}..{windowStats.max}]</span>
            {#if windowStats.rightPointers.length > 0 && windowStats.min !== windowStats.max}
              <span class="chip-ptrs">
                {#each windowStats.rightPointers as rp (rp.id)}
                  <span class="chip-ptr-tag ptr-tag-{rp.color ?? 'rose'}">{rp.name}</span>
                {/each}
              </span>
            {/if}
          </span>
        </div>

        <!-- Length Chip -->
        <div class="window-chip window-chip-len" title="Window length (element count)">
          <span class="chip-label">len</span>
          <span class="chip-val chip-num">{windowStats.len}</span>
        </div>

        <!-- Numeric Statistics (if array values are numbers) -->
        {#if windowStats.isAllNumeric && windowStats.sum !== null}
          <div class="window-chip window-chip-sum" title="Sum of elements inside window">
            <span class="chip-label">∑ sum</span>
            <span class="chip-val chip-accent">{windowStats.sum}</span>
          </div>

          {#if windowStats.len > 1}
            <div class="window-chip window-chip-avg" title="Average of elements inside window">
              <span class="chip-label">μ avg</span>
              <span class="chip-val">{windowStats.avg}</span>
            </div>

            <div class="window-chip window-chip-minmax" title="Minimum and Maximum values in window">
              <span class="chip-label">min / max</span>
              <span class="chip-val">{windowStats.minVal} / {windowStats.maxVal}</span>
            </div>
          {/if}
        {:else if windowStats.isSingleCharStrings && windowStats.formedString}
          <!-- Formed String preview (if characters) -->
          <div class="window-chip window-chip-str" title="Formed substring">
            <span class="chip-label">str</span>
            <span class="chip-val chip-quote">"{windowStats.formedString}"</span>
          </div>
        {/if}

        <!-- Distinct / Uniqueness Chip -->
        <div
          class="window-chip window-chip-distinct"
          title={windowStats.hasDuplicates ? `Window has duplicate elements (${windowStats.distinctCount} distinct)` : `All ${windowStats.len} elements in window are distinct`}
        >
          <span class="chip-label">distinct</span>
          <span class="chip-val" class:chip-good={!windowStats.hasDuplicates} class:chip-warn={windowStats.hasDuplicates}>
            {windowStats.distinctCount}
            {#if !windowStats.hasDuplicates}
              <span class="unique-badge">✓ unique</span>
            {:else}
              <span class="dup-badge">dups</span>
            {/if}
          </span>
        </div>

        <!-- Copy Window Elements Slice -->
        <button
          type="button"
          class="window-copy-btn"
          class:copied={copyFeedback}
          title="Copy window subarray elements to clipboard as JSON"
          aria-label="Copy window elements"
          onclick={handleCopyWindowSlice}
        >
          {#if copyFeedback}
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 8.5 6.5 12 13 4" />
            </svg>
            <span>Copied!</span>
          {:else}
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="5" width="8" height="8" rx="1.5" />
              <path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" />
            </svg>
            <span>Slice</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <!-- Pointer Context Menu (Right Click) -->
  {#if activeContextMenuPointer && contextMenuPos}
    <div
      class="ptr-context-menu"
      bind:this={activeContextMenuEl}
      style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="menu"
      tabindex="-1"
    >
      <div class="ctx-header">
        <span class="ctx-title">Pointer: {activeContextMenuPointer.name}</span>
      </div>

      <!-- Rename Option -->
      <button
        type="button"
        class="ctx-item-btn"
        onclick={(e) => handleContextMenuRename(activeContextMenuPointer, e)}
      >
        <svg class="ctx-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L4.5 13.5l-3 1 1-3 9-9z"/>
        </svg>
        <span class="ctx-item-label">Rename</span>
        <span class="ctx-shortcut">F2</span>
      </button>

      <!-- Color Swatches Row -->
      <div class="ctx-colors-row">
        <span class="ctx-colors-label">Color</span>
        <div class="ctx-swatches">
          {#each pointerColors as col}
            <button
              type="button"
              class="ctx-color-dot dot-{col}"
              class:is-active={activeContextMenuPointer.color === col}
              title={col}
              aria-label={col}
              onclick={(e) => handleContextMenuColor(activeContextMenuPointer, col, e)}
            >
              {#if activeContextMenuPointer.color === col}
                <svg viewBox="0 0 16 16" width="8" height="8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 8 7 12 13 4"/>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="ctx-divider"></div>

      <!-- Delete Option -->
      <button
        type="button"
        class="ctx-item-btn is-danger"
        onclick={(e) => handleContextMenuDelete(activeContextMenuPointer, e)}
      >
        <svg class="ctx-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 4h12M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4M12.5 4v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5V4"/>
        </svg>
        <span class="ctx-item-label">Delete Pointer</span>
        <span class="ctx-shortcut">Del</span>
      </button>
    </div>
  {/if}

  <!-- Cell Context Menu (Right Click on Cell or Index) -->
  {#if cellContextMenu}
    {@const cellIdx = cellContextMenu.index}
    {@const cellVal = block.values[cellIdx]}
    {@const selectedPtr = pointers.find((p) => p.id === selectedPointerId)}
    {@const cellPtrs = pointersAtIndex(cellIdx)}

    <div
      class="cell-context-menu"
      bind:this={cellContextMenuEl}
      style="left: {cellContextMenu.x}px; top: {cellContextMenu.y}px;"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => {
        if (e.key === 'Escape') {
          cellContextMenu = null;
          showCustomNameInput = false;
        }
      }}
      role="menu"
      tabindex="-1"
    >
      <div class="ctx-cell-header">
        <span class="ctx-title">Cell [{cellIdx}]</span>
        <span class="ctx-cell-val" title="Current value">{cellVal !== '' ? `"${cellVal}"` : '(empty)'}</span>
      </div>

      <!-- Primary Action: Quick Add Next Pointer -->
      <button
        type="button"
        class="ctx-primary-btn"
        onclick={() => handleAddPointerAtIndex(cellIdx)}
        title="Add next pointer at this index"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
        <span>Add Pointer at [{cellIdx}]</span>
      </button>

      <!-- Quick Preset Chips: i, j, mid, L, R -->
      <div class="ctx-preset-section">
        <span class="ctx-preset-label">Quick Name:</span>
        <div class="ctx-chips-row">
          {#each ['i', 'j', 'mid', 'L', 'R'] as name}
            {@const isUsed = pointers.some((p) => p.name.toLowerCase() === name.toLowerCase())}
            <button
              type="button"
              class="ctx-preset-chip"
              class:chip-used={isUsed}
              title={isUsed ? `Pointer "${name}" already exists` : `Add pointer "${name}" at index ${cellIdx}`}
              onclick={() => handleAddPointerAtIndex(cellIdx, name)}
            >
              +{name}
            </button>
          {/each}
          <button
            type="button"
            class="ctx-preset-chip ctx-chip-more"
            title="Custom pointer name"
            onclick={() => {
              showCustomNameInput = !showCustomNameInput;
            }}
          >
            {showCustomNameInput ? '▲' : '...'}
          </button>
        </div>

        {#if showCustomNameInput}
          <div class="ctx-custom-row">
            <input
              type="text"
              class="ctx-custom-input"
              placeholder="Name..."
              maxlength="8"
              bind:value={customPointerNameInput}
              onkeydown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && customPointerNameInput.trim()) {
                  handleAddPointerAtIndex(cellIdx, customPointerNameInput.trim());
                }
                if (e.key === 'Escape') showCustomNameInput = false;
              }}
              use:selectOnMount
            />
            <button
              type="button"
              class="ctx-custom-add-btn"
              disabled={!customPointerNameInput.trim()}
              onclick={() => {
                if (customPointerNameInput.trim()) {
                  handleAddPointerAtIndex(cellIdx, customPointerNameInput.trim());
                }
              }}
            >
              Add
            </button>
          </div>
        {/if}
      </div>

      <!-- Move Selected Pointer Here (if active and not already at this cell) -->
      {#if selectedPtr && selectedPtr.index !== cellIdx}
        <div class="ctx-divider"></div>
        <button
          type="button"
          class="ctx-item-btn"
          onclick={() => handleMoveSelectedPointerTo(cellIdx)}
          title={`Move pointer "${selectedPtr.name}" from index ${selectedPtr.index} to ${cellIdx}`}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="11 5 14 8 11 11" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          <span class="ctx-item-label">Move <strong>{selectedPtr.name}</strong> here</span>
        </button>
      {/if}

      <!-- Current Pointers at this index (if any) -->
      {#if cellPtrs.length > 0}
        <div class="ctx-divider"></div>
        <div class="ctx-ptrs-here">
          <span class="ctx-ptrs-here-label">Pointers here:</span>
          <div class="ctx-ptrs-list">
            {#each cellPtrs as cp (cp.id)}
              <span class="chip-ptr-tag ptr-tag-{cp.color ?? 'cyan'}">{cp.name}</span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
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
    max-width: none;
    position: relative;
    z-index: 2;
  }

  .wrap.menu-open,
  .wrap:focus-within {
    z-index: 80;
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
    position: relative;
    z-index: 30;
  }

  .pointer-header-strip.is-visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .pointer-header-strip.menu-open {
    z-index: 100;
  }

  .pointer-menu-wrap {
    position: relative;
    display: inline-flex;
    z-index: 40;
  }

  .pointer-menu-wrap.menu-open {
    z-index: 120;
  }

  .capsule-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 8px;
    border-radius: var(--radius-sm);
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

  .capsule-btn:active {
    transform: translateY(0) scale(0.97);
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
    height: 24px;
    padding: 0 8px;
    border-radius: var(--radius-sm);
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

  .clear-capsule-btn:active {
    transform: translateY(0) scale(0.97);
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
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(0, 0, 0, 0.15);
    z-index: 500;
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
    max-width: none;
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
    gap: 4px;
    align-items: center;
    width: min-content;
    opacity: 0.35;
    transition: opacity 0.15s ease;
  }

  .add-cell-col.is-visible,
  .add-cell-col:hover {
    opacity: 1;
  }

  .pointer-track-spacer {
    min-height: 30px;
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
    min-height: 30px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-bottom: 2px;
  }

  .ptr-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 1px;
    height: 24px;
    padding: 1px 2px;
    border-radius: 6px;
    font: 700 11px var(--mono);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease;
    animation: ptrPopIn 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 20;
    user-select: none;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
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
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .ptr-badge.is-active-pointer {
    transform: translateY(-2px);
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px currentColor, 0 6px 14px rgba(0, 0, 0, 0.2);
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
  :global(.dark) .ptr-cyan, :global([data-theme="dark"]) .ptr-cyan { color: #22d3ee; border-color: rgba(34, 211, 238, 0.6); }
  :global(.dark) .ptr-rose, :global([data-theme="dark"]) .ptr-rose { color: #fb7185; border-color: rgba(251, 113, 133, 0.6); }
  :global(.dark) .ptr-purple, :global([data-theme="dark"]) .ptr-purple { color: #c084fc; border-color: rgba(192, 132, 252, 0.6); }
  :global(.dark) .ptr-emerald, :global([data-theme="dark"]) .ptr-emerald { color: #34d399; border-color: rgba(52, 211, 153, 0.6); }
  :global(.dark) .ptr-amber, :global([data-theme="dark"]) .ptr-amber { color: #fbbf24; border-color: rgba(251, 191, 36, 0.6); }

  .ptr-step-btn {
    border: none;
    background: color-mix(in srgb, currentColor 8%, transparent);
    color: inherit;
    width: 20px;
    height: 20px;
    min-width: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    border-radius: 4px;
    opacity: 0.85;
    transition: background 0.15s ease, transform 0.12s ease, opacity 0.15s ease, box-shadow 0.12s ease;
  }

  .ptr-step-btn svg {
    display: block;
    pointer-events: none;
    flex-shrink: 0;
  }

  .ptr-step-btn:hover:not(:disabled) {
    opacity: 1;
    background: color-mix(in srgb, currentColor 22%, transparent);
  }

  .ptr-step-left:hover:not(:disabled) {
    transform: translateX(-1px);
  }

  .ptr-step-right:hover:not(:disabled) {
    transform: translateX(1px);
  }

  .ptr-step-btn:active:not(:disabled) {
    transform: scale(0.88);
    background: color-mix(in srgb, currentColor 32%, transparent);
  }

  .ptr-step-btn:disabled {
    opacity: 0.18;
    cursor: not-allowed;
    background: transparent;
  }

  /* Pointer Right-Click Context Menu */
  .ptr-context-menu {
    position: absolute;
    width: 175px;
    background: color-mix(in srgb, var(--surface) 97%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(0, 0, 0, 0.15);
    z-index: 600;
    padding: 6px;
    animation: ptrCtxPop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes ptrCtxPop {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .ctx-header {
    padding: 4px 6px 6px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }

  .ctx-title {
    font: 700 10.5px var(--sans);
    color: var(--muted);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .ctx-item-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 5px 8px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--text-h);
    font: 600 12px var(--sans);
    cursor: pointer;
    text-align: left;
    transition: all 0.1s ease;
  }

  .ctx-item-btn:hover {
    background: var(--surface-2);
    color: var(--text-h);
  }

  .ctx-item-btn.is-danger {
    color: #ef4444;
  }

  .ctx-item-btn.is-danger:hover {
    background: color-mix(in srgb, #ef4444 14%, var(--surface-2));
    color: #ef4444;
  }

  .ctx-icon {
    flex-shrink: 0;
    opacity: 0.85;
  }

  .ctx-item-label {
    flex: 1;
  }

  .ctx-shortcut {
    font: 600 10px var(--mono);
    color: var(--muted);
    padding: 1px 4px;
    background: color-mix(in srgb, var(--surface-3) 70%, transparent);
    border-radius: 3px;
    border: 1px solid var(--border);
  }

  .ctx-colors-row {
    padding: 6px 8px 4px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .ctx-colors-label {
    font: 600 10.5px var(--sans);
    color: var(--muted);
    letter-spacing: 0.02em;
  }

  .ctx-swatches {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ctx-color-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: all 0.12s ease;
  }

  .ctx-color-dot:hover {
    transform: scale(1.18);
  }

  .ctx-color-dot.is-active {
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 3.5px currentColor;
    transform: scale(1.1);
  }

  .ctx-divider {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
  }

  /* ── Cell Right-Click Context Menu ───────────────────────────────────────── */
  .cell-context-menu {
    position: absolute;
    width: 205px;
    background: color-mix(in srgb, var(--surface) 97%, transparent);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25), 0 4px 14px rgba(0, 0, 0, 0.15);
    z-index: 600;
    padding: 6px;
    animation: ptrCtxPop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
  }

  .ctx-cell-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 6px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 5px;
  }

  .ctx-cell-val {
    font: 700 11px var(--mono);
    color: var(--accent-primary);
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ctx-primary-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 6px 8px;
    border-radius: var(--radius-sm);
    border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent);
    background: color-mix(in srgb, var(--accent-primary) 12%, var(--surface-2));
    color: var(--accent-primary);
    font: 700 11px var(--sans);
    cursor: pointer;
    transition: all 0.12s ease;
    margin-bottom: 6px;
  }

  .ctx-primary-btn:hover {
    background: color-mix(in srgb, var(--accent-primary) 22%, var(--surface-2));
    border-color: var(--accent-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .ctx-primary-btn:active {
    transform: scale(0.98);
  }

  .ctx-preset-section {
    padding: 2px 4px 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ctx-preset-label {
    font: 600 10px var(--sans);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ctx-chips-row {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .ctx-preset-chip {
    padding: 2px 6px;
    font: 700 10.5px var(--mono);
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-h);
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .ctx-preset-chip:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    background: color-mix(in srgb, var(--accent-primary) 12%, var(--surface-2));
    transform: translateY(-1px);
  }

  .ctx-preset-chip.chip-used {
    opacity: 0.6;
    border-style: dashed;
  }

  .ctx-chip-more {
    color: var(--muted);
  }

  .ctx-custom-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  }

  .ctx-custom-input {
    flex: 1;
    min-width: 0;
    height: 24px;
    padding: 0 6px;
    border-radius: 4px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--text-h);
    font: 700 11px var(--mono);
    outline: none;
    box-sizing: border-box;
  }

  .ctx-custom-input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px var(--accent-primary);
  }

  .ctx-custom-add-btn {
    height: 24px;
    padding: 0 9px;
    border-radius: 4px;
    border: none;
    background: var(--accent-primary);
    color: #fff;
    font: 700 10.5px var(--sans);
    cursor: pointer;
    transition: opacity 0.12s ease;
  }

  .ctx-custom-add-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .ctx-ptrs-here {
    padding: 4px 6px 2px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ctx-ptrs-here-label {
    font: 600 10px var(--sans);
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ctx-ptrs-list {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .ptr-label {
    padding: 0 4px;
    min-width: 14px;
    text-align: center;
    cursor: pointer;
    letter-spacing: 0.02em;
    border-radius: 3px;
    font-size: 11.5px;
    line-height: 20px;
    transition: background 0.12s ease;
  }

  .ptr-label:hover {
    background: color-mix(in srgb, currentColor 14%, transparent);
  }

  .ptr-edit-input {
    width: 30px;
    height: 18px;
    border: 1px solid currentColor;
    background: color-mix(in srgb, var(--surface) 90%, transparent);
    color: inherit;
    font: inherit;
    padding: 0 2px;
    border-radius: 3px;
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 25%, transparent);
    text-align: center;
  }

  .ptr-arrow {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid currentColor;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
    pointer-events: none;
  }

  /* Index and Cell Styles */
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

  /* ── Sliding Window Bar (Option A) ─────────────────────────────────────── */
  .window-bar {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 3px 5px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    user-select: none;
    max-width: 100%;
    animation: windowBarFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes windowBarFadeIn {
    from {
      opacity: 0;
      transform: translateY(3px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Slide Window Controls */
  .window-nav-group {
    display: inline-flex;
    align-items: center;
    background: color-mix(in srgb, var(--surface-2) 80%, transparent);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 1px;
    gap: 1px;
  }

  .window-nav-btn {
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--muted);
    border-radius: 3px;
    cursor: pointer;
    padding: 0;
    transition: all 0.12s ease;
  }

  .window-nav-btn:hover:not(:disabled) {
    color: var(--accent-primary);
    background: color-mix(in srgb, var(--accent-primary) 14%, var(--surface));
  }

  .window-nav-btn:active:not(:disabled) {
    transform: scale(0.9);
  }

  .window-nav-btn:disabled {
    opacity: 0.22;
    cursor: not-allowed;
  }

  .window-nav-divider {
    width: 1px;
    height: 12px;
    background: var(--border);
  }

  /* Window Chips */
  .window-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    background: color-mix(in srgb, var(--surface-2) 65%, transparent);
    border: 1px solid var(--border);
    border-radius: 5px;
    font: 600 11px/1.3 var(--mono);
    color: var(--text-h);
    transition: border-color 0.15s ease, background 0.15s ease;
  }

  .window-chip:hover {
    border-color: var(--border-strong);
    background: color-mix(in srgb, var(--surface-2) 90%, transparent);
  }

  .chip-label {
    color: var(--muted);
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .chip-val {
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .chip-num {
    color: var(--text-h);
  }

  .chip-accent {
    color: var(--accent-primary);
    font-weight: 800;
  }

  .chip-quote {
    color: #06b6d4;
    font-weight: 700;
  }

  :global(.dark) .chip-quote, :global([data-theme="dark"]) .chip-quote {
    color: #22d3ee;
  }

  .chip-good {
    color: #10b981;
  }

  .chip-warn {
    color: #f59e0b;
  }

  .unique-badge,
  .dup-badge {
    font-size: 9px;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .unique-badge {
    background: color-mix(in srgb, #10b981 18%, transparent);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.35);
  }

  :global(.dark) .unique-badge, :global([data-theme="dark"]) .unique-badge {
    color: #34d399;
  }

  .dup-badge {
    background: color-mix(in srgb, #f59e0b 18%, transparent);
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.35);
  }

  :global(.dark) .dup-badge, :global([data-theme="dark"]) .dup-badge {
    color: #fbbf24;
  }

  .chip-ptrs {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .range-bounds {
    color: var(--accent-primary);
  }

  .chip-ptr-tag {
    font-size: 9.5px;
    font-weight: 800;
    padding: 0 4px;
    border-radius: 3px;
    line-height: 14px;
    display: inline-block;
  }

  .ptr-tag-cyan {
    background: color-mix(in srgb, #06b6d4 20%, var(--surface));
    color: #0891b2;
    border: 1px solid rgba(6, 182, 212, 0.4);
  }
  .ptr-tag-rose {
    background: color-mix(in srgb, #f43f5e 20%, var(--surface));
    color: #e11d48;
    border: 1px solid rgba(244, 63, 94, 0.4);
  }
  .ptr-tag-purple {
    background: color-mix(in srgb, #a855f7 20%, var(--surface));
    color: #9333ea;
    border: 1px solid rgba(168, 85, 247, 0.4);
  }
  .ptr-tag-emerald {
    background: color-mix(in srgb, #10b981 20%, var(--surface));
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }
  .ptr-tag-amber {
    background: color-mix(in srgb, #f59e0b 20%, var(--surface));
    color: #d97706;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  :global(.dark) .ptr-tag-cyan, :global([data-theme="dark"]) .ptr-tag-cyan { color: #22d3ee; }
  :global(.dark) .ptr-tag-rose, :global([data-theme="dark"]) .ptr-tag-rose { color: #fb7185; }
  :global(.dark) .ptr-tag-purple, :global([data-theme="dark"]) .ptr-tag-purple { color: #c084fc; }
  :global(.dark) .ptr-tag-emerald, :global([data-theme="dark"]) .ptr-tag-emerald { color: #34d399; }
  :global(.dark) .ptr-tag-amber, :global([data-theme="dark"]) .ptr-tag-amber { color: #fbbf24; }

  /* Copy Subarray Button */
  .window-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    height: 22px;
    font: 600 10.5px var(--sans);
    border-radius: 5px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--muted);
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .window-copy-btn:hover {
    color: var(--text-h);
    border-color: var(--border-strong);
    background: color-mix(in srgb, var(--accent-primary) 10%, var(--surface-2));
  }

  .window-copy-btn.copied {
    color: #10b981;
    border-color: #10b981;
    background: color-mix(in srgb, #10b981 12%, var(--surface));
  }
</style>
