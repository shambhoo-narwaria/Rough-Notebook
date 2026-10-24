<script lang="ts">
  import { doc, setSelectedBlock, exitCellFocus, clearSelection, type PlacedBlock } from '@/library/state/document.svelte';
  import { registerBlockRoot } from '@/library/focus/focusRegistry';

  type Props = { block: PlacedBlock & { type: 'array' } };
  let { block }: Props = $props();

  let root: HTMLDivElement | null = $state(null);

  $effect(() => {
    registerBlockRoot(block.id, root);
    return () => registerBlockRoot(block.id, null);
  });

  const selected = $derived(doc.selectedBlockId === block.id);

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
    if (e.target !== e.currentTarget) return;
    if (!selected) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSelection();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="wrap" bind:this={root} tabindex="0" role="application" aria-label="Array" onkeydown={onWrapKeydown}>
  <div class="scale">
    <div class="row">
      {#each block.values as v, i (i)}
        <div class="col">
          <div class="idx">{i}</div>
          <div class="cell">
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
  </div>
</div>

<style>
  .wrap {
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    padding: 0;
    outline: none;
    transition: all 0.15s ease;
    min-width: 0;
    width: fit-content;
    max-width: min(92vw, 960px);
  }

  .wrap:focus-visible {
    border-color: var(--border-glow);
  }

  .scale {
    width: fit-content;
    max-width: min(92vw, 960px);
  }

  .row {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 10px;
  }

  .col {
    flex: 0 0 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: stretch;
    width: min-content;
  }

  .idx {
    font: 600 11px var(--mono);
    color: var(--muted-2);
    text-align: center;
    padding: 2px 0;
    line-height: 1.15;
    letter-spacing: 0.02em;
    user-select: none;
    transition: color 0.15s ease;
  }

  .col:focus-within .idx {
    color: var(--accent-cyan);
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
</style>
