<script lang="ts">
  type Props = {
    penActive: boolean;
    activeTool?: string | null;
    onSelectNote: () => void;
    onSelectArray: () => void;
    onSelectMatrix: () => void;
    onTogglePen: () => void;
  };

  let {
    penActive,
    activeTool = null,
    onSelectNote,
    onSelectArray,
    onSelectMatrix,
    onTogglePen,
  }: Props = $props();

  let activeFeedback = $state<string | null>(null);

  function triggerAction(id: string, action: () => void) {
    activeFeedback = id;
    setTimeout(() => {
      if (activeFeedback === id) activeFeedback = null;
    }, 180);
    action();
  }

  function onDragStart(e: DragEvent, toolId: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('application/rough-tool', toolId);
    e.dataTransfer.effectAllowed = 'copy';
  }
</script>

<div class="side-toolbar" aria-label="Tool Palette" role="toolbar">
  <div class="tool-group">
    <button
      type="button"
      class="tool-btn"
      class:is-active={activeTool === 'note'}
      class:flash-active={activeFeedback === 'note'}
      onclick={() => triggerAction('note', onSelectNote)}
      draggable="true"
      ondragstart={(e) => onDragStart(e, 'note')}
      aria-label="Text Note"
      aria-pressed={activeTool === 'note'}
    >
      <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 3h9l4 4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M13 3v4h4" />
        <line x1="7" y1="10" x2="13" y2="10" />
        <line x1="7" y1="14" x2="11" y2="14" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Text Note</span>
        <span class="tooltip-sub">Click to add or drag to canvas</span>
      </span>
    </button>

    <button
      type="button"
      class="tool-btn"
      class:is-active={activeTool === 'array'}
      class:flash-active={activeFeedback === 'array'}
      onclick={() => triggerAction('array', onSelectArray)}
      draggable="true"
      ondragstart={(e) => onDragStart(e, 'array')}
      aria-label="1D Array"
      aria-pressed={activeTool === 'array'}
    >
      <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="5" width="16" height="10" rx="2" />
        <line x1="7.33" y1="5" x2="7.33" y2="15" />
        <line x1="12.66" y1="5" x2="12.66" y2="15" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">1D Array</span>
        <span class="tooltip-sub">Click to add or drag to canvas</span>
      </span>
    </button>

    <button
      type="button"
      class="tool-btn"
      class:is-active={activeTool === 'matrix'}
      class:flash-active={activeFeedback === 'matrix'}
      onclick={() => triggerAction('matrix', onSelectMatrix)}
      draggable="true"
      ondragstart={(e) => onDragStart(e, 'matrix')}
      aria-label="2D Matrix"
      aria-pressed={activeTool === 'matrix'}
    >
      <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="16" height="16" rx="2" />
        <line x1="2" y1="10" x2="18" y2="10" />
        <line x1="10" y1="2" x2="10" y2="18" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">2D Matrix</span>
        <span class="tooltip-sub">Click to add or drag to canvas</span>
      </span>
    </button>
  </div>

  <div class="tool-divider" role="separator" aria-orientation="horizontal"></div>

  <div class="tool-group">
    <button
      type="button"
      class="tool-btn pen-btn"
      class:is-active={penActive || activeTool === 'pen'}
      class:flash-active={activeFeedback === 'pen'}
      onclick={() => triggerAction('pen', onTogglePen)}
      aria-label="Toggle Pen Layer (P)"
      aria-pressed={penActive}
    >
      <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14.5 2.5a2.121 2.121 0 0 1 3 3L6 17l-4 1 1-4L14.5 2.5z" />
        <line x1="12.5" y1="4.5" x2="15.5" y2="7.5" />
      </svg>
      <span class="tooltip">
        <span class="tooltip-title">Pen Draw</span>
        <span class="tooltip-kbd">P</span>
      </span>
    </button>
  </div>
</div>

<style>
  .side-toolbar {
    position: fixed;
    left: 14px;
    top: calc(50% + 12px);
    transform: translateY(-50%);
    z-index: 45;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 5px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
    user-select: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .side-toolbar:hover {
    border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border));
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14), 0 0 0 1px var(--accent-primary-glow);
  }

  .tool-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .tool-divider {
    width: 20px;
    height: 1px;
    background: var(--border);
    margin: 3px 0;
  }

  .tool-btn {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 8px;
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

  .tool-btn:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 30%, var(--border));
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .tool-btn:active,
  .tool-btn.flash-active {
    transform: scale(0.92);
  }

  .tool-btn.is-active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow), 0 4px 12px var(--accent-primary-glow);
  }

  .tool-btn.is-active:hover {
    background: var(--accent-primary-hover, var(--accent-primary));
    color: #ffffff;
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
    background: var(--surface-3);
    border: 1px solid var(--border-strong);
    color: var(--text-h);
    padding: 5px 9px;
    border-radius: 7px;
    font-size: 11px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 7px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 100;
  }

  .tool-btn:hover .tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  .tooltip-title {
    font-weight: 600;
  }

  .tooltip-sub {
    color: var(--muted);
    font-size: 10px;
  }

  .tooltip-kbd {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--accent-primary);
  }

  @media (max-width: 640px) {
    .side-toolbar {
      left: 8px;
      padding: 4px;
      border-radius: 10px;
      gap: 2px;
    }

    .tool-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
    }

    .tool-btn svg {
      width: 15px;
      height: 15px;
    }

    .tool-divider {
      width: 16px;
      margin: 2px 0;
    }
  }
</style>
