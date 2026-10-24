/**
 * Dynamic predictive text and next-word suggestions engine.
 * Queries Google Input Tools and open predictive services for live completions,
 * with graceful offline caching and DSA token normalization.
 */

const suggestionCache = new Map<string, string[]>();

export async function fetchDynamicSuggestions(rawText: string): Promise<string[]> {
  const text = rawText.trim();
  if (!text) return [];

  const words = text.split(/\s+/);
  const lastWord = words[words.length - 1]?.trim().toLowerCase() ?? '';

  if (!lastWord || lastWord.length < 1) {
    return [];
  }

  // Check LRU cache
  if (suggestionCache.has(lastWord)) {
    return suggestionCache.get(lastWord)!;
  }

  const results: string[] = [];

  try {
    // 1. Google Input Tools API for dynamic word completion / suggestions
    const inputToolsPromise = fetch(`https://inputtools.google.com/request?text=${encodeURIComponent(lastWord)}&itc=en-t-i0-und&num=6&cp=0&cs=1&ie=utf-8&oe=utf-8`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data[0] === 'SUCCESS' && data[1]?.[0]?.[1]) {
          const candidates: string[] = data[1][0][1];
          return candidates.filter((c) => c.toLowerCase() !== lastWord);
        }
        return [];
      })
      .catch(() => []);

    // 2. Datamuse Bigram API for next-word prediction
    const datamusePromise = fetch(`https://api.datamuse.com/words?rel_bga=${encodeURIComponent(lastWord)}&max=6`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          return data
            .map((item: { word?: string }) => String(item.word ?? ''))
            .filter((w: string) => w.length > 1 && !/^[.,;:?!'"()]+$/.test(w));
        }
        return [];
      })
      .catch(() => []);

    const [completions, nextWords] = await Promise.all([
      inputToolsPromise,
      datamusePromise,
    ]);

    for (const item of [...nextWords, ...completions]) {
      const clean = item.trim();
      if (clean && !results.includes(clean) && clean.toLowerCase() !== lastWord) {
        results.push(clean);
      }
    }
  } catch {
    // Graceful error handling
  }

  const finalSuggestions = results.slice(0, 5);

  // Cache up to 100 entries
  if (suggestionCache.size > 100) {
    const firstKey = suggestionCache.keys().next().value;
    if (firstKey) suggestionCache.delete(firstKey);
  }
  suggestionCache.set(lastWord, finalSuggestions);

  return finalSuggestions;
}
