/**
 * Goldin has no documented public API, but its own search UI is backed by a
 * plain JSON endpoint (found by inspecting the network tab on goldin.co/buy)
 * that requires no auth/cookies. Calling it directly is far more reliable
 * than scraping rendered HTML — no headless browser needed.
 */
const LOTS_API = "https://d1wu47wucybvr3.cloudfront.net/api/lots_v2";
const IMAGE_BASE = "https://d2tt46f3mh26nl.cloudfront.net/public/Lots";

export async function searchGoldin(query) {
  const res = await fetch(LOTS_API, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      search: { queryType: "Featured", keyword: query, size: 50, from: 0, hasAnalyticsConsent: true },
    }),
  });

  if (!res.ok) {
    throw new Error(`Goldin lots_v2 request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const lots = data.searchalgolia?.lots ?? [];

  return lots
    .filter((lot) => lot.status === "Live")
    .map((lot) => ({
      source: "goldin",
      title: lot.title,
      price: lot.current_price > 0 ? lot.current_price : lot.min_bid_price,
      currency: "USD",
      image: lot.lot_id && lot.primary_image_name ? `${IMAGE_BASE}/${lot.lot_id}/${lot.primary_image_name}@1x` : null,
      url: `https://goldin.co/item/${lot.meta_slug}`,
      listingType: "auction",
      auctionEndTime: lot.end_timestamp ?? null,
      condition: null,
      seller: null,
    }));
}
