/**
 * Tags a listing title with the most specific matching parallel from the card's config.
 * Parallel entries must be ordered most-specific-first in cards.json — the first
 * entry whose `match` phrase is found (and whose `exclude` words are absent) wins.
 *
 * `match` keywords must appear ADJACENT, in order, as whole words (e.g.
 * ["blue","wave"] only matches literal "Blue Wave", not a title with those
 * two words elsewhere) — a plain "does the title contain each word anywhere"
 * check turned out too loose on real listing titles: "wave" as a raw
 * substring matched inside "RayWave" (an unrelated, untracked parallel), and
 * titles routinely abbreviate "Refractor" as "Ref" ("Green Ref"), which an
 * exact "refractor" substring check missed entirely. `match: ["refractor"]`
 * now also accepts "ref". Optional `exclude` words (whole word, anywhere in
 * the title) veto an otherwise-matching parallel — used for the generic
 * "Refractor (base)" fallback so it doesn't swallow untracked exclusive
 * parallels (e.g. "Asia Refractor") that happen to contain the word
 * "Refractor" without any of the tracked color qualifiers.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatchRegex(match) {
  const parts = match.map((keyword) => (keyword === "refractor" ? "(?:refractor|ref)" : escapeRegex(keyword)));
  return new RegExp(`\\b${parts.join("\\s+")}\\b`, "i");
}

function buildExcludeRegex(word) {
  return new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
}

export function matchParallel(title, parallels) {
  for (const parallel of parallels) {
    if (!buildMatchRegex(parallel.match).test(title)) continue;
    if (parallel.exclude?.some((word) => buildExcludeRegex(word).test(title))) continue;
    return parallel.name;
  }
  return null;
}
