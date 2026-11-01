import { doc } from '../state/document.svelte';
import { sketchStrokes } from '../state/sketches.svelte';
import type { ThemeMode } from '../theme/theme';

interface ThemePalette {
  bg: string;
  dotColor: string;
  cardBg: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  idxBg: string;
  idxText: string;
  spineColor: string;
}

function getPalette(mode: ThemeMode): ThemePalette {
  if (mode === 'dark') {
    return {
      bg: '#141210',
      dotColor: 'rgba(255, 255, 255, 0.08)',
      cardBg: '#1E1B18',
      border: '#332E27',
      text: '#F0ECF5',
      muted: '#8E877D',
      accent: '#B49AFF',
      idxBg: '#2A2520',
      idxText: '#9A9287',
      spineColor: '#38322B',
    };
  }
  if (mode === 'paper') {
    return {
      bg: '#F4F0E8',
      dotColor: 'rgba(50, 40, 30, 0.07)',
      cardBg: '#FCFAF6',
      border: '#DDD5C4',
      text: '#2E2721',
      muted: '#7A7064',
      accent: '#2866B2',
      idxBg: '#E8E1D3',
      idxText: '#6E6457',
      spineColor: '#D8CFBC',
    };
  }
  // Light mode
  return {
    bg: '#F7F6F2',
    dotColor: 'rgba(0, 0, 0, 0.06)',
    cardBg: '#FFFFFF',
    border: '#E3DFD7',
    text: '#1B1917',
    muted: '#78736B',
    accent: '#7C3AED',
    idxBg: '#ECE9E2',
    idxText: '#68635B',
    spineColor: '#DFDACF',
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function computeContentBounds(): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // 1. Measure Strokes
  for (const s of sketchStrokes) {
    for (const p of s.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  // 2. Measure Placed Blocks
  const surface = typeof document !== 'undefined'
    ? (document.querySelector('.canvas-surface') as HTMLElement | null)
    : null;
  const surfaceRect = surface?.getBoundingClientRect();

  for (const b of doc.blocks) {
    let bx = b.x;
    let by = b.y;
    let bw = 240;
    let bh = 100;

    if (surface && surfaceRect) {
      const el = surface.querySelector(`[data-block-id="${b.id}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        bx = r.left - surfaceRect.left;
        by = r.top - surfaceRect.top;
        bw = r.width;
        bh = r.height;
      }
    } else {
      if (b.type === 'array') {
        bw = Math.max(140, b.values.length * 44 + 20);
        bh = 72;
      } else if (b.type === 'matrix') {
        const cols = b.rows[0]?.length ?? 1;
        bw = Math.max(160, cols * 44 + 40);
        bh = b.rows.length * 40 + 40;
      } else if (b.type === 'note') {
        const lines = (b.content || '').split('\n').length;
        bw = 260;
        bh = Math.max(90, lines * 22 + 40);
      } else if (b.type === 'spine') {
        bw = 800;
        bh = 24;
      }
    }

    if (b.type !== 'spine') {
      if (bx < minX) minX = bx;
      if (by < minY) minY = by;
      if (bx + bw > maxX) maxX = bx + bw;
      if (by + bh > maxY) maxY = by + bh;
    } else {
      if (by < minY) minY = by;
      if (by + bh > maxY) maxY = by + bh;
    }
  }

  // Fallback if canvas has no blocks or strokes
  if (!isFinite(minX) || !isFinite(minY)) {
    minX = 60;
    minY = 60;
    maxX = 740;
    maxY = 500;
  }

  const padding = 44;
  const finalMinX = Math.max(0, Math.floor(minX - padding));
  const finalMinY = Math.max(0, Math.floor(minY - padding));
  const finalMaxX = Math.ceil(maxX + padding);
  const finalMaxY = Math.ceil(maxY + padding);

  const width = Math.max(480, finalMaxX - finalMinX);
  const height = Math.max(340, finalMaxY - finalMinY);

  return {
    minX: finalMinX,
    minY: finalMinY,
    maxX: finalMinX + width,
    maxY: finalMinY + height,
    width,
    height,
  };
}

export function generateDiagramSvg(mode: ThemeMode = 'light'): string {
  const pal = getPalette(mode);
  const bounds = computeContentBounds();
  const { minX, minY, width, height } = bounds;

  let bodySvg = '';

  // Background rect
  bodySvg += `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${pal.bg}"/>\n`;

  // Subtle dot grid pattern
  bodySvg += `
  <defs>
    <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse" x="${minX}" y="${minY}">
      <circle cx="12" cy="12" r="1.1" fill="${pal.dotColor}"/>
    </pattern>
  </defs>
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="url(#dotgrid)"/>\n`;

  // Render placed blocks
  const surface = typeof document !== 'undefined'
    ? (document.querySelector('.canvas-surface') as HTMLElement | null)
    : null;
  const surfaceRect = surface?.getBoundingClientRect();

  for (const b of doc.blocks) {
    let bx = b.x;
    let by = b.y;
    let bw = 240;
    let bh = 100;

    if (surface && surfaceRect) {
      const el = surface.querySelector(`[data-block-id="${b.id}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        bx = r.left - surfaceRect.left;
        by = r.top - surfaceRect.top;
        bw = r.width;
        bh = r.height;
      }
    }

    // Optional caption
    if (b.caption && b.caption.trim()) {
      bodySvg += `<text x="${bx + 2}" y="${by - 8}" font-size="11" font-weight="600" fill="${pal.accent}" font-family="ui-sans-serif, system-ui, sans-serif">${escapeXml(b.caption.trim())}</text>\n`;
    }

    if (b.type === 'note') {
      const lines = (b.content || '').split('\n');
      bodySvg += `<g transform="translate(${bx}, ${by})">
        <rect width="${bw}" height="${bh}" rx="8" fill="${pal.cardBg}" stroke="${pal.border}" stroke-width="1.2"/>
        <text x="14" y="24" font-size="13" font-family="ui-sans-serif, system-ui, -apple-system, sans-serif" fill="${pal.text}">`;
      lines.forEach((line, idx) => {
        const dy = idx === 0 ? '0' : '1.45em';
        bodySvg += `<tspan x="14" dy="${dy}">${escapeXml(line || ' ')}</tspan>`;
      });
      bodySvg += `</text></g>\n`;
    } else if (b.type === 'array') {
      const cellW = 42;
      const cellH = 38;
      const hasPtrs = Boolean(b.pointers && b.pointers.length > 0);
      const ptrOffset = hasPtrs ? 16 : 0;
      bodySvg += `<g transform="translate(${bx}, ${by})">`;
      if (hasPtrs) {
        b.pointers?.forEach((p) => {
          const cx = p.index * cellW + cellW / 2;
          const ptrColor = p.color === 'rose' ? '#e11d48' : p.color === 'purple' ? '#9333ea' : p.color === 'emerald' ? '#059669' : p.color === 'amber' ? '#d97706' : '#0891b2';
          bodySvg += `<text x="${cx}" y="10" font-size="10" font-weight="700" text-anchor="middle" font-family="ui-monospace, monospace" fill="${ptrColor}">${escapeXml(p.name)} ↓</text>`;
        });
      }
      b.values.forEach((val, i) => {
        const cx = i * cellW;
        // Index tag above cell
        bodySvg += `<text x="${cx + cellW / 2}" y="${ptrOffset + 12}" font-size="10" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace" fill="${pal.idxText}">[${i}]</text>`;
        // Cell box
        bodySvg += `<rect x="${cx}" y="${ptrOffset + 18}" width="${cellW}" height="${cellH}" rx="3" fill="${pal.cardBg}" stroke="${pal.border}" stroke-width="1.2"/>`;
        // Value text
        bodySvg += `<text x="${cx + cellW / 2}" y="${ptrOffset + 42}" font-size="13" font-weight="500" text-anchor="middle" font-family="ui-monospace, monospace" fill="${pal.text}">${escapeXml(val ?? '')}</text>`;
      });
      bodySvg += `</g>\n`;
    } else if (b.type === 'matrix') {
      const cellW = 40;
      const cellH = 34;
      const headerOffset = 24;
      const cols = b.rows[0]?.length ?? 0;
      bodySvg += `<g transform="translate(${bx}, ${by})">`;

      // Column indices along top
      for (let c = 0; c < cols; c++) {
        const cx = headerOffset + c * cellW + cellW / 2;
        bodySvg += `<text x="${cx}" y="14" font-size="10" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace" fill="${pal.idxText}">${c}</text>`;
      }

      // Rows
      b.rows.forEach((row, r) => {
        const cy = headerOffset + r * cellH;
        // Row index on left
        bodySvg += `<text x="12" y="${cy + cellH / 2 + 4}" font-size="10" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace" fill="${pal.idxText}">${r}</text>`;
        row.forEach((val, c) => {
          const cx = headerOffset + c * cellW;
          bodySvg += `<rect x="${cx}" y="${cy}" width="${cellW}" height="${cellH}" rx="2" fill="${pal.cardBg}" stroke="${pal.border}" stroke-width="1.1"/>`;
          bodySvg += `<text x="${cx + cellW / 2}" y="${cy + cellH / 2 + 5}" font-size="12" font-weight="500" text-anchor="middle" font-family="ui-monospace, monospace" fill="${pal.text}">${escapeXml(val ?? '')}</text>`;
        });
      });
      bodySvg += `</g>\n`;
    } else if (b.type === 'spine') {
      bodySvg += `<line x1="${minX + 10}" y1="${by + 12}" x2="${minX + width - 10}" y2="${by + 12}" stroke="${pal.spineColor}" stroke-dasharray="6 4" stroke-width="1.5"/>\n`;
    }
  }

  // Render sketch strokes
  for (const s of sketchStrokes) {
    if (s.points.length < 2) continue;
    const pts = s.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    bodySvg += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  }

  // Brand watermark badge in bottom-right corner
  const badgeX = minX + width - 16;
  const badgeY = minY + height - 16;
  bodySvg += `<text x="${badgeX}" y="${badgeY}" text-anchor="end" font-size="10.5" font-weight="600" font-family="ui-sans-serif, system-ui, sans-serif" fill="${pal.muted}" opacity="0.65">Rough Notebook</text>\n`;

  const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">
  ${bodySvg}
</svg>`;

  return fullSvg;
}

export async function exportToPngBlob(mode: ThemeMode = 'light'): Promise<Blob> {
  const svgText = generateDiagramSvg(mode);
  const bounds = computeContentBounds();
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const dpr = Math.min(3, Math.max(2, (typeof window !== 'undefined' ? window.devicePixelRatio : 2) || 2));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bounds.width * dpr);
        canvas.height = Math.round(bounds.height * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to create canvas 2D rendering context.'));
          return;
        }
        ctx.scale(dpr, dpr);
        ctx.drawImage(img, 0, 0, bounds.width, bounds.height);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob generated null.'));
          }
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image failed to decode SVG.'));
    };
    img.src = url;
  });
}

export async function copyDiagramToClipboard(mode: ThemeMode = 'light'): Promise<boolean> {
  try {
    const blob = await exportToPngBlob(mode);
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API is not supported in this browser.');
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return true;
  } catch (err) {
    console.warn('Copy diagram to clipboard failed:', err);
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadDiagramPng(mode: ThemeMode = 'light', filename = 'rough-notebook.png'): Promise<void> {
  const blob = await exportToPngBlob(mode);
  downloadBlob(blob, filename);
}

export function downloadDiagramSvg(mode: ThemeMode = 'light', filename = 'rough-notebook.svg'): void {
  const svgText = generateDiagramSvg(mode);
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, filename);
}
