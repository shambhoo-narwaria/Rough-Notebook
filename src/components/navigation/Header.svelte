<script lang="ts">
  import { tick } from 'svelte';
  import PenRadialMenu from '@/components/canvas/PenRadialMenu.svelte';
  import type { PenColorKey } from '@/library/handwriting/penColor';
  import type { NotebookPage } from '@/library/state/notebookPages.svelte';
  import type { ThemeMode } from '@/library/theme/theme';

  type Props = {
    penActive: boolean;
    penColorKey: PenColorKey;
    dark: boolean;
    themeMode?: ThemeMode;
    currentPageIndex: number;
    totalPages: number;
    pages: NotebookPage[];
    onPrevPage: () => void;
    onNextPage: () => void;
    onNewPage: () => void;
    onSwitchPage: (index: number) => void;
    onRenamePage: (index: number, title: string) => void;
    onDeletePage: (index: number) => void;
    onTogglePen: () => void;
    onPickColor: (k: PenColorKey) => void;
    onClearSketches: () => void;
    onOpenSlash: () => void;
    onClearBoard: () => void;
    onToggleTheme: () => void;
    onOpenHelp: () => void;
  };

  let {
    penActive,
    penColorKey,
    dark,
    themeMode = 'light',
    currentPageIndex,
    totalPages,
    pages,
    onPrevPage,
    onNextPage,
    onNewPage,
    onSwitchPage,
    onRenamePage,
    onDeletePage,
    onTogglePen,
    onPickColor,
    onClearSketches,
    onOpenSlash,
    onClearBoard,
    onToggleTheme,
    onOpenHelp,
  }: Props = $props();

  let dropdownOpen = $state(false);
  let isRenaming = $state(false);
  let editTitle = $state('');
  let editInputEl: HTMLInputElement | null = $state(null);
  let breadcrumbEl: HTMLDivElement | null = $state(null);

  const activeTitle = $derived(pages[currentPageIndex]?.title || `Page ${currentPageIndex + 1}`);

  function startRename() {
    editTitle = activeTitle;
    isRenaming = true;
    dropdownOpen = false;
    void tick().then(() => {
      editInputEl?.focus();
      editInputEl?.select();
    });
  }

  function finishRename() {
    if (!isRenaming) return;
    isRenaming = false;
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== activeTitle) {
      onRenamePage(currentPageIndex, trimmed);
    }
  }

  function cancelRename() {
    isRenaming = false;
  }

  $effect(() => {
    if (!dropdownOpen) return;
    function onDocClick(e: MouseEvent) {
      if (breadcrumbEl && !breadcrumbEl.contains(e.target as Node)) {
        dropdownOpen = false;
      }
    }
    document.addEventListener('pointerdown', onDocClick, true);
    return () => document.removeEventListener('pointerdown', onDocClick, true);
  });
</script>

<header class="top">
  <div class="left-section">
    <div class="brand">
      <div class="brand-icon" title="Rough Notebook" aria-label="Rough Notebook">
        <img src="./favicon.svg" alt="Rough Notebook" class="brand-img" width="22" height="22" />
      </div>
      <span class="logo" aria-label="Rough Notebook">
        <span class="logo-title">Rough<span class="logo-accent"> Notebook</span></span>
      </span>
      <span class="logo-tag">Think it. Trace it. Solve it.</span>
    </div>

    <!-- Dynamic Page Breadcrumb & Switcher -->
    <div class="page-breadcrumb" bind:this={breadcrumbEl}>
      <span class="breadcrumb-sep" aria-hidden="true">/</span>

      {#if isRenaming}
        <input
          bind:this={editInputEl}
          type="text"
          class="page-rename-input"
          bind:value={editTitle}
          onblur={finishRename}
          onkeydown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              finishRename();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancelRename();
            }
          }}
          onkeyup={(e) => e.stopPropagation()}
          onkeypress={(e) => e.stopPropagation()}
          aria-label="Rename active sheet"
        />
      {:else}
        <div class="page-pill" class:is-open={dropdownOpen}>
          <!-- Click title to toggle dropdown menu / double click to rename -->
          <button
            type="button"
            class="page-title-btn"
            onclick={() => (dropdownOpen = !dropdownOpen)}
            ondblclick={(e) => {
              e.stopPropagation();
              startRename();
            }}
            title="Click to switch or manage pages (Double-click to rename)"
            aria-expanded={dropdownOpen}
          >
            <!-- Full Title shown when space permits -->
            <span class="full-title">
              <span class="page-name">{activeTitle}</span>
              <svg class="dropdown-chevron" viewBox="0 0 20 20" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 8 10 12 14 8" />
              </svg>
            </span>

            <!-- Compact [< 1/3 > | +] badge shown when space is restricted -->
            <span class="compact-badge">
              <span class="compact-num">{currentPageIndex + 1}/{totalPages}</span>
              <svg class="dropdown-chevron" viewBox="0 0 20 20" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 8 10 12 14 8" />
              </svg>
            </span>
          </button>

          <!-- Navigation arrow buttons -->
          <div class="nav-arrows">
            <button
              type="button"
              class="arrow-btn"
              disabled={currentPageIndex === 0}
              onclick={onPrevPage}
              title="Previous page (Alt+[)"
              aria-label="Previous page"
            >
              <svg viewBox="0 0 20 20" width="10.5" height="10.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="12 15 7 10 12 5" />
              </svg>
            </button>

            <button
              type="button"
              class="arrow-btn"
              disabled={currentPageIndex === totalPages - 1}
              onclick={onNextPage}
              title="Next page (Alt+])"
              aria-label="Next page"
            >
              <svg viewBox="0 0 20 20" width="10.5" height="10.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="8 5 13 10 8 15" />
              </svg>
            </button>
          </div>

          <div class="pill-divider" aria-hidden="true"></div>

          <!-- Add new page button -->
          <button
            type="button"
            class="pill-add-btn"
            onclick={onNewPage}
            title="New clean rough page (Alt+N)"
            aria-label="New clean rough page"
          >
            <svg viewBox="0 0 20 20" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="10" y1="4" x2="10" y2="16" />
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
          </button>
        </div>
      {/if}

      <!-- Page Switcher & Manager Dropdown Menu -->
      {#if dropdownOpen}
        <div class="page-dropdown-menu" role="menu">
          <div class="dropdown-header">
            <span class="dropdown-header-title">Rough Sheets ({totalPages})</span>
            <button type="button" class="rename-trigger-btn" onclick={startRename} title="Rename active sheet">
              Rename
            </button>
          </div>

          <div class="dropdown-list">
            {#each pages as page, idx (page.id)}
              <div class="dropdown-item" class:is-active={idx === currentPageIndex}>
                <button
                  type="button"
                  class="item-select-btn"
                  onclick={() => {
                    dropdownOpen = false;
                    onSwitchPage(idx);
                  }}
                >
                  <span class="item-index">{idx + 1}.</span>
                  <span class="item-title">{page.title}</span>
                  {#if idx === currentPageIndex}
                    <span class="active-indicator" aria-label="Current active page">•</span>
                  {/if}
                </button>

                {#if totalPages > 1}
                  <button
                    type="button"
                    class="item-delete-btn"
                    onclick={() => {
                      onDeletePage(idx);
                    }}
                    title={`Delete ${page.title}`}
                    aria-label={`Delete ${page.title}`}
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>

          <button
            type="button"
            class="dropdown-add-btn"
            onclick={() => {
              dropdownOpen = false;
              onNewPage();
            }}
          >
            <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="10" y1="4" x2="10" y2="16" />
              <line x1="4" y1="10" x2="16" y2="10" />
            </svg>
            <span>Add Clean Page (Alt+N)</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="actions">
    <PenRadialMenu
      {penActive}
      {penColorKey}
      {dark}
      {themeMode}
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
      aria-label="Clear entire canvas"
    >
      <svg class="clear-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
      <span class="clear-text">Clear</span>
    </button>

    <div class="divider-v" aria-hidden="true"></div>

    <button
      type="button"
      class="icon-btn theme-btn"
      onclick={onToggleTheme}
      title={themeMode === 'light'
        ? 'Theme: Light (Clean Canvas) — Click for Paper Mode'
        : themeMode === 'paper'
          ? 'Theme: Paper Mode (Natural Ivory) — Click for Dark Mode'
          : 'Theme: Dark Mode (Obsidian) — Click for Light Mode'}
      aria-label={`Current theme is ${themeMode}. Click to toggle next theme.`}
    >
      {#if themeMode === 'paper'}
        <!-- Paper Scroll / Sheet Icon -->
        <svg class="theme-icon paper-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
      {:else if themeMode === 'dark' || dark}
        <!-- Moon Icon -->
        <svg class="theme-icon moon-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {:else}
        <!-- Sun Icon -->
        <svg class="theme-icon sun-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
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

  .left-section {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    min-width: 0;
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
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: transparent;
    border: none;
    outline: none;
    box-shadow: none;
    transition: transform 0.2s ease, filter 0.2s ease;
    flex-shrink: 0;
    overflow: hidden;
  }

  .brand-icon:hover {
    transform: scale(1.08);
    filter: drop-shadow(0 2px 8px var(--accent-primary-glow));
  }

  .brand-img {
    width: 22px;
    height: 22px;
    display: block;
    object-fit: cover;
    border-radius: 6px;
    border: none;
    outline: none;
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
    font-weight: 750;
    font-size: 13.5px;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--text-h);
    white-space: nowrap;
    transition: color 0.15s ease;
  }

  .logo-accent {
    color: var(--brand-name-accent, #652EB2);
    font-weight: 800;
    transition: color 0.15s ease;
  }

  .brand:hover .logo-accent {
    color: var(--brand-name-accent-hover, #521F9A);
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

  @media (min-width: 1120px) {
    .logo-tag {
      display: inline;
    }
  }

  @container topbar (max-width: 1120px) {
    .logo-tag {
      display: none !important;
    }
  }

  /* ── Dynamic Page Breadcrumb & Pill ───────────────────────────────────── */
  .page-breadcrumb {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .breadcrumb-sep {
    font-size: 12px;
    color: var(--border-strong);
    user-select: none;
  }

  .page-rename-input {
    height: 26px;
    padding: 0 8px;
    font: 600 11.5px/1 var(--sans);
    color: var(--text-h);
    background: var(--surface);
    border: 1px solid var(--accent-primary);
    border-radius: 6px;
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-primary-glow);
    max-width: 160px;
    box-sizing: border-box;
  }

  .page-pill {
    display: inline-flex;
    align-items: center;
    gap: 1px;
    height: 28px;
    padding: 2px 3px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: var(--shadow-sm);
    box-sizing: border-box;
    transition: all 0.15s ease;
  }

  .page-pill:hover,
  .page-pill.is-open {
    border-color: var(--border-strong);
    background: var(--surface);
  }

  .page-title-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 5px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--text-h);
    font: 600 11.5px/1 var(--sans);
    cursor: pointer;
    transition: all 0.12s ease;
    max-width: 170px;
    user-select: none;
  }

  .page-title-btn:hover {
    background: var(--surface-2);
    color: var(--accent-primary);
  }

  .full-title {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
  }

  .page-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 130px;
  }

  .compact-badge {
    display: none;
    align-items: center;
    gap: 3px;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 11px;
  }

  .dropdown-chevron {
    color: var(--muted);
    transition: transform 0.15s ease;
    flex-shrink: 0;
  }

  .page-pill.is-open .dropdown-chevron {
    transform: rotate(180deg);
  }

  .nav-arrows {
    display: flex;
    align-items: center;
    gap: 0.5px;
  }

  .arrow-btn {
    width: 18px;
    height: 22px;
    border-radius: 3px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-h);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.12s ease;
  }

  .arrow-btn:hover:not(:disabled) {
    background: var(--surface-2);
    border-color: var(--border);
    color: var(--accent-primary);
  }

  .arrow-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pill-divider {
    width: 1px;
    height: 14px;
    background: var(--border);
    margin: 0 2px;
  }

  .pill-add-btn {
    width: 20px;
    height: 22px;
    border-radius: 3px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.12s ease;
  }

  .pill-add-btn:hover {
    background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
    color: var(--accent-primary-hover, var(--accent-primary));
  }

  /* ── Responsive Compact Switch ────────────────────────────────────────── */
  @media (max-width: 900px) {
    .breadcrumb-sep {
      display: none;
    }
    .full-title {
      display: none;
    }
    .compact-badge {
      display: inline-flex;
    }
  }

  @container topbar (max-width: 900px) {
    .breadcrumb-sep {
      display: none !important;
    }
    .full-title {
      display: none !important;
    }
    .compact-badge {
      display: inline-flex !important;
    }
  }

  /* ── Page Dropdown Menu ───────────────────────────────────────────────── */
  .page-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 250;
    min-width: 210px;
    max-width: 260px;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    box-shadow: var(--shadow), 0 8px 24px rgba(0, 0, 0, 0.15);
    padding: 5px;
    box-sizing: border-box;
    animation: dropIn 0.12s ease-out;
  }

  @keyframes dropIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 6px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }

  .dropdown-header-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .rename-trigger-btn {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--accent-primary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 1px 4px;
    border-radius: 3px;
    transition: all 0.12s ease;
  }

  .rename-trigger-btn:hover {
    background: var(--surface-2);
  }

  .dropdown-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 200px;
    overflow-y: auto;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 5px;
    transition: background 0.12s ease;
  }

  .dropdown-item:hover {
    background: var(--surface-2);
  }

  .dropdown-item.is-active {
    background: color-mix(in srgb, var(--accent-primary) 10%, var(--surface));
  }

  .item-select-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 6px;
    background: transparent;
    border: none;
    font: 500 12px/1.2 var(--sans);
    color: var(--text-h);
    cursor: pointer;
    text-align: left;
    min-width: 0;
  }

  .item-index {
    color: var(--muted);
    font-size: 10.5px;
    font-family: var(--mono);
    flex-shrink: 0;
  }

  .item-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .active-indicator {
    color: var(--accent-primary);
    font-size: 14px;
    line-height: 1;
    margin-left: auto;
  }

  .item-delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    border-radius: 3px;
    padding: 0;
    margin-right: 4px;
    opacity: 0.6;
    transition: all 0.12s ease;
  }

  .item-delete-btn:hover {
    opacity: 1;
    color: var(--accent-r);
    background: color-mix(in srgb, var(--accent-r) 10%, transparent);
  }

  .dropdown-add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    margin-top: 4px;
    padding: 6px 8px;
    border-radius: 5px;
    border: 1px dashed var(--border-strong);
    background: transparent;
    font: 600 11px/1 var(--sans);
    color: var(--accent-primary);
    cursor: pointer;
    transition: all 0.12s ease;
    justify-content: center;
  }

  .dropdown-add-btn:hover {
    background: color-mix(in srgb, var(--accent-primary) 8%, var(--surface));
    border-color: var(--accent-primary);
  }

  /* ── Right Actions ────────────────────────────────────────────────────── */
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
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    gap: 5px;
  }

  .clear-icon {
    color: var(--muted);
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .clear-text {
    color: var(--text-h);
    transition: color 0.15s ease;
  }

  .danger-btn:hover {
    background: color-mix(in srgb, var(--accent-r) 10%, var(--surface));
    color: var(--accent-r);
    border-color: color-mix(in srgb, var(--accent-r) 45%, var(--border));
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-r) 25%, transparent);
  }

  .danger-btn:hover .clear-icon,
  .danger-btn:hover .clear-text {
    color: var(--accent-r);
  }

  .danger-btn:hover .clear-icon {
    transform: scale(1.08);
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

  .help-btn:hover {
    color: var(--accent-primary);
  }

  @media (max-width: 760px) {
    .insert-text,
    .clear-text {
      display: none;
    }
    .insert-btn,
    .danger-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      justify-content: center;
      gap: 0;
    }
  }

  @container topbar (max-width: 760px) {
    .insert-text,
    .clear-text {
      display: none;
    }
    .insert-btn,
    .danger-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      justify-content: center;
      gap: 0;
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
