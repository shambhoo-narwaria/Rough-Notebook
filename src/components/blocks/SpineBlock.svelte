<script lang="ts">
  import { registerBlockRoot } from '@/library/focus/focusRegistry';
  import type { PlacedBlock } from '@/library/state/document.svelte';

  type Props = { block: PlacedBlock & { type: 'spine' } };
  let { block }: Props = $props();

  let root: HTMLDivElement | null = $state(null);

  $effect(() => {
    registerBlockRoot(block.id, root);
    return () => registerBlockRoot(block.id, null);
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={root}
  class="spine"
  role="separator"
  aria-orientation="horizontal"
  aria-label="Line break"
  tabindex="0"
>
  <div class="line" aria-hidden="true"></div>
</div>

<style>
  .spine {
    outline: none;
    padding: 12px 0;
    margin: 0;
    box-sizing: border-box;
  }

  .line {
    height: 2px;
    border-radius: var(--radius-pill);
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--accent-cyan) 30%, transparent) 15%,
      var(--accent-primary) 50%,
      color-mix(in srgb, var(--accent-cyan) 30%, transparent) 85%,
      transparent 100%
    );
    box-shadow: 0 0 10px var(--accent-primary-glow);
  }
</style>
