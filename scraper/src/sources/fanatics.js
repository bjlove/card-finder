import { withRetries } from "../lib/browser.js";
import { extractListingsInPage, parsePriceText } from "../lib/extractListings.js";

const BASE_URL = "https://www.fanaticscollect.com";

export async function searchFanatics(query) {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;

  return withRetries(async (page) => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    // Client-rendered results — give the app time to fetch and paint listings.
    await page.waitForTimeout(6000);

    // Fanatics Collect listing pages live under /weekly/{id} (Weekly auction)
    // or /premier/{id} (Premier auction).
    const raw = await page.evaluate(extractListingsInPage, /\/(weekly|premier)\//);

    return raw
      .map((item) => ({
        source: "fanatics",
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
