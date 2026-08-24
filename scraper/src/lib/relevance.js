/**
 * Goldin/Fanatics search by free-text keyword, which can surface unrelated
 * products (a different year's card, memorabilia, a non-Chrome base card, a
 * case break) that happen to share the player's name. Without this filter
 * those could get incorrectly tagged with a parallel name just because their
 * title also contains e.g. "gold" and "refractor".
 *
 * Two gates, both applied:
 *  - `relevanceKeywords`: every word must appear (anywhere, whole word).
 *  - `relevancePhrases`: at least one listed adjacent-word phrase must
 *    appear. This is what actually separates real pack-pulled on-card
 *    autographs from everything else — every genuine listing seen during
 *    testing for this product used "PROSPECT AUTO" or "ROOKIE AUTO" as an
 *    exact adjacent phrase (that's Topps' own printed card designation,
 *    which resellers copy verbatim), so requiring it also excludes non-auto
 *    base cards AND aftermarket-signed cards (a raw card someone got signed
 *    later and had authenticated) — those don't organically carry that
 *    phrase. A bare "auto" keyword check alone wasn't enough to tell those
 *    apart; this phrase requirement is the actual distinguishing signal.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseRegex(words) {
  return new RegExp(`\\b${words.map(escapeRegex).join("\\s+")}\\b`, "i");
}

export function filterRelevant(listings, relevanceKeywords = [], relevancePhrases = []) {
  return listings.filter((listing) => {
    if (!listing.title) return false;

    if (relevanceKeywords.length > 0) {
      const keywordsOk = relevanceKeywords.every((keyword) =>
        new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i").test(listing.title)
      );
      if (!keywordsOk) return false;
    }

    if (relevancePhrases.length > 0) {
      const phraseOk = relevancePhrases.some((phrase) => phraseRegex(phrase).test(listing.title));
      if (!phraseOk) return false;
    }

    return true;
  });
}
