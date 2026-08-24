/**
 * Goldin/Fanatics search by free-text keyword, which can surface unrelated
 * products (a different year's card, memorabilia, a case break) that happen
 * to share the player's name. Without this filter those could get
 * incorrectly tagged with a parallel name just because their title also
 * contains e.g. "gold" and "refractor". Requires ALL of the card's
 * `relevanceKeywords` to appear in the title before it's kept at all.
 */
export function filterRelevant(listings, relevanceKeywords = []) {
  if (relevanceKeywords.length === 0) return listings;

  return listings.filter((listing) => {
    if (!listing.title) return false;
    const lower = listing.title.toLowerCase();
    return relevanceKeywords.every((keyword) => lower.includes(keyword.toLowerCase()));
  });
}
