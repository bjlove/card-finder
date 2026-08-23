/**
 * eBay Browse API (official, ToS-compliant REST API — no scraping).
 * Docs: https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search
 * Requires a free eBay Developer account + an application's Client ID/Secret
 * (Application Access OAuth token, client_credentials grant).
 */

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID / EBAY_CLIENT_SECRET are not set (see scraper/.env.example)");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay OAuth token request failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Refresh a couple minutes early to avoid edge-of-expiry failures.
  cachedTokenExpiry = Date.now() + (data.expires_in - 120) * 1000;
  return cachedToken;
}

function normalizeItem(item) {
  const buyingOptions = item.buyingOptions ?? [];
  const isAuction = buyingOptions.includes("AUCTION");

  return {
    source: "ebay",
    title: item.title,
    price: item.price ? Number(item.price.value) : null,
    currency: item.price?.currency ?? "USD",
    image: item.image?.imageUrl ?? item.thumbnailImages?.[0]?.imageUrl ?? null,
    url: item.itemWebUrl,
    listingType: isAuction ? "auction" : "buy_now",
    auctionEndTime: isAuction ? item.itemEndDate ?? null : null,
    condition: item.condition ?? null,
    seller: item.seller?.username ?? null,
  };
}

export async function searchEbay(query) {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    q: query,
    limit: "50",
    // Sports Trading Cards category — narrows results away from unrelated listings.
    category_ids: "261328",
  });

  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });

  if (!res.ok) {
    throw new Error(`eBay search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return (data.itemSummaries ?? []).map(normalizeItem);
}
