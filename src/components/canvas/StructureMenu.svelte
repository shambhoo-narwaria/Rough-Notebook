<script lang="ts">
  import { pushUndoPoint, removeBlock, type PlacedBlock } from '@/library/state/document.svelte';

  type MenuItem = { label: string; danger?: boolean; disabled?: boolean; run: () => void };
  type MenuCategory = { title: string; items: MenuItem[] };

  type Props = {
    block: PlacedBlock;
    open: boolean;
    left: number;
    top: number;
    onClose: () => void;
    onAutoCreate?: () => void;
  };

  let { block, open, left, top, onClose, onAutoCreate }: Props = $props();

  function structureTypeLabel(t: PlacedBlock['type']): string {
    if (t === 'spine') return 'lineBreak';
    return t;
  }

  let panelEl: HTMLDivElement | null = $state(null);

  $effect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelEl?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDoc, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc, true);
      document.removeEventListener('keydown', onKey);
    };
  });

  const categories = $derived.by((): MenuCategory[] => {
    const actions: MenuCategory = {
      title: 'Actions',
      items: [
        ...(onAutoCreate
          ? [
              {
                label: 'Auto create',
                run: () => onAutoCreate(),
              },
            ]
          : []),
        {
          label: 'Remove from canvas',
          danger: true,
          run: () => removeBlock(block.id),
        },
      ],
    };

    if (block.type === 'array') {
      return [
        {
          title: 'Dimensions',
          items: [
            {
              label: 'Add cell',
              disabled: block.values.length >= 32,
              run: () => {
                if (block.values.length >= 32) return;
                pushUndoPoint();
                block.values = [...block.values, ''];
              },
            },
            {
              label: 'Remove last cell',
              disabled: block.values.length <= 1,
              run: () => {
                if (block.values.length <= 1) return;
                pushUndoPoint();
                block.values = block.values.slice(0, -1);
              },
            },
          ],
        },
        actions,
      ];
    }

    if (block.type === 'matrix') {
      const rows = block.rows.length;
      const cols = block.rows[0]?.length ?? 0;
      return [
        {
          title: 'Dimensions',
          items: [
            {
              label: 'Add row',
              disabled: rows >= 16,
              run: () => {
                if (rows >= 16) return;
                pushUndoPoint();
                const c = Math.max(cols, 1);
                block.rows = [...block.rows, Array.from({ length: c }, () => '')];
              },
            },
            {
              label: 'Remove last row',
              disabled: rows <= 1,
              run: () => {
                if (rows <= 1) return;
                pushUndoPoint();
                block.rows = block.rows.slice(0, -1);
              },
            },
            {
              label: 'Add column',
              disabled: cols >= 16,
              run: () => {
                if (cols >= 16) return;
                pushUndoPoint();
                block.rows = block.rows.map((row) => [...row, '']);
              },
            },
            {
              label: 'Remove last column',
              disabled: cols <= 1,
              run: () => {
                if (cols <= 1) return;
                pushUndoPoint();
                block.rows = block.rows.map((row) => row.slice(0, -1));
              },
            },
          ],
        },
        actions,
      ];
    }

    return [actions];
  });

  const panelPos = $derived.by(() => {
    const pad = 8;
    const w = 260;
    const h = 360;
    let l = left;
    let t = top;
    if (typeof window !== 'undefined') {
      l = Math.min(Math.max(pad, l), window.innerWidth - w - pad);
      t = Math.min(Math.max(pad, t), window.innerHeight - h - pad);
    }
    return { l, t };
  });
</script>

{#if open}
  <div
    class="panel"
    bind:this={panelEl}
    data-structure-menu-panel
    role="menu"
    aria-label="Structure options"
    style:left="{panelPos.l}px"
    style:top="{panelPos.t}px"
  >
    <div class="panel-head">
      <span class="panel-title">Structure</span>
      <span class="panel-type">{structureTypeLabel(block.type)}</span>
    </div>
    <div class="panel-body">
      {#each categories as cat (cat.title)}
        <div class="cat">
          <div class="cat-head">
            <span class="cat-title">{cat.title}</span>
          </div>
          {#each cat.items as it (it.label)}
            <button
              type="button"
              role="menuitem"
              class="item"
              class:danger={it.danger}
              disabled={it.disabled}
              onclick={() => {
                it.run();
                onClose();
              }}
            >
              {it.label}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .panel {
    position: fixed;
    z-index: 200;
    min-width: 230px;
    max-width: min(92vw, 290px);
    max-height: min(72vh, 440px);
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-strong);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: var(--shadow-lg);
    animation: fadeInScale 0.12s ease-out;
    padding: 6px;
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .panel-head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px 10px;
    border-bottom: 1px solid var(--border);
  }

  .panel-title {
    font: 700 13px var(--sans);
    color: var(--text-h);
    letter-spacing: -0.01em;
  }

  .panel-type {
    font: 600 10px var(--mono);
    color: var(--accent-primary);
    background: color-mix(in srgb, var(--accent-primary) 12%, var(--surface-2));
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .panel-body {
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 4px 0;
  }

  .cat {
    padding: 4px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  }

  .cat:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .cat-head {
    padding: 4px 10px 4px;
  }

  .cat-title {
    font: 700 10px var(--sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }

  .item {
    display: block;
    width: 100%;
    text-align: left;
    border: none;
    background: transparent;
    font: 500 13px var(--sans);
    color: var(--text-h);
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    line-height: 1.35;
    transition: all 0.12s ease;
  }

  .item:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text-h);
  }

  .item:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .item.danger {
    color: var(--accent-r);
  }

  .item.danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent-r) 12%, var(--surface-2));
  }
</style>
