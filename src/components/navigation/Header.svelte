<script lang="ts">
  import PenRadialMenu from '@/components/canvas/PenRadialMenu.svelte';
  import type { PenColorKey } from '@/library/handwriting/penColor';

  let {
    penActive,
    penColorKey,
    dark,
    onTogglePen,
    onPickColor,
    onClearSketches,
    onOpenSlash,
    onClearBoard,
    onToggleTheme,
    currentPageIndex,
    totalPages,
    zenMode,
    onPrevPage,
    onNextPage,
    onNewPage,
    onToggleZen,
    onOpenHelp,
  }: {
    penActive: boolean;
    penColorKey: PenColorKey;
    dark: boolean;
    onTogglePen: () => void;
    onPickColor: (k: PenColorKey) => void;
    onClearSketches: () => void;
    onOpenSlash: () => void;
    onClearBoard: () => void;
    onToggleTheme: () => void;
    onOpenHelp: () => void;
    currentPageIndex: number;
    totalPages: number;
    zenMode: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    onNewPage: () => void;
    onToggleZen: () => void;
  } = $props();
</script>

<header class="top">
  <div class="brand">
    <div class="brand-icon" title="Rough Notebook" aria-label="Rough Notebook">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

  <div class="page-switcher" role="navigation" aria-label="Rough notebook pages">
    <button
      type="button"
      class="page-nav-btn"
      disabled={currentPageIndex === 0}
      onclick={onPrevPage}
      title="Previous page (Alt+[)"
      aria-label="Previous page"
    >
      <svg viewBox="0 0 20 20" width="10.5" height="10.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="12 15 7 10 12 5" />
      </svg>
    </button>

    <div class="page-badge" title={`Page ${currentPageIndex + 1} of ${totalPages}`}>
      <span class="page-label">Page</span>
      <span class="page-current">{currentPageIndex + 1}</span>
      <span class="page-sep">/</span>
      <span class="page-total">{totalPages}</span>
    </div>

    <button
      type="button"
      class="page-nav-btn"
      disabled={currentPageIndex === totalPages - 1}
      onclick={onNextPage}
      title="Next page (Alt+])"
      aria-label="Next page"
    >
      <svg viewBox="0 0 20 20" width="10.5" height="10.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="8 5 13 10 8 15" />
      </svg>
    </button>

    <div class="page-divider" aria-hidden="true"></div>

    <button
      type="button"
      class="page-add-btn"
      onclick={onNewPage}
      title="New clean rough page (Alt+N)"
      aria-label="New clean rough page"
    >
      <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="10" y1="4" x2="10" y2="16" />
        <line x1="4" y1="10" x2="16" y2="10" />
      </svg>
      <span class="page-add-text">New</span>
    </button>
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
      class="action-btn insert-btn"
      onclick={onOpenSlash}
      title="Insert structure (⌘/ or Ctrl+/)"
      aria-label="Insert structure"
    >
      <svg class="insert-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <span class="insert-text">Insert</span>
    </button>

    <button
      type="button"
      class="action-btn danger-btn"
      onclick={onClearBoard}
      title="Clear entire canvas"
    >
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
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
        <svg class="theme-icon sun-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      {:else}
        <svg class="theme-icon moon-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {/if}
    </button>

    <button
      type="button"
      class="icon-btn zen-btn"
      class:is-active={zenMode}
      onclick={onToggleZen}
      title={zenMode ? 'Exit Zen Mode (Z or Esc)' : 'Zen Mode (Z) — 100% Edge-to-Edge Paper'}
      aria-label="Toggle Zen Mode"
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {#if zenMode}
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <polyline points="14 20 14 14 20 14" />
          <polyline points="10 4 10 10 4 10" />
        {:else}
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <polyline points="21 15 21 21 15 21" />
          <polyline points="3 9 3 3 9 3" />
        {/if}
      </svg>
    </button>

    <button
      type="button"
      class="icon-btn help-btn"
      onclick={onOpenHelp}
      title="Guide & Keyboard Shortcuts"
      aria-label="Guide and keyboard shortcuts"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    </button>
  </div>
</header>

<style>
  .top {
    container-type: inline-size;
    container-name: topbar;
    flex: 0 0 auto;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    height: 42px;
    padding: 0 14px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 85%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    box-sizing: border-box;
    flex-wrap: nowrap;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  .brand-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 18%, var(--surface-2)), color-mix(in srgb, var(--accent-primary) 8%, var(--surface)));
    border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border));
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px var(--accent-primary-glow);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .brand-icon:hover {
    transform: scale(1.05);
    border-color: var(--accent-primary);
  }

  .logo {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  @media (max-width: 800px) {
    .logo {
      display: none;
    }
  }

  @container topbar (max-width: 800px) {
    .logo {
      display: none !important;
    }
  }

  .logo-title {
    font-family: var(--brand-display);
    font-weight: 700;
    font-size: 12.5px;
    line-height: 1.1;
    letter-spacing: -0.015em;
    color: var(--text-h);
    white-space: nowrap;
  }

  .logo-accent {
    color: var(--accent-primary);
    font-weight: 750;
  }

  .logo-tag {
    display: none;
    font-size: 9.5px;
    color: var(--muted);
    letter-spacing: 0.01em;
    white-space: nowrap;
    opacity: 0.72;
    padding-left: 6px;
    border-left: 1px solid var(--border);
  }

  @media (min-width: 1080px) {
    .logo-tag {
      display: inline;
    }
  }

  @container topbar (max-width: 1080px) {
    .logo-tag {
      display: none !important;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    flex-shrink: 0;
  }

  .divider-v {
    width: 1px;
    height: 18px;
    background: var(--border);
    margin: 0 1px;
    flex-shrink: 0;
  }

  .action-btn {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-h);
    font: 600 11px var(--sans);
    height: 28px;
    padding: 0 8px;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;
    box-shadow: var(--shadow-sm);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .action-btn:hover {
    background: var(--surface-2);
    border-color: var(--border-strong);
    transform: translateY(-1px);
  }

  .insert-btn {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    gap: 5px;
  }

  .insert-icon {
    color: var(--muted);
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .insert-text {
    color: var(--text-h);
    transition: color 0.15s ease;
  }

  .insert-btn:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .insert-btn:hover .insert-icon,
  .insert-btn:hover .insert-text {
    color: var(--accent-primary);
  }

  .insert-btn:hover .insert-icon {
    transform: scale(1.08);
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
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
  }

  .icon-btn:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .help-btn:hover,
  .zen-btn:hover {
    color: var(--accent-primary);
  }

  .zen-btn.is-active {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
  }

  .page-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0.5px;
    height: 28px;
    padding: 2px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
    box-sizing: border-box;
    min-width: 0;
  }

  .page-nav-btn {
    width: 17px;
    height: 22px;
    border-radius: 3px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-h);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.12s ease;
    padding: 0;
    flex-shrink: 0;
  }

  .page-nav-btn:hover:not(:disabled) {
    background: var(--surface);
    border-color: var(--border);
    color: var(--accent-primary);
  }

  .page-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-badge {
    display: flex;
    align-items: center;
    gap: 1.5px;
    padding: 0 1.5px;
    font-size: 10px;
    line-height: 1;
    user-select: none;
    min-width: 0;
  }

  .page-label {
    font-size: 9px;
    color: var(--muted);
    font-weight: 500;
    margin-right: 1px;
  }

  .page-current {
    font-weight: 700;
    color: var(--text-h);
    font-variant-numeric: tabular-nums;
  }

  .page-sep {
    font-weight: 400;
    color: var(--muted);
    opacity: 0.6;
    font-size: 9px;
    padding: 0 0.5px;
  }

  .page-total {
    font-weight: 500;
    color: var(--muted);
    font-size: 9px;
    font-variant-numeric: tabular-nums;
  }

  .page-divider {
    width: 1px;
    height: 13px;
    background: var(--border);
    margin: 0 1.5px;
    flex-shrink: 0;
  }

  .page-add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2.5px;
    height: 22px;
    padding: 0 5px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 9.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .page-add-btn svg {
    color: var(--muted);
    transition: color 0.15s ease;
  }

  .page-add-btn:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
  }

  .page-add-btn:hover svg {
    color: var(--accent-primary);
  }

  @media (max-width: 820px) {
    .page-label {
      display: none;
    }
  }

  @container topbar (max-width: 820px) {
    .page-label {
      display: none;
    }
  }

  @media (max-width: 760px) {
    .insert-text {
      display: none;
    }
    .insert-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      justify-content: center;
      gap: 0;
    }
    .page-add-text {
      display: none;
    }
    .page-add-btn {
      width: 22px;
      height: 22px;
      padding: 0;
    }
    .page-switcher {
      gap: 0.5px;
      padding: 1.5px;
    }
    .page-nav-btn {
      width: 15px;
    }
    .page-badge {
      padding: 0 0.5px;
      gap: 1px;
      font-size: 9.5px;
    }
    .page-divider {
      margin: 0 1px;
    }
  }

  @container topbar (max-width: 760px) {
    .insert-text {
      display: none;
    }
    .insert-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      justify-content: center;
      gap: 0;
    }
    .page-add-text {
      display: none;
    }
    .page-add-btn {
      width: 22px;
      height: 22px;
      padding: 0;
    }
    .page-switcher {
      gap: 0.5px;
      padding: 1.5px;
    }
    .page-nav-btn {
      width: 15px;
    }
    .page-badge {
      padding: 0 0.5px;
      gap: 1px;
      font-size: 9.5px;
    }
    .page-divider {
      margin: 0 1px;
    }
  }

  @media (max-width: 480px) {
    .top {
      padding: 0 8px;
      gap: 6px;
    }
    .actions {
      gap: 4px;
    }
    .divider-v {
      display: none;
    }
  }

  @container topbar (max-width: 480px) {
    .top {
      padding: 0 8px;
      gap: 6px;
    }
    .actions {
      gap: 4px;
    }
    .divider-v {
      display: none;
    }
  }
</style>
