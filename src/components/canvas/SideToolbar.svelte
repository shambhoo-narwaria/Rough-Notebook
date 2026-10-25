<script lang="ts">
  type CanvasTool = 'pen' | 'eraser' | 'text' | 'shapes' | 'arrow' | 'square' | 'line' | null;

  type Props = {
    penActive: boolean;
    activeCanvasTool: CanvasTool;
    onTogglePen: () => void;
    onSelectTool: (tool: CanvasTool) => void;
    onInsertArray: () => void;
    onInsertMatrix: () => void;
    onInsertSpine: () => void;
    onOpenAutoCreate?: () => void;
    onUndo: () => void;
    onRedo?: () => void;
  };

  let {
    penActive,
    activeCanvasTool,
    onTogglePen,
    onSelectTool,
    onInsertArray,
    onInsertMatrix,
    onInsertSpine,
    onOpenAutoCreate,
    onUndo,
    onRedo,
  }: Props = $props();

  let dsaFlyoutOpen = $state(false);
  let shapesFlyoutOpen = $state(false);
  let activeFeedback = $state<string | null>(null);
  let dockEl: HTMLDivElement | null = $state(null);

  const isShapeActive = $derived(
    activeCanvasTool === 'shapes' ||
    activeCanvasTool === 'arrow' ||
    activeCanvasTool === 'square' ||
    activeCanvasTool === 'line'
  );

  function triggerFeedback(id: string, action: () => void) {
    activeFeedback = id;
    setTimeout(() => {
      if (activeFeedback === id) activeFeedback = null;
    }, 180);
    action();
  }

  function handlePenClick() {
    triggerFeedback('pen', () => {
      shapesFlyoutOpen = false;
      dsaFlyoutOpen = false;
      onTogglePen();
    });
  }

  function handleEraserClick() {
    triggerFeedback('eraser', () => {
      shapesFlyoutOpen = false;
      dsaFlyoutOpen = false;
      onSelectTool(activeCanvasTool === 'eraser' ? null : 'eraser');
    });
  }

  function handleTextClick() {
    triggerFeedback('text', () => {
      shapesFlyoutOpen = false;
      dsaFlyoutOpen = false;
      onSelectTool(activeCanvasTool === 'text' ? null : 'text');
    });
  }

  function handleShapesClick() {
    triggerFeedback('shapes', () => {
      dsaFlyoutOpen = false;
      if (isShapeActive && !shapesFlyoutOpen) {
        onSelectTool(null);
      } else {
        shapesFlyoutOpen = !shapesFlyoutOpen;
      }
    });
  }

  function handleDsaClick() {
    triggerFeedback('dsa', () => {
      shapesFlyoutOpen = false;
      dsaFlyoutOpen = !dsaFlyoutOpen;
    });
  }

  function handleUndoClick() {
    triggerFeedback('undo', () => {
      shapesFlyoutOpen = false;
      dsaFlyoutOpen = false;
      onUndo();
    });
  }

  function handleRedoClick() {
    triggerFeedback('redo', () => {
      shapesFlyoutOpen = false;
      dsaFlyoutOpen = false;
      onRedo?.();
    });
  }

  let shapesTimer: ReturnType<typeof setTimeout> | null = null;
  let dsaTimer: ReturnType<typeof setTimeout> | null = null;

  function handleShapesMouseEnter() {
    if (shapesTimer) clearTimeout(shapesTimer);
    if (dsaTimer) clearTimeout(dsaTimer);
    dsaFlyoutOpen = false;
    shapesFlyoutOpen = true;
  }

  function handleShapesMouseLeave() {
    if (shapesTimer) clearTimeout(shapesTimer);
    shapesTimer = setTimeout(() => {
      shapesFlyoutOpen = false;
    }, 220);
  }

  function handleDsaMouseEnter() {
    if (dsaTimer) clearTimeout(dsaTimer);
    if (shapesTimer) clearTimeout(shapesTimer);
    shapesFlyoutOpen = false;
    dsaFlyoutOpen = true;
  }

  function handleDsaMouseLeave() {
    if (dsaTimer) clearTimeout(dsaTimer);
    dsaTimer = setTimeout(() => {
      dsaFlyoutOpen = false;
    }, 220);
  }

  function handleOtherMouseEnter() {
    if (shapesTimer) clearTimeout(shapesTimer);
    if (dsaTimer) clearTimeout(dsaTimer);
    shapesFlyoutOpen = false;
    dsaFlyoutOpen = false;
  }

  function handleToolbarMouseLeave() {
    if (shapesTimer) clearTimeout(shapesTimer);
    if (dsaTimer) clearTimeout(dsaTimer);
    shapesTimer = setTimeout(() => {
      shapesFlyoutOpen = false;
    }, 220);
    dsaTimer = setTimeout(() => {
      dsaFlyoutOpen = false;
    }, 220);
  }

  function onDragStart(e: DragEvent, toolId: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('application/rough-tool', toolId);
    e.dataTransfer.effectAllowed = 'copy';
    dsaFlyoutOpen = false;
    shapesFlyoutOpen = false;
  }

  // Close flyouts on outside click or Escape
  $effect(() => {
    if (!dsaFlyoutOpen && !shapesFlyoutOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (dockEl && !dockEl.contains(e.target as Node)) {
        dsaFlyoutOpen = false;
        shapesFlyoutOpen = false;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dsaFlyoutOpen = false;
        shapesFlyoutOpen = false;
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey);
      if (shapesTimer) clearTimeout(shapesTimer);
      if (dsaTimer) clearTimeout(dsaTimer);
    };
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="side-toolbar"
  bind:this={dockEl}
  aria-label="Tool Palette"
  role="toolbar"
  tabindex="-1"
  aria-orientation="vertical"
  onmouseleave={handleToolbarMouseLeave}
>
  <!-- 1. Pen Tool -->
  <div class="dock-item" class:is-active={penActive || activeCanvasTool === 'pen'}>
    <button
      type="button"
      class="dock-btn pen-btn"
      class:is-active={penActive || activeCanvasTool === 'pen'}
      class:flash-active={activeFeedback === 'pen'}
      onmouseenter={handleOtherMouseEnter}
      onclick={handlePenClick}
      title="Pen Draw (P)"
      aria-label="Pen Draw"
      aria-pressed={penActive || activeCanvasTool === 'pen'}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        <line x1="14" y1="6" x2="18" y2="10" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Pen</span>
        <span class="tooltip-kbd">P</span>
      </span>
    </button>
  </div>

  <!-- 2. Eraser Tool -->
  <div class="dock-item" class:is-active={activeCanvasTool === 'eraser'}>
    <button
      type="button"
      class="dock-btn eraser-btn"
      class:is-active={activeCanvasTool === 'eraser'}
      class:flash-active={activeFeedback === 'eraser'}
      onmouseenter={handleOtherMouseEnter}
      onclick={handleEraserClick}
      title="Eraser (E)"
      aria-label="Eraser"
      aria-pressed={activeCanvasTool === 'eraser'}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 11l-6-6-8.5 8.5a2.121 2.121 0 0 0 0 3l3.5 3.5a2.121 2.121 0 0 0 3 0L19 11z" />
        <line x1="6" y1="18" x2="21" y2="18" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Eraser</span>
        <span class="tooltip-kbd">E</span>
      </span>
    </button>
  </div>

  <!-- 3. Text Tool -->
  <div class="dock-item" class:is-active={activeCanvasTool === 'text'}>
    <button
      type="button"
      class="dock-btn text-btn"
      class:is-active={activeCanvasTool === 'text'}
      class:flash-active={activeFeedback === 'text'}
      onmouseenter={handleOtherMouseEnter}
      onclick={handleTextClick}
      draggable="true"
      ondragstart={(e) => onDragStart(e, 'note')}
      title="Text Note (T)"
      aria-label="Text Note"
      aria-pressed={activeCanvasTool === 'text'}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Text Note</span>
        <span class="tooltip-kbd">T</span>
      </span>
    </button>
  </div>

  <!-- 4. Shapes Tool -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="dock-item"
    class:is-active={isShapeActive || shapesFlyoutOpen}
    role="group"
    aria-label="Shapes tool"
    onmouseenter={handleShapesMouseEnter}
    onmouseleave={handleShapesMouseLeave}
  >
    <button
      type="button"
      class="dock-btn shapes-btn"
      class:is-active={isShapeActive || shapesFlyoutOpen}
      class:flash-active={activeFeedback === 'shapes'}
      onclick={handleShapesClick}
      title="Shapes: Arrow, Square, Line (S)"
      aria-label="Shapes"
      aria-expanded={shapesFlyoutOpen}
    >
      {#if activeCanvasTool === 'arrow'}
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="13 6 19 12 13 18" />
        </svg>
      {:else if activeCanvasTool === 'square'}
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
        </svg>
      {:else if activeCanvasTool === 'line'}
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="3.5" y1="12" x2="20.5" y2="12" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="7" cy="7" r="3.5" />
          <circle cx="17" cy="7" r="3.5" />
          <rect x="3.5" y="14" width="7" height="7" rx="1.5" />
          <polygon points="17 14 21 21 13 21" />
        </svg>
      {/if}
      <span class="tooltip">
        <span class="tooltip-title">
          {#if activeCanvasTool === 'arrow'}
            Arrow
          {:else if activeCanvasTool === 'square'}
            Square
          {:else if activeCanvasTool === 'line'}
            Line
          {:else}
            Shapes
          {/if}
        </span>
        <span class="tooltip-kbd">S</span>
      </span>
    </button>

    <!-- Shapes Flyout Drawer (Vertical rounded rectangular icon stack) -->
    {#if shapesFlyoutOpen}
      <div class="shapes-flyout" role="menu" aria-label="Shapes options">
        <button
          type="button"
          class="flyout-icon-btn"
          class:is-active={activeCanvasTool === 'square'}
          onclick={() => {
            shapesFlyoutOpen = false;
            onSelectTool(activeCanvasTool === 'square' ? null : 'square');
          }}
          title="Square (drag to draw)"
          aria-label="Square"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
          </svg>
          <span class="tooltip">
            <span class="tooltip-title">Square</span>
            <span class="tooltip-kbd">Drag box</span>
          </span>
        </button>

        <button
          type="button"
          class="flyout-icon-btn"
          class:is-active={activeCanvasTool === 'arrow'}
          onclick={() => {
            shapesFlyoutOpen = false;
            onSelectTool(activeCanvasTool === 'arrow' ? null : 'arrow');
          }}
          title="Arrow (drag to draw)"
          aria-label="Arrow"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
          </svg>
          <span class="tooltip">
            <span class="tooltip-title">Arrow</span>
            <span class="tooltip-kbd">Drag pointer</span>
          </span>
        </button>

        <button
          type="button"
          class="flyout-icon-btn"
          class:is-active={activeCanvasTool === 'line'}
          onclick={() => {
            shapesFlyoutOpen = false;
            onSelectTool(activeCanvasTool === 'line' ? null : 'line');
          }}
          title="Line (drag to draw)"
          aria-label="Line"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3.5" y1="12" x2="20.5" y2="12" />
          </svg>
          <span class="tooltip">
            <span class="tooltip-title">Line</span>
            <span class="tooltip-kbd">Drag line</span>
          </span>
        </button>
      </div>
    {/if}
  </div>

  <!-- Divider -->
  <div class="dock-divider" role="separator" aria-orientation="horizontal"></div>

  <!-- 5. DSA Hub Tool -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="dock-item"
    class:is-active={dsaFlyoutOpen}
    role="group"
    aria-label="Data structures tool"
    onmouseenter={handleDsaMouseEnter}
    onmouseleave={handleDsaMouseLeave}
  >
    <button
      type="button"
      class="dock-btn dsa-btn"
      class:is-open={dsaFlyoutOpen}
      class:flash-active={activeFeedback === 'dsa'}
      onclick={handleDsaClick}
      title="Data Structures (D)"
      aria-label="Data Structures"
      aria-expanded={dsaFlyoutOpen}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">DSA</span>
        <span class="tooltip-kbd">D</span>
      </span>
    </button>
    <span class="dock-label">DSA</span>

    <!-- DSA Flyout Drawer (Vertical rounded rectangular icon stack) -->
    {#if dsaFlyoutOpen}
      <div class="dsa-flyout" role="menu" aria-label="Data structures menu">
        <button
          type="button"
          class="flyout-icon-btn"
          onclick={() => {
            dsaFlyoutOpen = false;
            onInsertArray();
          }}
          draggable="true"
          ondragstart={(e) => onDragStart(e, 'array')}
          title="1D Array (drag or click)"
          aria-label="1D Array"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
            <line x1="8.8" y1="6" x2="8.8" y2="18" />
            <line x1="15.2" y1="6" x2="15.2" y2="18" />
          </svg>
          <span class="tooltip">
            <span class="tooltip-title">1D Array</span>
            <span class="tooltip-kbd">Cells</span>
          </span>
        </button>

        <button
          type="button"
          class="flyout-icon-btn"
          onclick={() => {
            dsaFlyoutOpen = false;
            onInsertMatrix();
          }}
          draggable="true"
          ondragstart={(e) => onDragStart(e, 'matrix')}
          title="2D Matrix (drag or click)"
          aria-label="2D Matrix"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2.5" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
          <span class="tooltip">
            <span class="tooltip-title">2D Matrix</span>
            <span class="tooltip-kbd">Grid</span>
          </span>
        </button>

        <button
          type="button"
          class="flyout-icon-btn"
          onclick={() => {
            dsaFlyoutOpen = false;
            onInsertSpine();
          }}
          draggable="true"
          ondragstart={(e) => onDragStart(e, 'spine')}
          title="Divider Spine (drag or click)"
          aria-label="Divider Spine"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="2" y1="12" x2="22" y2="12" />
            <circle cx="7" cy="12" r="2" fill="currentColor" />
            <circle cx="17" cy="12" r="2" fill="currentColor" />
          </svg>
          <span class="tooltip">
            <span class="tooltip-title">Spine</span>
            <span class="tooltip-kbd">Divider</span>
          </span>
        </button>

        {#if onOpenAutoCreate}
          <button
            type="button"
            class="flyout-icon-btn"
            onclick={() => {
              dsaFlyoutOpen = false;
              onOpenAutoCreate?.();
            }}
            title="Smart Auto Create (paste values)"
            aria-label="Smart Auto Create"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span class="tooltip">
              <span class="tooltip-title">Auto Create</span>
              <span class="tooltip-kbd">Smart</span>
            </span>
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- 6. Undo Action -->
  <div class="dock-item">
    <button
      type="button"
      class="dock-btn undo-btn"
      class:flash-active={activeFeedback === 'undo'}
      onmouseenter={handleOtherMouseEnter}
      onclick={handleUndoClick}
      title="Undo (Ctrl+Z)"
      aria-label="Undo"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 9h12a5 5 0 0 1 5 5 5 5 0 0 1-5 5H7" />
        <polyline points="7 5 3 9 7 13" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Undo</span>
        <span class="tooltip-kbd">Ctrl+Z</span>
      </span>
    </button>
  </div>

  <!-- 7. Redo Action -->
  <div class="dock-item">
    <button
      type="button"
      class="dock-btn redo-btn"
      class:flash-active={activeFeedback === 'redo'}
      onmouseenter={handleOtherMouseEnter}
      onclick={handleRedoClick}
      title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
      aria-label="Redo"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 9H9a5 5 0 0 0-5 5 5 5 0 0 0 5 5h8" />
        <polyline points="17 5 21 9 17 13" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Redo</span>
        <span class="tooltip-kbd">Ctrl+Y</span>
      </span>
    </button>
  </div>
</div>

<style>
  .side-toolbar {
    position: fixed;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 45;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px;
    box-sizing: border-box;
    border-radius: 6px;
    border: 1px solid var(--border-strong);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: var(--shadow-sm), 0 4px 14px rgba(0, 0, 0, 0.06);
    user-select: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .side-toolbar:hover {
    border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-strong));
    box-shadow: var(--shadow-sm), 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .side-toolbar:focus {
    outline: none;
  }

  .dock-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .dock-label {
    font-size: 8px;
    font-weight: 700;
    color: var(--accent-primary);
    letter-spacing: 0.05em;
    line-height: 1;
    margin-top: 2px;
    pointer-events: none;
    text-transform: uppercase;
    transition: all 0.15s ease;
  }

  .dock-divider {
    width: 20px;
    height: 1px;
    background: var(--border-strong);
    margin: 2px 0;
  }

  .dock-btn {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 5px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }

  .dock-btn:hover {
    background: var(--surface-2);
    color: var(--text-h);
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }

  .dock-btn:active,
  .dock-btn.flash-active {
    transform: scale(0.92);
  }

  /* Active tool styling */
  .dock-btn.is-active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow), var(--shadow-sm);
  }

  .dock-btn.is-active:hover {
    background: var(--accent-primary-hover, var(--accent-primary));
    color: #ffffff;
  }

  /* DSA Hub button */
  .dock-btn.dsa-btn {
    background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 22%, transparent);
  }

  .dock-btn.dsa-btn:hover,
  .dock-btn.dsa-btn.is-open {
    background: color-mix(in srgb, var(--accent-primary) 18%, transparent);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow);
  }

  /* Tooltip on right */
  .tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%) translateX(-4px);
    pointer-events: none;
    opacity: 0;
    white-space: nowrap;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    color: var(--text-h);
    padding: 3px 7px;
    border-radius: 5px;
    font-size: 11px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: var(--shadow-sm), 0 4px 14px rgba(0, 0, 0, 0.12);
    transition: all 0.15s ease;
    z-index: 100;
  }

  .dock-btn:hover .tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  .tooltip-title {
    font-weight: 600;
  }

  .tooltip-kbd {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--accent-primary);
  }

  /* Suppress tool button tooltip when flyout drawer is open */
  .dock-btn.shapes-btn[aria-expanded="true"] .tooltip,
  .dock-btn.dsa-btn[aria-expanded="true"] .tooltip {
    display: none !important;
  }

  /* Vertical Rounded Rectangular Flyouts for Shapes and DSA */
  .shapes-flyout,
  .dsa-flyout {
    position: absolute;
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border-strong);
    border-radius: 6px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    box-shadow: var(--shadow-sm), 0 6px 20px rgba(0, 0, 0, 0.12);
    z-index: 100;
    animation: flyoutIn 0.14s ease-out;
  }

  /* Hover bridge between dock and flyout drawer */
  .shapes-flyout::before,
  .dsa-flyout::before {
    content: '';
    position: absolute;
    left: -12px;
    top: -4px;
    bottom: -4px;
    width: 14px;
    background: transparent;
  }

  @keyframes flyoutIn {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(-4px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0) scale(1);
    }
  }

  .flyout-icon-btn {
    position: relative;
    width: 32px;
    height: 32px;
    border-radius: 5px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }

  .flyout-icon-btn:hover {
    background: var(--surface-2);
    color: var(--text-h);
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }

  .flyout-icon-btn:active {
    transform: scale(0.92);
  }

  .flyout-icon-btn.is-active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow), var(--shadow-sm);
  }

  .flyout-icon-btn .tooltip {
    left: calc(100% + 8px);
  }

  .flyout-icon-btn:hover .tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  @media (max-width: 640px) {
    .side-toolbar {
      left: 6px;
      padding: 3px;
      border-radius: 6px;
      gap: 3px;
    }

    .dock-btn,
    .flyout-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 4px;
    }

    .dock-btn svg,
    .flyout-icon-btn svg {
      width: 15px;
      height: 15px;
    }

    .dock-divider {
      width: 16px;
      margin: 1px 0;
    }
  }
</style>
