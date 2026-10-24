<script lang="ts">
  import { tick } from "svelte";
  import {
    doc,
    moveBlock,
    pushUndoPoint,
    clearSelection,
    placeBlockAt,
    createNoteBlock,
    createArrayBlock,
    createMatrixBlock,
    removeBlock,
    type PlacedBlock,
  } from "@/library/state/document.svelte";
  import {
    sketchStrokes,
    appendSketchStroke,
    clearAllSketches,
    autoHandwritingActive,
    removeStrokesByIds,
    registerHandwritingConversion,
  } from "@/library/state/sketches.svelte";
  import { recognizeHandwritingStrokes } from "@/library/handwriting/handwritingRecognizer";
  import { resolveNonOverlapForBlock } from "@/library/layout/layoutResolve";
  import NoteBlock from "@/components/blocks/NoteBlock.svelte";
  import ArrayBlock from "@/components/blocks/ArrayBlock.svelte";
  import MatrixBlock from "@/components/blocks/MatrixBlock.svelte";
  import SpineBlock from "@/components/blocks/SpineBlock.svelte";
  import StructureMenu from "./StructureMenu.svelte";
  import CanvasRadialMenu from "./CanvasRadialMenu.svelte";
  import { focusBlockRoot } from "@/library/focus/focusRegistry";

  type Props = {
    penActive?: boolean;
    handActive?: boolean;
    penStrokeColor?: string;
    onSlash?: () => void;
    onTogglePen?: () => void;
    onToggleHand?: () => void;
    onEmptyContextMenu: (pos: { x: number; y: number }) => void;
    onOpenAutoCreate?: (pos: { x: number; y: number }) => void;
  };

  let {
    penActive = false,
    handActive = false,
    penStrokeColor = "#12141a",
    onSlash,
    onTogglePen,
    onToggleHand,
    onEmptyContextMenu,
    onOpenAutoCreate,
  }: Props = $props();

  let canvasEl: HTMLDivElement | null = $state(null);
  let isPanning = $state(false);
  let panStartX = 0;
  let panStartY = 0;
  let panStartScrollLeft = 0;
  let panStartScrollTop = 0;

  function onWindowPointerMove(e: PointerEvent) {
    if (isPanning && canvasEl) {
      canvasEl.scrollLeft = panStartScrollLeft - (e.clientX - panStartX);
      canvasEl.scrollTop = panStartScrollTop - (e.clientY - panStartY);
    }
  }

  function onWindowPointerUp() {
    if (isPanning) {
      isPanning = false;
    }
  }

  let structureMenu = $state<{ id: string; left: number; top: number } | null>(
    null,
  );

  let drag = $state<{
    id: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);

  let noteDragPrep = $state<{
    id: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    ax: number;
    ay: number;
    ta: HTMLTextAreaElement;
  } | null>(null);

  let cellDragPrep = $state<{
    id: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    ax: number;
    ay: number;
    inp: HTMLInputElement;
  } | null>(null);

  let sketchLive = $state<{
    points: { x: number; y: number }[];
    color: string;
  } | null>(null);

  let captionEditingId = $state<string | null>(null);
  let captionDraft = $state("");

  let pendingHandwritingStrokeIds: string[] = [];
  let handwritingDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isRecognizingHandwriting = $state(false);

  $effect(() => {
    const onClear = () => {
      clearAllSketches();
      sketchLive = null;
      pendingHandwritingStrokeIds = [];
      if (handwritingDebounceTimer) {
        clearTimeout(handwritingDebounceTimer);
        handwritingDebounceTimer = null;
      }
    };
    window.addEventListener("leetpad-clear-sketches", onClear);
    return () => {
      window.removeEventListener("leetpad-clear-sketches", onClear);
      if (handwritingDebounceTimer) {
        clearTimeout(handwritingDebounceTimer);
        handwritingDebounceTimer = null;
      }
    };
  });

  $effect(() => {
    if (!penActive) sketchLive = null;
  });

  $effect(() => {
    const p = noteDragPrep;
    if (!p) return;
    const thresh = 6;
    const thresh2 = thresh * thresh;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - p.ax;
      const dy = e.clientY - p.ay;
      if (dx * dx + dy * dy >= thresh2) {
        pushUndoPoint();
        drag = { id: p.id, sx: p.sx, sy: p.sy, ox: p.ox, oy: p.oy };
        noteDragPrep = null;
      }
    };
    const onUp = () => {
      const cur = noteDragPrep;
      if (cur) {
        cur.ta.focus();
        noteDragPrep = null;
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  });

  $effect(() => {
    const c = cellDragPrep;
    if (!c) return;
    const thresh = 6;
    const thresh2 = thresh * thresh;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - c.ax;
      const dy = e.clientY - c.ay;
      if (dx * dx + dy * dy >= thresh2) {
        pushUndoPoint();
        drag = { id: c.id, sx: c.sx, sy: c.sy, ox: c.ox, oy: c.oy };
        c.inp.blur();
        cellDragPrep = null;
      }
    };
    const onUp = () => {
      const cur = cellDragPrep;
      if (cur) {
        cur.inp.focus();
        cellDragPrep = null;
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  });

  $effect(() => {
    if (!drag) return;
    const { id, sx, sy, ox, oy } = drag;
    const onMove = (e: PointerEvent) => {
      moveBlock(id, ox + (e.clientX - sx), oy + (e.clientY - sy));
    };
    const onUp = () => {
      const doneId = id;
      drag = null;
      if (canvasEl && doneId) {
        void resolveNonOverlapForBlock(canvasEl, doneId);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  });

  $effect(() => {
    const onResolve = (e: CustomEvent<{ blockId: string }>) => {
      const id = e.detail?.blockId;
      if (!id || !canvasEl) return;
      void resolveNonOverlapForBlock(canvasEl, id);
    };
    window.addEventListener(
      "leetpad-resolve-overlap",
      onResolve as EventListener,
    );
    return () =>
      window.removeEventListener(
        "leetpad-resolve-overlap",
        onResolve as EventListener,
      );
  });

  $effect(() => {
    void penActive;
    const openMenu = (e: CustomEvent<{ id: string }>) => {
      if (penActive && !autoHandwritingActive.value) return;
      const id = e.detail?.id;
      if (!id || !canvasEl) return;
      const el = canvasEl.querySelector(`[data-block-id="${id}"]`);
      const r = el?.getBoundingClientRect();
      if (r) {
        structureMenu = { id, left: r.left + 8, top: r.bottom + 6 };
      } else {
        structureMenu = { id, left: window.innerWidth / 2 - 130, top: 120 };
      }
    };
    window.addEventListener(
      "leetpad-open-structure-menu",
      openMenu as EventListener,
    );
    return () =>
      window.removeEventListener(
        "leetpad-open-structure-menu",
        openMenu as EventListener,
      );
  });

  $effect(() => {
    const sm = structureMenu;
    if (!sm) return;
    if (!doc.blocks.some((b) => b.id === sm.id)) structureMenu = null;
  });

  function canvasContentPoint(
    e: PointerEvent,
  ): { x: number; y: number } | null {
    if (!canvasEl) return null;
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + canvasEl.scrollLeft,
      y: e.clientY - rect.top + canvasEl.scrollTop,
    };
  }

  function canvasPointFromClient(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | null {
    if (!canvasEl) return null;
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: clientX - rect.left + canvasEl.scrollLeft,
      y: clientY - rect.top + canvasEl.scrollTop,
    };
  }

  function surfacePoint(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | null {
    const surface = canvasEl?.querySelector(
      ".canvas-surface",
    ) as HTMLElement | null;
    if (!surface) return null;
    const sr = surface.getBoundingClientRect();
    return { x: clientX - sr.left, y: clientY - sr.top };
  }

  function onSurfaceContextMenu(e: MouseEvent) {
    if (penActive) {
      e.preventDefault();
      return;
    }
    if (!canvasEl) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-placed-root]")) return;
    e.preventDefault();
    const rect = canvasEl.getBoundingClientRect();
    onEmptyContextMenu({
      x: e.clientX - rect.left + canvasEl.scrollLeft,
      y: e.clientY - rect.top + canvasEl.scrollTop,
    });
  }

  function startDrag(blockId: string, e: PointerEvent) {
    if (penActive && !autoHandwritingActive.value) return;
    const node = doc.blocks.find((b) => b.id === blockId);
    if (!node) return;
    doc.selectedBlockId = blockId;
    doc.cellLinearFocus = null;
    pushUndoPoint();
    drag = {
      id: blockId,
      sx: e.clientX,
      sy: e.clientY,
      ox: node.x,
      oy: node.y,
    };
  }

  function blockIdUnderClientPoint(cx: number, cy: number): string | null {
    if (!canvasEl) return null;
    for (const block of doc.blocks) {
      const el = canvasEl.querySelector(`[data-block-id="${block.id}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom)
        return block.id;
    }
    return null;
  }

  function placedRootInteractions(node: HTMLElement, blockId: string) {
    const onCtx = (e: MouseEvent) => {
      if (penActive && !autoHandwritingActive.value) return;
      const b = doc.blocks.find((x) => x.id === blockId);
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      doc.insertAnchor = null;
      doc.selectedBlockId = blockId;
      doc.cellLinearFocus = null;
      structureMenu = { id: blockId, left: e.clientX, top: e.clientY };
    };

    const cap = (e: PointerEvent) => {
      if (penActive && !autoHandwritingActive.value) return;
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (t.closest(".block-move-btn")) return;
      if (t.closest("button")) return;

      const placedNode = doc.blocks.find((x) => x.id === blockId);
      if (!placedNode) return;

      const typ = placedNode.type;
      const cellIn = t.closest("[data-cell-input]") as HTMLInputElement | null;
      if (
        (typ === "array" || typ === "matrix") &&
        cellIn?.tagName === "INPUT"
      ) {
        e.preventDefault();
        cellDragPrep = {
          id: blockId,
          sx: e.clientX,
          sy: e.clientY,
          ox: placedNode.x,
          oy: placedNode.y,
          ax: e.clientX,
          ay: e.clientY,
          inp: cellIn,
        };
        return;
      }

      const ta = t.closest("textarea.note-ta") as HTMLTextAreaElement | null;
      if (ta) {
        if (e.altKey) {
          e.preventDefault();
        } else {
          if (document.activeElement === ta && !autoHandwritingActive.value) return;
          if (doc.selectedBlockId !== blockId) return;
          e.preventDefault();
          noteDragPrep = {
            id: blockId,
            sx: e.clientX,
            sy: e.clientY,
            ox: placedNode.x,
            oy: placedNode.y,
            ax: e.clientX,
            ay: e.clientY,
            ta,
          };
          return;
        }
      }
      startDrag(blockId, e);
    };

    node.addEventListener("contextmenu", onCtx, true);
    node.addEventListener("pointerdown", cap, { capture: true });
    return {
      update(id: string) {
        blockId = id;
      },
      destroy() {
        node.removeEventListener("contextmenu", onCtx, true);
        node.removeEventListener("pointerdown", cap, { capture: true });
      },
    };
  }

  function pruneEmptyNoteIfAny(id: string | null) {
    if (!id) return;
    const b = doc.blocks.find((x) => x.id === id);
    if (b?.type === "note" && !String(b.content ?? "").trim()) {
      removeBlock(id);
    }
  }

  function onViewportPointerDown(e: PointerEvent) {
    if (penActive) return;
    if (e.button !== 0 && e.button !== 1) return;
    const t = e.target as HTMLElement;
    if (t.closest(".radial-menu")) return;

    if (handActive || e.button === 1) {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartScrollLeft = canvasEl?.scrollLeft ?? 0;
      panStartScrollTop = canvasEl?.scrollTop ?? 0;
      doc.insertAnchor = null;
      return;
    }

    if (t.closest("[data-placed-root]")) return;
    const under = blockIdUnderClientPoint(e.clientX, e.clientY);
    if (under) {
      doc.insertAnchor = null;
      if (doc.selectedBlockId !== under) {
        pruneEmptyNoteIfAny(doc.selectedBlockId);
      }
      doc.selectedBlockId = under;
      doc.cellLinearFocus = null;
      return;
    }
    pruneEmptyNoteIfAny(doc.selectedBlockId);
    clearSelection();
    const p = canvasContentPoint(e);
    if (p) doc.insertAnchor = p;
  }

  function onViewportDblClick(e: MouseEvent) {
    if (penActive || handActive) return;
    const t = e.target as HTMLElement;
    if (t.closest("[data-placed-root]")) return;
    if (t.closest("[data-caption-strip]")) return;
    const p = canvasPointFromClient(e.clientX, e.clientY);
    if (!p) return;
    e.preventDefault();
    const placed = placeBlockAt(createNoteBlock(), p.x - 4, p.y - 4);
    doc.selectedBlockId = placed.id;
    void tick().then(() => focusBlockRoot(placed.id));
  }

  function onPlacedPointerDownBubble(b: PlacedBlock, e: PointerEvent) {
    if (penActive && !autoHandwritingActive.value) return;
    if (handActive || e.button === 1) {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartScrollLeft = canvasEl?.scrollLeft ?? 0;
      panStartScrollTop = canvasEl?.scrollTop ?? 0;
      doc.insertAnchor = null;
      return;
    }
    if (e.button !== 0) return;
    doc.insertAnchor = null;
    if (doc.selectedBlockId && doc.selectedBlockId !== b.id) {
      pruneEmptyNoteIfAny(doc.selectedBlockId);
    }
    doc.selectedBlockId = b.id;
    const el = e.target as HTMLElement;
    if (
      el.closest("[data-cell-input]") ||
      el.closest("textarea.note-ta") ||
      el.closest("button")
    )
      return;
    doc.cellLinearFocus = null;
  }

  function onCanvasSelectStart(e: Event) {
    const el = e.target as HTMLElement | null;
    if (!el || !canvasEl?.contains(el)) return;
    if (el.closest("[data-cell-input]")) return;
    if (el.closest(".note-ta")) {
      if (document.activeElement !== el) e.preventDefault();
      return;
    }
    e.preventDefault();
  }

  function onCanvasDragStart(e: DragEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("[data-cell-input]") || t.closest(".note-ta")) return;
    if (canvasEl?.contains(e.target as Node)) e.preventDefault();
  }

  async function startCaptionEdit(b: PlacedBlock) {
    captionEditingId = b.id;
    captionDraft = b.caption ?? "";
    await tick();
    const inp = canvasEl?.querySelector(
      `[data-block-id="${b.id}"] [data-caption-editor]`,
    ) as HTMLInputElement | null;
    inp?.focus();
    inp?.select();
  }

  function commitCaption(b: PlacedBlock) {
    const v = captionDraft.trim();
    b.caption = v.length > 0 ? v : undefined;
    captionEditingId = null;
    captionDraft = "";
  }

  function polyPoints(pts: { x: number; y: number }[]): string {
    return pts.map((p) => `${p.x},${p.y}`).join(" ");
  }

  function onPenDown(e: PointerEvent) {
    if (e.button !== 0) return;

    if (drag !== null || noteDragPrep !== null || cellDragPrep !== null) return;

    if (autoHandwritingActive.value) {
      const clickedBlockId = blockIdUnderClientPoint(e.clientX, e.clientY);
      if (clickedBlockId) {
        if (doc.selectedBlockId === clickedBlockId) {
          startDrag(clickedBlockId, e);
          return;
        }
        doc.selectedBlockId = clickedBlockId;
        doc.cellLinearFocus = null;
        void tick().then(() => focusBlockRoot(clickedBlockId));
        return;
      }
    }

    const p = surfacePoint(e.clientX, e.clientY);
    if (!p) return;
    sketchLive = { points: [p], color: penStrokeColor };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPenMove(e: PointerEvent) {
    if (!sketchLive || (e.buttons & 1) === 0) return;
    const p = surfacePoint(e.clientX, e.clientY);
    if (!p) return;
    const last = sketchLive.points.at(-1);
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1.2) {
      sketchLive = {
        points: [...sketchLive.points, p],
        color: sketchLive.color,
      };
    }
  }

  async function processPendingHandwritingBatch() {
    if (pendingHandwritingStrokeIds.length === 0) return;
    const idsToProcess = [...pendingHandwritingStrokeIds];
    pendingHandwritingStrokeIds = [];

    const targetStrokes = sketchStrokes.filter((s) => idsToProcess.includes(s.id));
    if (targetStrokes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const stroke of targetStrokes) {
      for (const pt of stroke.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (!isFinite(minX) || !isFinite(minY)) return;

    isRecognizingHandwriting = true;
    try {
      const result = await recognizeHandwritingStrokes(targetStrokes, {
        minX,
        minY,
        maxX,
        maxY,
      });

      if (result.ok && result.text && (result.confidence ?? 0) >= 0.7) {
        const currentStrokesStillPresent = sketchStrokes.filter((s) => idsToProcess.includes(s.id));
        if (currentStrokesStillPresent.length > 0) {
          const removed = removeStrokesByIds(idsToProcess);

  type PlacedNote = PlacedBlock & { type: "note"; content: string };

          // Find active note target to append to
          let targetBlock: PlacedNote | null = doc.selectedBlockId
            ? (doc.blocks.find(
                (b) => b.id === doc.selectedBlockId && b.type === "note"
              ) as PlacedNote | undefined) ?? null
            : null;

          if (!targetBlock) {
            // Check if written close to any existing note block
            targetBlock =
              (doc.blocks.find((b) => {
                if (b.type !== "note") return false;
                const dx = minX - (b.x + (b.width ?? 120));
                const dy = Math.abs(minY - b.y);
                return dy < 80 && dx >= -50 && dx < 280;
              }) as PlacedNote | undefined) ?? null;
          }

          if (targetBlock) {
            const prevContent = String(targetBlock.content ?? "");
            const ta = canvasEl?.querySelector(
              `[data-block-id="${targetBlock.id}"] textarea.note-ta`
            ) as HTMLTextAreaElement | null;

            if (ta && document.activeElement === ta) {
              const selStart = ta.selectionStart ?? prevContent.length;
              const selEnd = ta.selectionEnd ?? prevContent.length;
              targetBlock.content =
                prevContent.slice(0, selStart) +
                result.text +
                prevContent.slice(selEnd);
              const nextPos = selStart + result.text.length;
              queueMicrotask(() => {
                ta.selectionStart = ta.selectionEnd = nextPos;
                ta.focus();
              });
            } else {
              targetBlock.content = prevContent + result.text;
            }

            doc.selectedBlockId = targetBlock.id;
            registerHandwritingConversion({
              blockId: targetBlock.id,
              strokes: removed.length > 0 ? removed : currentStrokesStillPresent,
              prevContent,
              isNewBlock: false,
            });
          } else {
            const blockId = crypto.randomUUID();
            const placed = placeBlockAt(
              { id: blockId, type: "note", content: result.text },
              Math.max(0, Math.round(minX)),
              Math.max(0, Math.round(minY)),
              true
            );
            doc.selectedBlockId = placed.id;
            registerHandwritingConversion({
              blockId: placed.id,
              strokes: removed.length > 0 ? removed : currentStrokesStillPresent,
              isNewBlock: true,
            });
            void tick().then(() => focusBlockRoot(placed.id));
          }
        }
      }
    } catch {
      // In case of error, preserve original handwriting ink
    } finally {
      isRecognizingHandwriting = false;
    }
  }

  function onPenUp(e: PointerEvent) {
    if (!sketchLive || sketchLive.points.length === 0) {
      sketchLive = null;
      return;
    }
    const strokeId = crypto.randomUUID();
    if (sketchLive.points.length === 1) {
      appendSketchStroke({
        id: strokeId,
        points: [sketchLive.points[0], sketchLive.points[0]],
        color: sketchLive.color,
      });
    } else {
      appendSketchStroke({
        id: strokeId,
        points: sketchLive.points,
        color: sketchLive.color,
      });
    }
    sketchLive = null;

    if (autoHandwritingActive.value) {
      pendingHandwritingStrokeIds.push(strokeId);
      if (handwritingDebounceTimer) {
        clearTimeout(handwritingDebounceTimer);
      }
      handwritingDebounceTimer = setTimeout(() => {
        void processPendingHandwritingBatch();
      }, 900);
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onWindowKeydown(e: KeyboardEvent) {
    if (penActive && autoHandwritingActive.value) {
      if (e.key === "Escape") {
        if (doc.selectedBlockId) {
          doc.selectedBlockId = null;
          return;
        }
      }
      if (e.key === " " && doc.selectedBlockId) {
        const b = doc.blocks.find(
          (x) => x.id === doc.selectedBlockId && x.type === "note"
        ) as (PlacedBlock & { type: "note"; content: string }) | undefined;
        if (b) {
          const ta = canvasEl?.querySelector(
            `[data-block-id="${b.id}"] textarea.note-ta`
          ) as HTMLTextAreaElement | null;
          if (ta && document.activeElement !== ta) {
            e.preventDefault();
            b.content = String(b.content ?? "") + " ";
            ta.focus();
            ta.selectionStart = ta.selectionEnd = b.content.length;
          }
        }
      }
    }
  }
</script>

<svelte:window
  onpointermove={onWindowPointerMove}
  onpointerup={onWindowPointerUp}
  onkeydown={onWindowKeydown}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="viewport"
  class:hand-mode={handActive}
  class:is-panning={isPanning}
  class:smart-pen-active={penActive && autoHandwritingActive.value}
  class:is-dragging={drag !== null}
  bind:this={canvasEl}
  role="application"
  aria-label="Scratch canvas"
  oncontextmenu={onSurfaceContextMenu}
  onpointerdown={onViewportPointerDown}
  ondblclick={onViewportDblClick}
  onselectstart={onCanvasSelectStart}
  ondragstart={onCanvasDragStart}
>
  <div class="canvas-surface">
    {#if doc.insertAnchor}
      <CanvasRadialMenu
        x={doc.insertAnchor.x}
        y={doc.insertAnchor.y}
        {penActive}
        {handActive}
        onSelectNote={() => {
          if (!doc.insertAnchor) return;
          const placed = placeBlockAt(createNoteBlock(), doc.insertAnchor.x - 4, doc.insertAnchor.y - 4);
          doc.selectedBlockId = placed.id;
          doc.insertAnchor = null;
          void tick().then(() => focusBlockRoot(placed.id));
        }}
        onSelectArray={() => {
          if (!doc.insertAnchor) return;
          const placed = placeBlockAt(createArrayBlock(4), doc.insertAnchor.x, doc.insertAnchor.y);
          doc.selectedBlockId = placed.id;
          doc.cellLinearFocus = 0;
          doc.insertAnchor = null;
          void tick().then(() => focusBlockRoot(placed.id));
        }}
        onSelectMatrix={() => {
          if (!doc.insertAnchor) return;
          const placed = placeBlockAt(createMatrixBlock(3, 3), doc.insertAnchor.x, doc.insertAnchor.y);
          doc.selectedBlockId = placed.id;
          doc.cellLinearFocus = 0;
          doc.insertAnchor = null;
          void tick().then(() => focusBlockRoot(placed.id));
        }}
        onTogglePen={() => {
          onTogglePen?.();
          doc.insertAnchor = null;
        }}
        onToggleHand={() => {
          onToggleHand?.();
          doc.insertAnchor = null;
        }}
        onClose={() => {
          doc.insertAnchor = null;
        }}
      />
    {/if}

    {#each doc.blocks as b (b.id)}
      {#if b.type === "spine"}
        <div
          class="placed spine-placed"
          class:selected={doc.selectedBlockId === b.id}
          class:is-dragging={drag !== null && drag.id === b.id}
          style:top="{b.y}px"
          data-placed-root
          data-block-id={b.id}
          role="group"
          use:placedRootInteractions={b.id}
          onpointerdown={(e) => onPlacedPointerDownBubble(b, e)}
        >
          <button
            type="button"
            class="block-move-btn spine-move-btn"
            class:near-top={b.y < 22}
            tabindex="-1"
            aria-label="Move divider"
            title="Move"
            onpointerdown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              startDrag(b.id, e);
            }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 7V2M8.5 5.5L12 2l3.5 3.5M12 17v5M8.5 18.5L12 22l3.5-3.5M7 12H2M5.5 8.5L2 12l3.5 3.5M17 12h5M18.5 8.5L22 12l-3.5 3.5" />
            </svg>
          </button>
          <div class="placed-stack spine-stack">
            <div class="widget spine-widget" role="group">
              <SpineBlock block={b} />
            </div>
            <div
              class="caption-wrap caption-tight caption-tight--cells"
              data-caption-strip
            >
              {#if captionEditingId === b.id}
                <input
                  class="cap-input"
                  data-caption-editor
                  bind:value={captionDraft}
                  maxlength="80"
                  onblur={() => commitCaption(b)}
                  onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      e.preventDefault();
                      (e.currentTarget as HTMLInputElement).blur();
                    }
                  }}
                />
              {:else}
                <button
                  type="button"
                  class="cap-hit"
                  class:cap-hit--populated={Boolean(b.caption?.trim())}
                  tabindex="-1"
                  title="Double-click to add or edit label"
                  aria-label={b.caption?.trim()
                    ? "Edit structure label"
                    : "Add structure label"}
                  onmousedown={(e) => e.preventDefault()}
                  ondblclick={(e) => {
                    e.stopPropagation();
                    void startCaptionEdit(b);
                  }}
                >
                  {b.caption?.trim() ?? ""}
                </button>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div
          class="placed"
          class:selected={doc.selectedBlockId === b.id}
          class:smart-target={penActive && autoHandwritingActive.value && doc.selectedBlockId === b.id}
          class:is-dragging={drag !== null && drag.id === b.id}
          style:left="{b.x}px"
          style:top="{b.y}px"
          data-placed-root
          data-block-id={b.id}
          role="group"
          use:placedRootInteractions={b.id}
          onpointerdown={(e) => onPlacedPointerDownBubble(b, e)}
        >
          <button
            type="button"
            class="block-move-btn"
            class:near-top={b.y < 22}
            tabindex="-1"
            aria-label="Move block"
            title="Move"
            onpointerdown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              startDrag(b.id, e);
            }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 7V2M8.5 5.5L12 2l3.5 3.5M12 17v5M8.5 18.5L12 22l3.5-3.5M7 12H2M5.5 8.5L2 12l3.5 3.5M17 12h5M18.5 8.5L22 12l-3.5 3.5" />
            </svg>
          </button>
          {#if b.type === "note"}
            <div class="widget" role="group">
              <NoteBlock block={b} {onSlash} />
            </div>
          {:else}
            <div class="placed-stack">
              <div class="widget" role="group">
                {#if b.type === "array"}
                  <ArrayBlock block={b} />
                {:else if b.type === "matrix"}
                  <MatrixBlock block={b} />
                {/if}
              </div>
              <div
                class="caption-wrap caption-tight caption-tight--cells"
                data-caption-strip
              >
                {#if captionEditingId === b.id}
                  <input
                    class="cap-input"
                    data-caption-editor
                    bind:value={captionDraft}
                    maxlength="80"
                    onblur={() => commitCaption(b)}
                    onkeydown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        e.preventDefault();
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                  />
                {:else}
                  <button
                    type="button"
                    class="cap-hit"
                    class:cap-hit--populated={Boolean(b.caption?.trim())}
                    tabindex="-1"
                    title="Double-click to add or edit label"
                    aria-label={b.caption?.trim()
                      ? "Edit structure label"
                      : "Add structure label"}
                    onmousedown={(e) => e.preventDefault()}
                    ondblclick={(e) => {
                      e.stopPropagation();
                      void startCaptionEdit(b);
                    }}
                  >
                    {b.caption?.trim() ?? ""}
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/each}

    <div class="sketch-display" aria-hidden="true">
      <svg class="sketch-svg">
        {#each sketchStrokes as s (s.id)}
          <polyline
            class="pen-line"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke={s.color}
            points={polyPoints(s.points)}
          />
        {/each}
        {#if sketchLive && sketchLive.points.length > 0}
          <polyline
            class="pen-line live"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke={sketchLive.color}
            points={polyPoints(sketchLive.points)}
          />
        {/if}
      </svg>
    </div>

    {#if penActive}
      <div
        class="pen-capture"
        role="presentation"
        aria-hidden="true"
        onpointerdown={onPenDown}
        onpointermove={onPenMove}
        onpointerup={onPenUp}
        onpointercancel={onPenUp}
      ></div>
    {/if}
  </div>

  {#if structureMenu}
    {@const menuState = structureMenu}
    {@const mb = doc.blocks.find((x) => x.id === menuState.id)}
    {#if mb}
      <StructureMenu
        block={mb}
        open={true}
        left={menuState.left}
        top={menuState.top}
        onClose={() => (structureMenu = null)}
        onAutoCreate={onOpenAutoCreate &&
        (mb.type === "note" || mb.type === "spine")
          ? () => {
              const st = structureMenu;
              if (!st) return;
              const bl = doc.blocks.find((x) => x.id === st.id);
              structureMenu = null;
              if (bl) onOpenAutoCreate({ x: bl.x + 40, y: bl.y + 160 });
            }
          : undefined}
      />
    {/if}
  {/if}

  {#if handActive}
    <div class="hand-mode-toast" role="status">
      <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 11V5a1 1 0 0 1 2 0v5" />
        <path d="M9 10V4a1 1 0 0 1 2 0v6" />
        <path d="M11 10V5a1 1 0 0 1 2 0v6" />
        <path d="M13 11V7a1 1 0 0 1 2 0v5c0 3-2 5-5 5s-5-2-5-5v-3a1 1 0 0 1 2 0v2" />
      </svg>
      <span>Hand Tool Active — Drag canvas to pan</span>
      <button type="button" class="toast-exit" onclick={onToggleHand} title="Exit hand mode (Esc)">Exit</button>
    </div>
  {:else if penActive && autoHandwritingActive.value}
    <div class="smart-pen-island" role="toolbar" aria-label="Smart Pen controls">
      <div class="island-main">
        <span class="island-status-dot" class:pulse={isRecognizingHandwriting}></span>
        <span class="island-title">
          {#if isRecognizingHandwriting}
            Converting text...
          {:else if doc.selectedBlockId && doc.blocks.some((b) => b.id === doc.selectedBlockId && b.type === "note")}
            Writing into Active Note (Drag to move)
          {:else if doc.selectedBlockId}
            Block Selected (Drag to move)
          {:else}
            Smart Pen (Write anywhere or tap a note)
          {/if}
        </span>
      </div>

      <div class="island-actions">
        {#if doc.selectedBlockId && doc.blocks.some((b) => b.id === doc.selectedBlockId && b.type === "note")}
          <button
            type="button"
            class="island-btn"
            onclick={() => {
              const b = doc.blocks.find(
                (x) => x.id === doc.selectedBlockId && x.type === "note"
              ) as (PlacedBlock & { type: "note"; content: string }) | undefined;
              if (b) {
                b.content = String(b.content ?? "") + " ";
                const ta = canvasEl?.querySelector(
                  `[data-block-id="${b.id}"] textarea.note-ta`
                ) as HTMLTextAreaElement | null;
                ta?.focus();
              }
            }}
            title="Insert space (or press Spacebar)"
          >
            + Space
          </button>
          <button
            type="button"
            class="island-btn"
            onclick={() => {
              const b = doc.blocks.find(
                (x) => x.id === doc.selectedBlockId && x.type === "note"
              ) as (PlacedBlock & { type: "note"; content: string }) | undefined;
              if (b) {
                b.content = String(b.content ?? "") + "\n";
                const ta = canvasEl?.querySelector(
                  `[data-block-id="${b.id}"] textarea.note-ta`
                ) as HTMLTextAreaElement | null;
                ta?.focus();
              }
            }}
            title="Insert newline (or press Enter)"
          >
            New Line
          </button>
        {/if}
        {#if doc.selectedBlockId}
          <button
            type="button"
            class="island-btn island-btn--subtle"
            onclick={() => {
              doc.selectedBlockId = null;
            }}
            title="Deselect block (or press Esc)"
          >
            Deselect
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .viewport {
    position: relative;
    flex: 1;
    min-height: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: auto;
    background-color: var(--bg);
    background-image: radial-gradient(
      circle at 1px 1px,
      var(--canvas-dot) 1.2px,
      transparent 0
    );
    background-size: 24px 24px;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
  }

  .canvas-surface {
    position: relative;
    min-width: 3200px;
    min-height: 2400px;
    user-select: none;
    -webkit-user-select: none;
  }

  .viewport :global([data-cell-input]),
  .viewport :global(.note-ta) {
    user-select: text;
    -webkit-user-select: text;
  }

  .sketch-display {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }

  .sketch-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .pen-capture {
    position: absolute;
    inset: 0;
    z-index: 20;
    touch-action: none;
    cursor: crosshair;
    background: transparent;
  }

  .pen-line {
    stroke-width: 2.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .pen-line.live {
    opacity: 0.95;
  }

  .placed-stack {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: fit-content;
    max-width: 100%;
    gap: 4px;
  }

  .spine-stack {
    width: 100%;
    max-width: none;
  }

  .caption-wrap {
    max-width: 100%;
    text-align: center;
  }

  .caption-tight {
    margin-top: 2px;
  }

  .caption-tight--cells {
    align-self: center;
    flex-shrink: 0;
    width: calc(2 * 54px + 10px);
    max-width: 100%;
    box-sizing: border-box;
  }

  .spine-stack .caption-tight--cells {
    margin-left: auto;
    margin-right: auto;
  }

  .cap-hit {
    display: block;
    width: 100%;
    max-width: 100%;
    border: none;
    background: transparent;
    font: 600 11px var(--mono);
    color: var(--muted);
    min-height: 14px;
    padding: 2px 6px;
    cursor: default;
    border-radius: 4px;
    box-sizing: border-box;
    transition: all 0.12s ease;
  }

  .cap-hit:focus {
    outline: none;
  }

  .cap-hit:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 1px;
  }

  .cap-hit:not(.cap-hit--populated) {
    opacity: 0;
    pointer-events: auto;
  }

  .cap-hit.cap-hit--populated {
    color: var(--muted);
    background: var(--surface-2);
    border: 1px solid var(--border);
  }

  .cap-hit.cap-hit--populated:hover {
    color: var(--accent-primary);
    border-color: var(--border-strong);
  }

  .placed.selected .cap-hit:not(.cap-hit--populated):hover {
    opacity: 0.6;
    color: var(--muted);
    background: var(--surface-2);
  }

  .cap-input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    font: 600 11px var(--mono);
    text-align: center;
    padding: 3px 6px;
    border-radius: 6px;
    border: 1px solid var(--accent-primary);
    background: var(--surface);
    color: var(--text-h);
    box-shadow: 0 0 0 2px var(--accent-primary-glow);
    outline: none;
  }

  .viewport.hand-mode {
    cursor: grab;
  }

  .viewport.hand-mode.is-panning {
    cursor: grabbing;
  }

  .viewport.hand-mode :global(.placed) {
    cursor: grab;
  }

  .hand-mode-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 8px 18px;
    border-radius: 24px;
    background: var(--surface);
    border: 1px solid var(--accent-primary);
    color: var(--text-h);
    font-size: 13px;
    font-weight: 500;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.15);
    animation: toastSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes toastSlideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 14px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .toast-exit {
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
    color: var(--accent-primary);
    border: 1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toast-exit:hover {
    background: var(--accent-primary);
    color: #ffffff;
  }

  .smart-pen-island {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 6px 14px;
    border-radius: 28px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid color-mix(in srgb, var(--accent-primary) 50%, var(--border));
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    animation: toastSlideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .island-main {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-h);
  }

  .island-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-primary);
    box-shadow: 0 0 8px var(--accent-primary-glow);
  }

  .island-status-dot.pulse {
    animation: penPulse 0.8s ease-in-out infinite alternate;
  }

  @keyframes penPulse {
    from {
      opacity: 0.4;
      transform: scale(0.85);
    }
    to {
      opacity: 1;
      transform: scale(1.25);
    }
  }

  .island-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .island-btn {
    padding: 3px 9px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-h);
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .island-btn:hover {
    background: var(--accent-primary);
    color: #ffffff;
    border-color: var(--accent-primary);
  }

  .island-btn--subtle {
    color: var(--muted);
  }

  .island-btn--subtle:hover {
    color: #ffffff;
  }

  .viewport.is-dragging,
  .viewport.is-dragging * {
    cursor: grabbing !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  .block-move-btn {
    position: absolute;
    bottom: calc(100% + 2px);
    left: 0;
    z-index: 30;
    width: 17px;
    height: 17px;
    padding: 0;
    margin: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border));
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.12s ease;
    touch-action: none;
  }

  .spine-move-btn {
    left: 20px;
  }

  .placed:hover .block-move-btn,
  .placed.selected .block-move-btn {
    opacity: 1;
    pointer-events: auto;
  }

  .block-move-btn:hover {
    color: #ffffff;
    background: var(--accent-primary);
    border-color: var(--accent-primary);
    box-shadow: 0 2px 8px var(--accent-primary-glow);
  }

  .block-move-btn:active {
    cursor: grabbing;
    transform: scale(0.92);
  }

  .block-move-btn.near-top {
    bottom: auto;
    top: calc(100% + 2px);
  }

  .viewport.smart-pen-active .placed {
    z-index: 22;
  }

  .placed.smart-target:not(.spine-placed) {
    outline: 2px dashed var(--accent-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
    box-shadow: 0 0 12px var(--accent-primary-glow);
  }

  .placed {
    position: absolute;
    z-index: 2;
    transition:
      outline 0.15s ease,
      box-shadow 0.15s ease;
  }

  .placed:not(.spine-placed) {
    width: max-content;
    max-width: min(92vw, 960px);
    min-width: min-content;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  .spine-placed {
    left: 0;
    width: 100%;
    max-width: none;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .placed.selected:not(.spine-placed) {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
    box-shadow: 0 0 12px var(--accent-primary-glow);
  }

  .spine-placed.selected {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
    border-radius: var(--radius-sm);
    box-shadow: 0 0 15px var(--accent-primary-glow);
  }

  .placed.is-dragging {
    opacity: 0.9;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45), 0 0 20px var(--accent-primary-glow) !important;
    z-index: 50 !important;
    cursor: grabbing !important;
  }

  .widget {
    max-width: none;
  }

  .spine-widget {
    max-width: none;
  }
</style>
