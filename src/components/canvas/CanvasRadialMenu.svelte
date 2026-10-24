<script lang="ts">
  type Props = {
    x: number;
    y: number;
    penActive: boolean;
    handActive: boolean;
    onSelectNote: () => void;
    onSelectArray: () => void;
    onSelectMatrix: () => void;
    onTogglePen: () => void;
    onToggleHand: () => void;
    onClose: () => void;
  };

  let {
    x,
    y,
    penActive,
    handActive,
    onSelectNote,
    onSelectArray,
    onSelectMatrix,
    onTogglePen,
    onToggleHand,
    onClose,
  }: Props = $props();

  let hoveredItem = $state<string | null>(null);

  // 5 items evenly distributed around 360 degrees (72 deg separation)
  // Radius R = 54px
  // 0: Note (Top, -90deg): (0, -54)
  // 1: 1D Array (Top-Right, -18deg): (51.3, -16.7)
  // 2: 2D Matrix (Bottom-Right, 54deg): (31.7, 43.7)
  // 3: Pen Tool (Bottom-Left, 126deg): (-31.7, 43.7)
  // 4: Hand Tool (Top-Left, 198deg): (-51.3, -16.7)

  let items = $derived([
    {
      id: 'note',
      label: 'Note',
      offsetX: 0,
      offsetY: -54,
      action: onSelectNote,
      active: false,
    },
    {
      id: 'array',
      label: 'Array',
      offsetX: 51.3,
      offsetY: -16.7,
      action: onSelectArray,
      active: false,
    },
    {
      id: 'matrix',
      label: 'Matrix',
      offsetX: 31.7,
      offsetY: 43.7,
      action: onSelectMatrix,
      active: false,
    },
    {
      id: 'pen',
      label: 'Pen',
      offsetX: -31.7,
      offsetY: 43.7,
      action: onTogglePen,
      active: penActive,
    },
    {
      id: 'hand',
      label: 'Hand',
      offsetX: -51.3,
      offsetY: -16.7,
      action: onToggleHand,
      active: handActive,
    },
  ]);
</script>

<div
  class="radial-menu"
  style:left="{x}px"
  style:top="{y}px"
  role="menu"
  aria-label="Quick tools wheel"
>
  <!-- Center Hub -->
  <button
    type="button"
    class="center-hub"
    class:has-hover={hoveredItem !== null}
    onclick={onClose}
    title="Close menu (or press Esc)"
    aria-label={hoveredItem ? `Selected: ${hoveredItem}` : 'Close quick menu'}
  >
    {#if hoveredItem}
      <span class="hub-label">{hoveredItem}</span>
    {:else}
      <span class="hub-crosshair" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="8" y1="2" x2="8" y2="14" />
          <line x1="2" y1="8" x2="14" y2="8" />
        </svg>
      </span>
    {/if}
  </button>

  <!-- 5 Tool Orbs -->
  {#each items as it (it.id)}
    <button
      type="button"
      class="orb-btn"
      class:is-active={it.active}
      style:transform="translate({it.offsetX}px, {it.offsetY}px)"
      role="menuitem"
      title="{it.label} tool"
      aria-label="{it.label} tool"
      onmouseenter={() => (hoveredItem = it.label)}
      onmouseleave={() => (hoveredItem = null)}
      onclick={() => {
        it.action();
        onClose();
      }}
    >
      {#if it.id === 'note'}
        <!-- Note / Text Icon -->
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 3h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <line x1="7" y1="7" x2="13" y2="7" />
          <line x1="7" y1="10" x2="13" y2="10" />
          <line x1="7" y1="13" x2="10" y2="13" />
        </svg>
      {:else if it.id === 'array'}
        <!-- 1D Array Icon -->
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="6" width="16" height="8" rx="2" />
          <line x1="7.3" y1="6" x2="7.3" y2="14" />
          <line x1="12.7" y1="6" x2="12.7" y2="14" />
        </svg>
      {:else if it.id === 'matrix'}
        <!-- 2D Matrix Icon -->
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <line x1="10" y1="3" x2="10" y2="17" />
          <line x1="3" y1="10" x2="17" y2="10" />
        </svg>
      {:else if it.id === 'pen'}
        <!-- Pen Tool Icon -->
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z" />
          <line x1="11.5" y1="5.5" x2="14.5" y2="8.5" />
        </svg>
      {:else if it.id === 'hand'}
        <!-- Hand / Pan Tool Icon -->
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M7 11V5a1 1 0 0 1 2 0v5" />
          <path d="M9 10V4a1 1 0 0 1 2 0v6" />
          <path d="M11 10V5a1 1 0 0 1 2 0v6" />
          <path d="M13 11V7a1 1 0 0 1 2 0v5c0 3-2 5-5 5s-5-2-5-5v-3a1 1 0 0 1 2 0v2" />
        </svg>
      {/if}
    </button>
  {/each}
</div>

<style>
  .radial-menu {
    position: absolute;
    z-index: 20;
    width: 0;
    height: 0;
    pointer-events: none;
    animation: radialBloom 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes radialBloom {
    from {
      opacity: 0;
      transform: scale(0.65);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Center Hub */
  .center-hub {
    position: absolute;
    left: -19px;
    top: -19px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1.5px solid var(--border, rgba(255, 255, 255, 0.15));
    background: var(--surface, #1e1b18);
    color: var(--text-muted, #a89e94);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
    pointer-events: auto;
    transition: all 0.15s ease;
    padding: 0;
  }

  .center-hub:hover,
  .center-hub.has-hover {
    border-color: var(--accent-primary, #7C3AED);
    color: var(--accent-primary, #7C3AED);
    box-shadow: 0 4px 20px var(--accent-primary-glow, rgba(124, 58, 237, 0.25));
  }

  .hub-label {
    font-size: 10px;
    font-weight: 700;
    font-family: system-ui, -apple-system, sans-serif;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    animation: fadeIn 0.12s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .hub-crosshair {
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .center-hub:hover .hub-crosshair {
    opacity: 1;
  }

  /* Tool Orbs */
  .orb-btn {
    position: absolute;
    left: -17px;
    top: -17px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid color-mix(in srgb, var(--accent-primary, #7C3AED) 28%, var(--border, rgba(255, 255, 255, 0.12)));
    background: var(--surface, #1e1b18);
    color: var(--accent-primary, #7C3AED);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
    pointer-events: auto;
    transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.15s ease,
                color 0.15s ease,
                background 0.15s ease,
                box-shadow 0.15s ease;
    padding: 0;
  }

  .orb-btn:hover {
    border-color: var(--accent-primary, #7C3AED);
    color: #ffffff;
    background: var(--accent-primary, #7C3AED);
    box-shadow: 0 6px 18px var(--accent-primary-glow, rgba(124, 58, 237, 0.3));
    z-index: 5;
  }

  .orb-btn.is-active {
    border-color: var(--accent-primary, #7C3AED);
    background: var(--accent-primary, #7C3AED);
    color: #ffffff;
    box-shadow: 0 0 0 2px var(--accent-primary-glow, rgba(124, 58, 237, 0.4));
  }
</style>
