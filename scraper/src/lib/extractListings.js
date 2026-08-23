/**
 * Generic "find listing-like cards" extraction, run inside the page via
 * page.evaluate(). Written generically because Goldin/Fanatics Collect are
 * client-rendered marketplaces without a documented public API — this looks
 * for an anchor matching `linkPattern`, then climbs to the smallest ancestor
 * that also contains a price and an image, rather than depending on exact
 * class names that will change on redesign.
 *
 * NOTE: this is a best-effort heuristic, not a verified selector set (see
 * README "Known limitations"). If it returns zero results on a page that
 * clearly has listings, the fix is almost always to open the page in a real
 * browser, inspect one listing card, and hand the actual container/price/
 * image selectors back so this can be replaced with exact selectors.
 */
export function extractListingsInPage(linkPattern) {
  const priceRegex = /\$\s?[\d,]+(?:\.\d{2})?/;
  const anchors = Array.from(document.querySelectorAll("a[href]")).filter((a) =>
    linkPattern.test(a.getAttribute("href") || "")
  );

  const seen = new Set();
  const results = [];

  for (const anchor of anchors) {
    // Walk up a few levels looking for a container that has both a price and an image.
    let container = anchor;
    let priceText = null;
    let imageSrc = null;

    for (let depth = 0; depth < 6 && container; depth++) {
      if (!priceText) {
        const match = container.textContent?.match(priceRegex);
        if (match) priceText = match[0];
      }
      if (!imageSrc) {
        const img = container.querySelector("img");
        if (img) imageSrc = img.getAttribute("src") || img.getAttribute("data-src");
      }
      if (priceText && imageSrc) break;
      container = container.parentElement;
    }

    const href = anchor.getAttribute("href") || "";
    if (!priceText || seen.has(href)) continue;
    seen.add(href);

    const title =
      anchor.getAttribute("title") ||
      anchor.textContent?.trim().split("\n")[0]?.trim() ||
      container?.querySelector("h1,h2,h3,h4,[class*='title'],[class*='name']")?.textContent?.trim() ||
      null;

    results.push({
      href,
      title,
      priceText,
      imageSrc,
    });
  }

  return results;
}

export function parsePriceText(priceText) {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}
