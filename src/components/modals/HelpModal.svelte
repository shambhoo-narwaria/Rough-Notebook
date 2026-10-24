<script lang="ts">
  let { open, onClose }: { open: boolean; onClose: () => void } = $props();
</script>

{#if open}
  <div class="dim-back" role="presentation" onclick={onClose}></div>
  <div class="help-panel" role="dialog" aria-modal="true" aria-labelledby="help-title">
    <div class="help-header">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="2" x2="8" y2="22" />
            <line x1="12" y1="7" x2="18" y2="7" />
            <line x1="12" y1="11" x2="18" y2="11" />
            <line x1="12" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <div>
          <h2 id="help-title" class="help-title">Rough Notebook</h2>
          <p class="help-subtitle">High-velocity whiteboard for coding interviews & LeetCode problems</p>
        </div>
      </div>
      <button type="button" class="icon-btn-close" onclick={onClose} aria-label="Close dialog">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <section class="help-about" aria-labelledby="about-h">
      <div class="about-card">
        <p class="help-p">
          Rough Notebook is a freeform digital workspace where you can reason through a coding problem as naturally as you would on rough paper — with structured objects for arrays, matrices, and notes, all driven from the keyboard.
        </p>
        <div class="about-links">
          <a class="github-badge" href="https://github.com/shambhoo-narwaria/Rough-Notebook" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub Repository</span>
          </a>
        </div>
      </div>
    </section>

    <h3 class="help-sub">Keyboard Shortcuts & Commands</h3>
    <div class="help-table-wrap">
      <table class="help-table">
        <thead>
          <tr>
            <th scope="col">Action</th>
            <th scope="col">Command / Shortcut</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="topic-td"><span class="badge-topic">Insert Menu</span></td>
            <td><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>/</kbd></td>
            <td>Open command palette to insert arrays, matrices, notes, or dividers.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Quick Note</span></td>
            <td>Double-click canvas</td>
            <td>Spawn a frictionless note block directly under your cursor.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Smart Auto Create</span></td>
            <td>Paste in Auto Create</td>
            <td>Convert lists like <code class="help-code">[1,2,3]</code> or <code class="help-code">[[1,2],[3,4]]</code> automatically into widgets.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Quick Tools Wheel</span></td>
            <td>Click empty canvas</td>
            <td>Open 4-tool radial wheel for Note, Array, Matrix, or Pen.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Pen Layer</span></td>
            <td><kbd>P</kbd> or Pen button</td>
            <td>Toggle drawing mode. Select colors (Ink, Red, Green, Blue) and sketch freehand.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Structure Context</span></td>
            <td>Right-click structure</td>
            <td>Add/remove cells, insert rows/cols, or remove block.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Cell Navigation</span></td>
            <td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td>
            <td>Navigate across 1D/2D cells seamlessly.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Copy & Paste</span></td>
            <td><kbd>⌘/Ctrl</kbd> + <kbd>C</kbd> / <kbd>V</kbd></td>
            <td>Duplicate the selected structure block to the canvas cursor point.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Undo & Redo</span></td>
            <td><kbd>⌘/Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Shift</kbd>+<kbd>Z</kbd></td>
            <td>Undo or redo edits (canvas items when pen is off, pen strokes when pen is on).</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Delete Structure</span></td>
            <td><kbd>Delete</kbd> or <kbd>Backspace</kbd></td>
            <td>Removes the active structure when not actively typing inside a cell.</td>
          </tr>
          <tr>
            <td class="topic-td"><span class="badge-topic">Section Labels</span></td>
            <td>Double-click bottom strip</td>
            <td>Add or edit a centered caption label on any array, matrix, or line break.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="dim-actions">
      <button type="button" class="btn primary-btn" onclick={onClose}>Got it</button>
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

  .help-panel {
    position: fixed;
    z-index: 70;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(680px, calc(100vw - 32px));
    max-height: min(85vh, 700px);
    overflow: auto;
    padding: 26px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-strong);
    background: var(--surface);
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .help-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
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
  }

  .help-title {
    margin: 0;
    font: 800 19px/1.2 var(--sans);
    color: var(--text-h);
    letter-spacing: -0.02em;
  }

  .help-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--muted);
  }

  .icon-btn-close {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--muted);
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .icon-btn-close:hover {
    background: var(--surface-3);
    color: var(--accent-primary);
    border-color: color-mix(in srgb, var(--accent-primary) 40%, var(--border));
  }

  .about-card {
    padding: 14px 16px;
    border-radius: var(--radius-md);
    background: var(--surface-2);
    border: 1px solid var(--border);
    margin-bottom: 22px;
  }

  .help-p {
    margin: 0 0 12px;
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--text);
  }

  .about-links {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .github-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font: 600 12px var(--sans);
    padding: 5px 10px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-h);
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .github-badge:hover {
    border-color: var(--border-strong);
    color: var(--accent-primary);
  }

  .help-sub {
    margin: 0 0 10px;
    font: 700 12px var(--sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-2);
  }

  .help-table-wrap {
    overflow-x: auto;
    margin-bottom: 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background: var(--surface);
  }

  .help-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    line-height: 1.5;
  }

  .help-table th,
  .help-table td {
    padding: 10px 14px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid var(--border);
  }

  .help-table th {
    font: 700 11px var(--sans);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    background: var(--surface-2);
  }

  .help-table tr:last-child td {
    border-bottom: none;
  }

  .badge-topic {
    font-weight: 600;
    color: var(--text-h);
    white-space: nowrap;
  }

  .help-table kbd {
    font: 600 11px var(--mono);
    padding: 2px 6px;
    border-radius: 5px;
    border: 1px solid var(--border-strong);
    background: var(--surface-2);
    color: var(--accent-cyan);
    white-space: nowrap;
  }

  .help-table .help-code {
    font: 600 11px var(--mono);
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--surface-2);
    color: var(--accent-primary);
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
