<script lang="ts">
  type Props = {
    currentPageIndex: number;
    totalPages: number;
    onPrevPage: () => void;
    onNextPage: () => void;
    onNewPage: () => void;
  };

  let {
    currentPageIndex,
    totalPages,
    onPrevPage,
    onNextPage,
    onNewPage,
  }: Props = $props();
</script>

<nav class="bottom-page-bar" aria-label="Rough notebook pages">
  <button
    type="button"
    class="page-btn nav-btn"
    disabled={currentPageIndex === 0}
    onclick={onPrevPage}
    title="Previous page (Alt+[)"
    aria-label="Previous page"
  >
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="12 15 7 10 12 5" />
    </svg>
  </button>

  <div class="page-indicator" aria-live="polite">
    <span class="page-text">Page {currentPageIndex + 1} of {totalPages}</span>
  </div>

  <div class="right-actions">
    <button
      type="button"
      class="page-btn nav-btn"
      disabled={currentPageIndex === totalPages - 1}
      onclick={onNextPage}
      title="Next page (Alt+])"
      aria-label="Next page"
    >
      <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="8 5 13 10 8 15" />
      </svg>
    </button>

    <button
      type="button"
      class="page-btn add-btn"
      onclick={onNewPage}
      title="New clean rough page (Alt+N)"
      aria-label="New clean rough page"
    >
      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <line x1="10" y1="4" x2="10" y2="16" />
        <line x1="4" y1="10" x2="16" y2="10" />
      </svg>
    </button>
  </div>
</nav>

<style>
  .bottom-page-bar {
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 45;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 4px 6px;
    min-width: 270px;
    box-sizing: border-box;
    border-radius: var(--radius-lg, 10px);
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: var(--shadow-sm), 0 4px 20px rgba(0, 0, 0, 0.08);
    user-select: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .bottom-page-bar:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow), 0 6px 24px rgba(0, 0, 0, 0.12);
  }

  .page-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    font: 500 12.5px/1 var(--sans);
    color: var(--muted);
    letter-spacing: 0.01em;
    padding: 0 4px;
    white-space: nowrap;
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .page-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .nav-btn {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-h);
    box-shadow: var(--shadow-sm);
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--surface-2);
    border-color: var(--border-strong);
    color: var(--accent-primary);
    transform: translateY(-1px);
  }

  .nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    border-color: transparent;
    background: transparent;
    box-shadow: none;
  }

  .add-btn {
    border: 1px solid var(--accent-primary);
    background: var(--accent-primary);
    color: #ffffff;
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .add-btn:hover {
    background: var(--accent-primary-hover, #6D28D9);
    border-color: var(--accent-primary-hover, #6D28D9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--accent-primary-glow);
  }

  .add-btn:active {
    transform: scale(0.94);
  }

  @media (max-width: 640px) {
    .bottom-page-bar {
      bottom: 12px;
      min-width: 240px;
      gap: 12px;
      padding: 3px 5px;
    }
  }
</style>
