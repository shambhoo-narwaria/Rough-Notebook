<script lang="ts">
  import type { CommandDef } from '@/library/commands/commands';

  type Props = {
    open: boolean;
    filter: string;
    commands: CommandDef[];
    active: number;
    onClose: () => void;
    onPick: (cmd: CommandDef) => void;
    onActiveChange: (i: number) => void;
  };

  let { open, filter, commands, active, onClose, onPick, onActiveChange }: Props = $props();

  function commandDescription(id: string): string {
    switch (id) {
      case 'autoCreate':
        return 'Parse raw text, JSON, or comma lists into widgets';
      case 'text':
        return 'Freeform note card with auto-wrapping & markdown lists';
      case 'lineBreak':
        return 'Full-width visual section divider guide';
      case 'array':
        return '1D indexed array with keyboard navigation';
      case 'matrix':
        return '2D row × col indexed matrix grid';
      default:
        return '';
    }
  }
</script>

{#if open}
  <div class="backdrop" role="presentation" onclick={onClose}></div>
  <div class="palette" role="listbox" aria-label="Insert block">
    <div class="palette-header">
      <div class="search-indicator">
        <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="9" r="6" />
          <line x1="13.5" y1="13.5" x2="18" y2="18" />
        </svg>
        <span class="search-prompt">/{filter}</span>
        <span class="cursor-blink"></span>
      </div>
      <div class="header-hint">
        <kbd class="kbd-hint">ESC</kbd> to close
      </div>
    </div>

    <div class="command-list">
      {#if commands.length === 0}
        <div class="empty">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span>No commands match “{filter}”</span>
        </div>
      {:else}
        {#each commands as cmd, i (cmd.id)}
          <button
            type="button"
            role="option"
            aria-selected={i === active}
            class="row"
            class:active={i === active}
            onmouseenter={() => onActiveChange(i)}
            onclick={() => onPick(cmd)}
          >
            <div class="cmd-icon-box" class:active-icon={i === active}>
              {#if cmd.id === 'autoCreate'}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              {:else if cmd.id === 'array'}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="10" rx="2" />
                  <line x1="7" y1="7" x2="7" y2="17" />
                  <line x1="12" y1="7" x2="12" y2="17" />
                  <line x1="17" y1="7" x2="17" y2="17" />
                </svg>
              {:else if cmd.id === 'matrix'}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
              {:else if cmd.id === 'text'}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              {:else}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
              {/if}
            </div>

            <div class="cmd-info">
              <div class="cmd-title-row">
                <span class="title">{cmd.title}</span>
                <span class="cmd-tag">/{cmd.id}</span>
              </div>
              <span class="cmd-desc">{commandDescription(cmd.id)}</span>
            </div>

            {#if i === active}
              <kbd class="enter-badge" aria-hidden="true">↵</kbd>
            {/if}
          </button>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--help-overlay);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: fadeIn 0.12s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes dropDown {
    from {
      opacity: 0;
      transform: translate(-50%, -8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }
  }

  .palette {
    position: fixed;
    z-index: 60;
    left: 50%;
    top: 18%;
    transform: translateX(-50%);
    width: min(480px, calc(100vw - 32px));
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 0;
    overflow: hidden;
    animation: dropDown 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .palette-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface-2);
  }

  .search-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--accent-primary);
  }

  .search-prompt {
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--text-h);
  }

  .cursor-blink {
    width: 2px;
    height: 15px;
    background: var(--accent-primary);
    animation: blink 1s step-start infinite;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  .header-hint {
    font-size: 11px;
    color: var(--muted);
  }

  .kbd-hint {
    font-family: var(--mono);
    padding: 1px 5px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted-2);
  }

  .command-list {
    padding: 8px;
    max-height: min(55vh, 420px);
    overflow: auto;
  }

  .row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text);
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .row:hover,
  .active {
    background: color-mix(in srgb, var(--accent-primary) 8%, var(--surface-2));
    border-color: color-mix(in srgb, var(--accent-primary) 22%, transparent);
  }

  .cmd-icon-box {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent-primary) 10%, var(--surface-2));
    border: 1px solid color-mix(in srgb, var(--accent-primary) 22%, var(--border));
    color: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.12s ease;
  }

  .active-icon {
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    color: var(--accent-primary-text, #ffffff);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .cmd-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cmd-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title {
    font: 600 13.5px var(--sans);
    color: var(--text-h);
  }

  .cmd-tag {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted-2);
  }

  .cmd-desc {
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .enter-badge {
    font-family: var(--mono);
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 5px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--accent-primary);
    box-shadow: var(--shadow-sm);
  }

  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 28px 16px;
    font-size: 13px;
    color: var(--muted);
  }
</style>
