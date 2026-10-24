<script lang="ts">
  export type AutoCreateState = { x: number; y: number; text: string; error: string };

  let {
    modal = $bindable(),
    onCancel,
    onConfirm,
  }: {
    modal: AutoCreateState | null;
    onCancel: () => void;
    onConfirm: () => void;
  } = $props();
</script>

{#if modal}
  <div class="dim-back" role="presentation" onclick={onCancel}></div>
  <div
    class="dim-panel paste-panel"
    data-app-modal
    role="dialog"
    aria-modal="true"
    aria-labelledby="auto-create-title"
  >
    <div class="modal-header">
      <div class="modal-icon-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <div>
        <h2 id="auto-create-title" class="dim-h">Smart Auto Create</h2>
        <p class="modal-sub">Paste values in any format — automatically converted into arrays or matrices.</p>
      </div>
    </div>

    <div class="chip-row" aria-label="Example templates">
      <span class="chip-label">Quick test:</span>
      <button
        type="button"
        class="template-chip"
        onclick={() => {
          if (modal) modal.text = '[2, 7, 11, 15]';
        }}
      >
        1D Array
      </button>
      <button
        type="button"
        class="template-chip"
        onclick={() => {
          if (modal) modal.text = '[[1, 2, 3], [4, 5, 6], [7, 8, 9]]';
        }}
      >
        3×3 Grid
      </button>
      <button
        type="button"
        class="template-chip"
        onclick={() => {
          if (modal) modal.text = 'a, b, c, d, e';
        }}
      >
        CSV Tokens
      </button>
    </div>

    <div class="ta-container">
      <label class="paste-label" for="auto-create-ta">Input payload</label>
      <textarea
        id="auto-create-ta"
        class="paste-ta dim-in"
        bind:value={modal.text}
        rows="6"
        spellcheck="false"
        placeholder="e.g. 1, 2, 3 or [[1, 2], [3, 4]] or ['head', 'mid', 'tail']"
        oninput={() => {
          if (modal?.error) modal = { ...modal, error: '' };
        }}
      ></textarea>
    </div>

    {#if modal.error}
      <div class="paste-err" role="alert">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{modal.error}</span>
      </div>
    {/if}

    <div class="dim-actions">
      <button type="button" class="btn ghost-btn" onclick={onCancel}>Cancel</button>
      <button type="button" class="btn primary-btn" onclick={onConfirm}>
        <span>Generate Structure</span>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
          <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
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

  .paste-panel {
    width: min(540px, calc(100vw - 32px));
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

  .chip-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .chip-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted-2);
  }

  .template-chip {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--accent-primary) 10%, var(--surface-2));
    border: 1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border));
    color: var(--accent-primary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .template-chip:hover {
    background: color-mix(in srgb, var(--accent-primary) 18%, var(--surface-2));
    border-color: var(--accent-primary);
    transform: translateY(-1px);
  }

  .ta-container {
    margin-bottom: 14px;
  }

  .paste-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--muted);
    text-transform: uppercase;
  }

  .paste-ta {
    display: block;
    width: 100%;
    box-sizing: border-box;
    min-height: 120px;
    resize: vertical;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-h);
    font: 500 13px/1.55 var(--mono);
    outline: none;
    transition: all 0.15s ease;
  }

  .paste-ta:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--accent-primary-glow);
    background: var(--surface);
  }

  .paste-err {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent-r) 12%, var(--surface-2));
    border: 1px solid color-mix(in srgb, var(--accent-r) 30%, transparent);
    color: var(--accent-r);
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 14px;
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
