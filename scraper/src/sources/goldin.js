import { withRetries } from "../lib/browser.js";
import { extractListingsInPage, parsePriceText } from "../lib/extractListings.js";

const BASE_URL = "https://www.goldin.co";

export async function searchGoldin(query) {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;

  return withRetries(async (page) => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    // Client-rendered results — give the app time to fetch and paint listings.
    await page.waitForTimeout(6000);

    const raw = await page.evaluate(extractListingsInPage, /\/item\//);

    return raw
      .map((item) => ({
        source: "goldin",
        title: item.title,
        price: parsePriceText(item.priceText),
        currency: "USD",
        image: item.imageSrc?.startsWith("http") ? item.imageSrc : `${BASE_URL}${item.imageSrc ?? ""}`,
        url: item.href?.startsWith("http") ? item.href : `${BASE_URL}${item.href}`,
        listingType: "auction",
        auctionEndTime: null,
        condition: null,
        seller: null,
      }))
      .filter((item) => item.price !== null);
  });
}
