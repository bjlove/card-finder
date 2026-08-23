/**
 * Tags a listing title with the most specific matching parallel from the card's config.
 * Parallel entries must be ordered most-specific-first in cards.json — the first
 * entry whose `match` keywords are ALL present in the title wins.
 */
export function matchParallel(title, parallels) {
  const lower = title.toLowerCase();
  for (const parallel of parallels) {
    if (parallel.match.every((keyword) => lower.includes(keyword))) {
      return parallel.name;
    }
  }
  return null;
}
