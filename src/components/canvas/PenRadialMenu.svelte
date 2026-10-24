<script lang="ts">
  import type { PenColorKey } from '@/library/handwriting/penColor';
  import { autoHandwritingActive } from '@/library/state/sketches.svelte';

  type Props = {
    penActive: boolean;
    penColorKey: PenColorKey;
    dark: boolean;
    onTogglePen: () => void;
    onPickColor: (k: PenColorKey) => void;
    onClearSketches: () => void;
  };

  let { penActive, penColorKey, dark, onTogglePen, onPickColor, onClearSketches }: Props = $props();

  const inkFill = $derived(dark ? '#f5f0e8' : '#252525');  /* warm dark ink */
  const rgb = { r: '#C94A3A', g: '#3A7D5C', b: '#2B6EA8' } as const;
</script>

<div class="hub">
  {#if penActive}
    <div class="drop" role="menu" aria-label="Pen options">
      <div class="mode-pill" role="radiogroup" aria-label="Pen handwriting mode">
        <button
          type="button"
          class="mode-btn"
          class:sel={!autoHandwritingActive.value}
          onclick={() => { autoHandwritingActive.value = false; }}
          title="Draw Mode: Freehand ink notes"
        >
          Draw
        </button>
        <button
          type="button"
          class="mode-btn"
          class:sel={autoHandwritingActive.value}
          onclick={() => { autoHandwritingActive.value = true; }}
          title="Smart Pen: Auto-convert handwriting to text"
        >
          Smart Pen
        </button>
      </div>

      <div class="color-group" role="group" aria-label="Stroke color">
        {#each (['ink', 'r', 'g', 'b'] as PenColorKey[]) as key (key)}
          <button
            type="button"
            class="orb color-orb"
            class:sel={penColorKey === key}
            aria-label={key === 'ink' ? 'Theme default stroke' : `Color ${key}`}
            role="menuitem"
            onclick={() => onPickColor(key)}
          >
            <span class="fill" style:background={key === 'ink' ? inkFill : rgb[key]}></span>
          </button>
        {/each}
      </div>
      <button type="button" class="clear-marks" role="menuitem" onclick={onClearSketches} title="Clear all ink strokes">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <span class="clear-label">Clear Marks</span>
      </button>
    </div>
  {/if}

  <button
    type="button"
    class="fab"
    class:on={penActive}
    aria-pressed={penActive}
    title={penActive ? 'Turn off pen drawing mode' : 'Turn on pen drawing mode'}
    onclick={onTogglePen}
  >
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  </button>
</div>

<style>
  .hub {
    position: relative;
    z-index: 210;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .fab {
    position: relative;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .fab:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .fab.on {
    border-color: var(--accent-primary);
    background: var(--accent-primary);
    color: var(--accent-primary-text, #ffffff);
    box-shadow: 0 0 0 2px var(--accent-primary-glow), var(--shadow-sm);
  }

  .fab.on:hover {
    filter: brightness(1.08);
  }

  .drop {
    flex: 0 0 auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    border-radius: 6px;
    height: 28px;
    box-sizing: border-box;
    border: 1px solid var(--border-strong);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: var(--shadow-sm);
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  .mode-pill {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: var(--surface-2);
    border-radius: 5px;
    padding: 1px;
    gap: 1px;
    border: 1px solid var(--border);
  }

  .mode-btn {
    padding: 2px 6px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--muted);
    font: 600 10px var(--sans);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .mode-btn:hover {
    color: var(--text-h);
  }

  .mode-btn.sel {
    background: var(--surface);
    color: var(--accent-primary);
    box-shadow: var(--shadow-sm);
  }

  .color-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }

  .orb {
    width: 20px;
    height: 20px;
    padding: 0;
    border-radius: 50%;
    border: 2px solid transparent;
    background: var(--surface-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    transition: all 0.15s ease;
  }

  .orb:hover {
    transform: scale(1.15);
  }

  .color-orb .fill {
    display: block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .color-orb.sel {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow);
    transform: scale(1.1);
  }

  .clear-marks {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 5px;
    border: 1px solid color-mix(in srgb, var(--accent-r) 25%, var(--border));
    background: color-mix(in srgb, var(--accent-r) 8%, var(--surface-2));
    color: var(--accent-r);
    font: 600 10px var(--sans);
    cursor: pointer;
    transition: all 0.15s ease;
    height: 22px;
    box-sizing: border-box;
  }

  .clear-marks:hover {
    background: color-mix(in srgb, var(--accent-r) 16%, var(--surface-2));
    border-color: var(--accent-r);
  }

  .clear-label {
    white-space: nowrap;
  }
</style>
