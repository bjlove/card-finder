/**
 * Fanatics Collect has no documented public API, but its own search UI
 * fetches a short-lived, scoped Algolia key from its GraphQL endpoint
 * (webSearchKeyQuery) and queries Algolia directly from the browser. Both
 * calls work fine with plain fetch — no auth, no cookies, no headless
 * browser needed. This replaced an earlier DOM-scraping approach: the
 * previously assumed /search page doesn't exist (404s), and the real
 * search page (/marketplace) is behind client-side rendering that a plain
 * scrape can't see anyway.
 */
const GRAPHQL_URL = "https://app.fanaticscollect.com/graphql";
const ALGOLIA_APP_ID = "3XT9C4X62I";
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`;

// Confirmed by watching the real search UI navigate to each type — FIXED
// (buy-now) listings live under /buy-now/, not /fixed/ as first assumed.
const MARKETPLACE_PATH = { WEEKLY: "weekly", PREMIER: "premier", FIXED: "buy-now" };

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getSearchKey() {
  const res = await fetch(`${GRAPHQL_URL}?webSearchKeyQuery`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      operationName: "webSearchKeyQuery",
      variables: {},
      query: "query webSearchKeyQuery { collectSearchKeyV2 { key validUntil __typename } }",
    }),
  });

  if (!res.ok) {
    throw new Error(`Fanatics search-key request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.data.collectSearchKeyV2.key;
}

export async function searchFanatics(query) {
  const key = await getSearchKey();

  const params = new URLSearchParams({
    "x-algolia-agent": "Algolia for JavaScript (card-finder)",
    "x-algolia-api-key": key,
    "x-algolia-application-id": ALGOLIA_APP_ID,
  });

  const res = await fetch(`${ALGOLIA_URL}?${params}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          indexName: "prod_item_state_v1",
          query,
          type: "default",
          page: 0,
          hitsPerPage: 48,
          filters: 'status:"Live"',
          attributesToRetrieve: [
            "listingUuid",
            "marketplace",
            "title",
            "currentPrice",
            "status",
            "images.primary",
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Fanatics Algolia search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const hits = data.results?.[0]?.hits ?? [];

  return hits
    .filter((hit) => hit.status === "Live")
    .map((hit) => ({
      source: "fanatics",
      title: hit.title,
      price: hit.currentPrice ?? null,
      currency: "USD",
      image:
        hit.images?.primary?.medium ??
        hit.images?.primary?.large ??
        hit.images?.primary?.small ??
        hit.images?.primary?.thumbnail ??
        null,
      url: `https://www.fanaticscollect.com/${MARKETPLACE_PATH[hit.marketplace] ?? hit.marketplace.toLowerCase()}/${hit.listingUuid}/${slugify(hit.title)}`,
      listingType: hit.marketplace === "FIXED" ? "buy_now" : "auction",
      auctionEndTime: null,
      condition: null,
      seller: null,
    }));
}
