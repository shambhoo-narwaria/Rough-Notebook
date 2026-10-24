<script lang="ts">
  import PenRadialMenu from '@/components/canvas/PenRadialMenu.svelte';
  import type { PenColorKey } from '@/library/handwriting/penColor';

  let {
    penActive,
    penColorKey,
    dark,
    handActive = false,
    onTogglePen,
    onToggleHand,
    onPickColor,
    onClearSketches,
    onOpenSlash,
    onClearBoard,
    onToggleTheme,
    onOpenHelp,
  }: {
    penActive: boolean;
    penColorKey: PenColorKey;
    dark: boolean;
    handActive?: boolean;
    onTogglePen: () => void;
    onToggleHand?: () => void;
    onPickColor: (k: PenColorKey) => void;
    onClearSketches: () => void;
    onOpenSlash: () => void;
    onClearBoard: () => void;
    onToggleTheme: () => void;
    onOpenHelp: () => void;
  } = $props();
</script>

<header class="top">
  <div class="brand">
    <div class="brand-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="2" x2="8" y2="22" />
        <line x1="12" y1="7" x2="18" y2="7" />
        <line x1="12" y1="11" x2="18" y2="11" />
        <line x1="12" y1="15" x2="15" y2="15" />
      </svg>
    </div>
    <span class="logo" aria-label="Rough Notebook">
      <span class="logo-title">Rough<span class="logo-accent"> Notebook</span></span>
    </span>
    <span class="logo-tag">Think it. Trace it. Solve it.</span>
  </div>

  <div class="actions">
    <PenRadialMenu
      {penActive}
      {penColorKey}
      {dark}
      onTogglePen={onTogglePen}
      onPickColor={onPickColor}
      onClearSketches={onClearSketches}
    />
    <button
      type="button"
      class="icon-btn hand-tool-btn"
      class:is-active={handActive}
      onclick={onToggleHand}
      title={handActive ? 'Turn off hand / pan mode (or press Esc)' : 'Turn on hand / pan mode (H)'}
      aria-label="Hand / Pan mode"
    >
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 11V5a1 1 0 0 1 2 0v5" />
        <path d="M9 10V4a1 1 0 0 1 2 0v6" />
        <path d="M11 10V5a1 1 0 0 1 2 0v6" />
        <path d="M13 11V7a1 1 0 0 1 2 0v5c0 3-2 5-5 5s-5-2-5-5v-3a1 1 0 0 1 2 0v2" />
      </svg>
    </button>
    <button
      type="button"
      class="action-btn insert-btn"
      onclick={onOpenSlash}
      title="Insert structure (⌘/ or Ctrl+/)"
    >
      <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
      </svg>
      <span>Insert</span>
      <kbd class="btn-kbd">⌘/</kbd>
    </button>

    <button
      type="button"
      class="action-btn danger-btn"
      onclick={onClearBoard}
      title="Clear entire canvas"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      <span>Clear</span>
    </button>

    <div class="divider-v" aria-hidden="true"></div>

    <button
      type="button"
      class="icon-btn theme-btn"
      onclick={onToggleTheme}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {#if dark}
        <svg class="theme-icon sun-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      {:else}
        <svg class="theme-icon moon-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {/if}
    </button>

    <button
      type="button"
      class="icon-btn help-btn"
      onclick={onOpenHelp}
      title="Guide & Keyboard Shortcuts"
      aria-label="Guide and keyboard shortcuts"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </button>
  </div>
</header>

<style>
  .top {
    flex: 0 0 auto;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 18%, var(--surface-2)), color-mix(in srgb, var(--accent-primary) 8%, var(--surface)));
    border: 1px solid color-mix(in srgb, var(--accent-primary) 40%, var(--border));
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px var(--accent-primary-glow);
    transition: all 0.2s ease;
  }

  .brand-icon:hover {
    transform: scale(1.05);
    border-color: var(--accent-primary);
    box-shadow: 0 4px 14px var(--accent-primary-glow);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .logo-title {
    font-family: var(--brand-display);
    font-weight: 700;
    font-size: 17px;
    line-height: 1.1;
    letter-spacing: -0.025em;
    color: var(--text-h);
  }

  .logo-accent {
    color: var(--accent-primary);
    font-weight: 800;
  }

  .logo-tag {
    display: none;
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  @media (min-width: 600px) {
    .logo-tag {
      display: inline;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .divider-v {
    width: 1px;
    height: 22px;
    background: var(--border);
    margin: 0 2px;
  }

  .action-btn {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-h);
    font: 600 13px var(--sans);
    padding: 7px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;
    box-shadow: var(--shadow-sm);
  }

  .action-btn:hover {
    background: var(--surface-2);
    border-color: var(--border-strong);
    transform: translateY(-1px);
  }

  .btn-kbd {
    font-family: var(--mono);
    font-size: 10px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--muted);
  }

  .insert-btn {
    border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border));
  }

  .insert-btn svg {
    color: var(--accent-primary);
  }

  .insert-btn:hover {
    border-color: var(--accent-primary);
    box-shadow: 0 2px 10px var(--accent-primary-glow);
  }

  .danger-btn {
    color: var(--accent-r);
    border-color: color-mix(in srgb, var(--accent-r) 22%, var(--border));
  }

  .danger-btn:hover {
    background: color-mix(in srgb, var(--accent-r) 10%, var(--surface));
    border-color: var(--accent-r);
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    box-shadow: var(--shadow-sm);
  }

  .icon-btn:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .icon-btn.is-active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px var(--accent-primary-glow);
  }

  .help-btn:hover {
    color: var(--accent-primary);
  }
</style>
