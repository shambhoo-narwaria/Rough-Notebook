import type { SketchStroke } from '../state/sketches.svelte';

export interface HandwritingRecognitionResult {
  ok: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

const DSA_REPLACEMENTS: Array<[RegExp, string]> = [
  // Big-O notations
  [/\b[oO0]\s*\(\s*1\s*\)/gi, 'O(1)'],
  [/\b[oO0]\s*\(\s*n\s*\)/gi, 'O(n)'],
  [/\b[oO0]\s*\(\s*log\s*n\s*\)/gi, 'O(log n)'],
  [/\b[oO0]\s*\(\s*n\s*log\s*n\s*\)/gi, 'O(n log n)'],
  [/\b[oO0]\s*\(\s*n\s*[\^2]\s*\)/gi, 'O(n^2)'],
  [/\b[oO0]\s*\(\s*n\^2\s*\)/gi, 'O(n^2)'],
  [/\b[oO0]\s*\(\s*v\s*\+\s*e\s*\)/gi, 'O(V + E)'],
  [/\b[oO0]\s*\(\s*k\s*\)/gi, 'O(k)'],

  // Common algorithm keywords
  [/\bdfs\b/gi, 'DFS'],
  [/\bbfs\b/gi, 'BFS'],
  [/\bdp\b/gi, 'dp'],
  [/\btarget\b/gi, 'target'],
  [/\bmod\b/gi, 'MOD'],

  // Array / Pointer indexing cleanups
  [/\b(arr|nums|dp|grid|vals|matrix)\s*\[\s*([a-zA-Z0-9_\-+]+)\s*\]/gi, '$1[$2]'],
  [/\b([a-zA-Z0-9_]+)\s*\-\s*>\s*([a-zA-Z0-9_]+)/g, '$1->$2'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*next\b/gi, '$1.next'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*val\b/gi, '$1.val'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*left\b/gi, '$1.left'],
  [/\b([a-zA-Z0-9_]+)\s*\.\s*right\b/gi, '$1.right'],

  // Operators
  [/\s*<=\s*/g, ' <= '],
  [/\s*>=\s*/g, ' >= '],
  [/\s*===\s*/g, ' === '],
  [/\s*==\s*/g, ' == '],
  [/\s*!=\s*/g, ' != '],
  [/\s*\+=\s*/g, ' += '],
  [/\s*\-=\s*/g, ' -= '],
];

function applyDsaPostProcessing(rawText: string): string {
  let cleaned = rawText.trim();
  for (const [pattern, replacement] of DSA_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

export async function recognizeHandwritingStrokes(
  strokes: SketchStroke[],
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
): Promise<HandwritingRecognitionResult> {
  if (strokes.length === 0) {
    return { ok: false, error: 'No strokes to recognize' };
  }

  const width = Math.max(120, Math.round(bbox.maxX - bbox.minX) + 40);
  const height = Math.max(80, Math.round(bbox.maxY - bbox.minY) + 40);

  // Format ink coordinate arrays expected by Handwriting IME
  const formattedInk = strokes.map((s) => {
    const xs = s.points.map((p) => Math.round(p.x - bbox.minX + 20));
    const ys = s.points.map((p) => Math.round(p.y - bbox.minY + 20));
    const ts = s.points.map((_, idx) => idx * 16);
    return [xs, ys, ts];
  });

  const payload = {
    options: 'enable_pre_space',
    requests: [
      {
        writing_guide: {
          writing_area_width: width,
          writing_area_height: height,
        },
        ink: formattedInk,
        language: 'en',
      },
    ],
  };

  try {
    const response = await fetch(
      'https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    if (!Array.isArray(data) || data[0] !== 'SUCCESS' || !data[1] || !data[1][0]) {
      return { ok: false, error: 'Recognition failed or returned empty' };
    }

    const candidates: string[] = data[1][0][1];
    if (!candidates || candidates.length === 0) {
      return { ok: false, error: 'No candidates found' };
    }

    const topCandidate = candidates[0].trim();
    if (!topCandidate || topCandidate.length === 0) {
      return { ok: false, error: 'Empty candidate string' };
    }

    // Evaluate confidence:
    // 1. Single stray dots/noise (< 2 strokes with 1-character non-letter) -> low confidence
    const totalPoints = strokes.reduce((acc, s) => acc + s.points.length, 0);
    if (totalPoints < 6 && topCandidate.length === 1 && !/[0-9a-zA-Z+\-*/=]/.test(topCandidate)) {
      return { ok: false, error: 'Stray mark or noise' };
    }

    // Check consistency across candidates: if top 3 candidates are similar, confidence is high
    let confidence = 0.85;
    if (candidates.length >= 3) {
      const c1 = candidates[0].toLowerCase();
      const c2 = candidates[1].toLowerCase();
      const c3 = candidates[2].toLowerCase();
      if (c1 === c2 || c1 === c3) {
        confidence = 0.95;
      }
    }

    const postProcessed = applyDsaPostProcessing(topCandidate);

    return {
      ok: true,
      text: postProcessed,
      confidence,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network request error',
    };
  }
}
