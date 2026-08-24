import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { db } from "./lib/firestore.js";
import { matchParallel } from "./lib/matchParallel.js";
import { filterRelevant } from "./lib/relevance.js";
import { searchEbay } from "./sources/ebay.js";
import { searchGoldin } from "./sources/goldin.js";
import { searchFanatics } from "./sources/fanatics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { cards } = JSON.parse(readFileSync(join(__dirname, "config/cards.json"), "utf8"));

const SOURCES = [
  { key: "ebay", run: searchEbay },
  { key: "goldin", run: searchGoldin },
  { key: "fanatics", run: searchFanatics },
];

async function runSourceForCard(card, source) {
  const query = card.search[source.key];
  const statusUpdate = { lastAttempt: new Date().toISOString() };

  try {
    const listings = await source.run(query);
    const relevant = filterRelevant(listings, card.relevanceKeywords, card.relevancePhrases);
    const tagged = relevant.map((listing) => ({
      ...listing,
      parallel: listing.title ? matchParallel(listing.title, card.parallels) : null,
    }));

    statusUpdate.ok = true;
    statusUpdate.lastSuccess = statusUpdate.lastAttempt;
    statusUpdate.error = null;
    statusUpdate.count = tagged.length;

    console.log(`[${card.id}] ${source.key}: ${tagged.length} listings`);
    return { items: tagged, status: statusUpdate, wrote: true };
  } catch (err) {
    statusUpdate.ok = false;
    statusUpdate.error = err.message;
    console.error(`[${card.id}] ${source.key} FAILED: ${err.message}`);
    // Don't overwrite last-known-good listings for this source — just record the failure.
    return { items: null, status: statusUpdate, wrote: false };
  }
}

async function main() {
  for (const card of cards.filter((c) => c.active)) {
    const docRef = db.collection("listings").doc(card.id);

    const update = {
      player: card.player,
      year: card.year,
      set: card.set,
      cardNumber: card.cardNumber,
      parallels: card.parallels,
      updatedAt: new Date().toISOString(),
      sourceStatus: {},
      items: {},
    };

    for (const source of SOURCES) {
      const result = await runSourceForCard(card, source);
      update.sourceStatus[source.key] = result.status;
      if (result.wrote) {
        update.items[source.key] = result.items;
      }
    }

    // Nested-object merge: only the source keys present above are touched,
    // so a failed source's last-known-good `items.<source>` array survives.
    await docRef.set(update, { merge: true });
  }

  console.log("Scrape run complete.");
}

main().catch((err) => {
  console.error("Fatal error in scrape run:", err);
  process.exit(1);
});
