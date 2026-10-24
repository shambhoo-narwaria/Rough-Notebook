<script lang="ts">
  type Props = {
    open: boolean;
    blockCount: number;
    strokeCount: number;
    onConfirm: () => void;
    onCancel: () => void;
  };

  let { open, blockCount, strokeCount, onConfirm, onCancel }: Props = $props();

  function onKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div class="modal-backdrop" role="presentation" onclick={onCancel}></div>
  <div
    class="clear-modal"
    data-app-modal
    role="dialog"
    aria-modal="true"
    aria-labelledby="clear-modal-title"
    aria-describedby="clear-modal-desc"
  >
    <div class="modal-header">
      <div class="warning-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </div>
      <div class="header-text">
        <h2 id="clear-modal-title" class="modal-title">Clear Canvas?</h2>
        <p class="modal-sub">Erase all structures and annotations</p>
      </div>
    </div>

    <div class="modal-body">
      <p id="clear-modal-desc" class="modal-desc">
        Are you sure you want to clear the entire canvas? All active data structures, notes, and pen drawings will be erased.
      </p>

      {#if blockCount > 0 || strokeCount > 0}
        <div class="stats-pill">
          <span class="pill-dot"></span>
          <span>
            {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
            {#if strokeCount > 0}
              &nbsp;·&nbsp;{strokeCount} {strokeCount === 1 ? 'drawing stroke' : 'drawing strokes'}
            {/if}
          </span>
        </div>
      {/if}

      <div class="undo-hint">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        <span>You can restore your work with <kbd>Ctrl</kbd>+<kbd>Z</kbd> (<kbd>⌘Z</kbd>) afterwards.</span>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn cancel-btn" onclick={onCancel}>
        Cancel
      </button>
      <button type="button" class="btn danger-btn" onclick={onConfirm}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <span>Clear Canvas</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: var(--help-overlay);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, -46%) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  .clear-modal {
    position: fixed;
    z-index: 70;
    left: 50%;
    top: 48%;
    transform: translate(-50%, -50%);
    width: min(440px, calc(100vw - 32px));
    padding: 24px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-strong);
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 18px;
    user-select: none;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .warning-badge {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(201, 74, 58, 0.12);
    border: 1px solid rgba(201, 74, 58, 0.28);
    color: var(--accent-r);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  :global(html.dark) .warning-badge {
    background: rgba(224, 96, 80, 0.15);
    border-color: rgba(224, 96, 80, 0.35);
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .modal-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-h);
    letter-spacing: -0.015em;
  }

  .modal-sub {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-desc {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--text);
  }

  .stats-pill {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted);
  }

  .pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-primary);
  }

  .undo-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-size: 0.82rem;
    color: var(--muted);
    line-height: 1.4;
  }

  .undo-hint svg {
    flex-shrink: 0;
    color: var(--accent-primary);
  }

  .undo-hint kbd {
    display: inline-block;
    padding: 1px 5px;
    font-size: 0.75rem;
    font-family: var(--mono);
    color: var(--text-h);
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 4px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    height: 38px;
    padding: 0 16px;
    border-radius: var(--radius-md);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid var(--border-strong);
    color: var(--text);
  }

  .cancel-btn:hover {
    background: var(--surface-2);
    color: var(--text-h);
  }

  .danger-btn {
    background: var(--accent-r);
    border: 1px solid var(--accent-r);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(201, 74, 58, 0.25);
  }

  .danger-btn:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(201, 74, 58, 0.35);
  }

  .danger-btn:active {
    transform: translateY(0);
    filter: brightness(0.96);
  }
</style>
