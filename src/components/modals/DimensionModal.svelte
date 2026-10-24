<script lang="ts">
  export type DimState =
    | { kind: 'array'; x: number; y: number; length: number }
    | { kind: 'matrix'; x: number; y: number; rows: number; cols: number };

  let {
    dim = $bindable(),
    onCancel,
    onConfirm,
  }: {
    dim: DimState | null;
    onCancel: () => void;
    onConfirm: () => void;
  } = $props();
</script>

{#if dim}
  <div class="dim-back" role="presentation" onclick={onCancel}></div>
  <div class="dim-panel" data-app-modal role="dialog" aria-modal="true" aria-labelledby="dim-title">
    <div class="modal-header">
      <div class="modal-icon-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      </div>
      <div>
        <h2 id="dim-title" class="dim-h">
          {dim.kind === 'array' ? 'New 1D Array' : 'New 2D Matrix'}
        </h2>
        <p class="modal-sub">Configure dimensions for your data structure</p>
      </div>
    </div>

    <div class="dim-form">
      {#if dim.kind === 'array'}
        <label class="dim-field">
          <span class="dim-label">Array Length <small>(1 – 32)</small></span>
          <input type="number" min="1" max="32" bind:value={dim.length} class="dim-in input-field" />
        </label>
      {:else}
        <div class="dim-grid">
          <label class="dim-field">
            <span class="dim-label">Rows <small>(1 – 16)</small></span>
            <input type="number" min="1" max="16" bind:value={dim.rows} class="dim-in input-field" />
          </label>
          <label class="dim-field">
            <span class="dim-label">Columns <small>(1 – 16)</small></span>
            <input type="number" min="1" max="16" bind:value={dim.cols} class="dim-in input-field" />
          </label>
        </div>
      {/if}
    </div>

    <div class="dim-actions">
      <button type="button" class="btn ghost-btn" onclick={onCancel}>Cancel</button>
      <button type="button" class="btn primary-btn" onclick={onConfirm}>Create Structure</button>
    </div>
  </div>
{/if}

<style>
  .dim-back {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: var(--help-overlay);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
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

  .dim-panel {
    position: fixed;
    z-index: 70;
    left: 50%;
    top: 45%;
    transform: translate(-50%, -50%);
    width: min(440px, calc(100vw - 32px));
    padding: 24px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-strong);
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }

  .modal-icon-badge {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--accent-primary) 14%, var(--surface-2));
    border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border));
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dim-h {
    margin: 0 0 4px;
    font: 700 17px/1.2 var(--sans);
    color: var(--text-h);
    letter-spacing: -0.02em;
  }

  .modal-sub {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    line-height: 1.45;
  }

  .dim-form {
    margin: 16px 0 20px;
  }

  .dim-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .dim-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .dim-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .dim-label small {
    font-weight: 400;
    color: var(--muted);
  }

  .input-field {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-h);
    font: 600 15px var(--mono);
    outline: none;
    transition: all 0.15s ease;
  }

  .input-field:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--accent-primary-glow);
    background: var(--surface);
  }

  .dim-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }

  .btn {
    font: 600 13px var(--sans);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
  }

  .ghost-btn {
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
  }

  .ghost-btn:hover {
    background: var(--surface-2);
    color: var(--text-h);
  }

  .primary-btn {
    border: 1px solid color-mix(in srgb, var(--accent-primary) 70%, #000);
    background: var(--accent-primary);
    color: var(--accent-primary-text, #ffffff);
    box-shadow: 0 2px 10px var(--accent-primary-glow);
  }

  .primary-btn:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px var(--accent-primary-glow);
  }
</style>
