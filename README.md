# Card Finder

## Purpose

Tracks live listings for specific baseball card parallels across three
marketplaces — **eBay**, **Goldin**, and **Fanatics Collect** — and displays
them in one page: image, price, buy-now vs. auction, and a direct link to the
listing. A scheduled job refreshes the data hourly.

The card list is config-driven (`scraper/src/config/cards.json`), so tracking
a different player/set, or adding more cards, does not require touching any
scraping or UI code.

Currently tracking: **2022 Bowman Draft Chrome Draft Pick Autographs —
Jacob Misiorowski (#CDA-JMI)**, across all 20 parallels (base Refractor
through the 1/1 Superfractor, Black Wave, and Printing Plates).

## Architecture

```
card-finder/
├── scraper/            Node.js — runs hourly via GitHub Actions
│   └── src/
│       ├── config/cards.json   ← edit this to add/change tracked cards
│       ├── sources/            ebay.js, goldin.js, fanatics.js
│       ├── lib/                 shared Firestore/browser/matching helpers
│       └── index.js             orchestrates all sources, writes to Firestore
├── frontend/            React + Vite + Tailwind v4 — reads Firestore live
├── firestore.rules      public read, no client writes
├── firebase.json        Hosting config for the built frontend
└── .github/workflows/scrape.yml   hourly cron trigger for the scraper
```

**Data flow:** GitHub Actions runs `scraper/` hourly → writes results to
Firestore (`listings/{cardId}`) via the Admin SDK → the React frontend
subscribes to that Firestore collection in real time via `onSnapshot`, so the
page updates automatically as new data lands, no polling or redeploy needed.

### Why this split (vs. an all-Firebase-Functions design)

eBay has an official, ToS-compliant **Browse API** — a plain authenticated
REST call, no scraping involved. Goldin and Fanatics Collect do not have a
public API; their listings only render via client-side JavaScript, so getting
data out requires a real headless browser (Playwright). Firebase's standard
Cloud Functions runtime isn't a good fit for running a full Chromium browser
(cold starts, memory/timeout limits), so the scraper runs as a plain Node
script on a schedule (GitHub Actions' free tier cron) instead, and Firebase is
used only for data storage (Firestore) and static hosting of the built React
app.

### Known limitations — read before relying on this

- **Goldin and Fanatics Collect do not have a documented public API.** The
  scrapers for these two (`scraper/src/sources/goldin.js`,
  `fanatics.js`) work by opening the site's search page in a headless browser
  and heuristically locating listing cards (an anchor linking to an item page,
  climbing to the nearest ancestor that also contains a price and an image —
  see `scraper/src/lib/extractListings.js`). This is a best-effort approach,
  not a verified selector set, because both sites actively resist plain
  automated fetches (Fanatics Collect returned HTTP 403 on a basic request
  during development; Goldin's search results are slow, heavy client-rendered
  JS). It may return zero results, partial results, or need adjustment after
  a site redesign.
- **Scraping these two sites may be against their Terms of Service.** Neither
  site's `robots.txt` blocks the search/item pages used here, but that is not
  the same as ToS permission, and both showed signs of active bot protection.
  This was a deliberate, informed choice (not a default) — see the "eBay
  only" and "official API only" alternatives below if that risk is not
  acceptable. Keep the hourly cadence; do not increase scrape frequency.
- **If a source fails on a given run** (blocked, timed out, redesigned), the
  scraper logs the error and leaves that source's last-known-good listings in
  Firestore untouched, rather than wiping them — check the colored status
  dots at the top of each card section in the UI to see per-source
  freshness/errors.
- eBay listing data is reliable (official API); treat Goldin/Fanatics data as
  "best effort, verify before buying."

## Tech stack

- **Scraper:** Node 20, `firebase-admin`, `playwright` (for Goldin/Fanatics),
  plain `fetch` (for eBay's Browse API)
- **Frontend:** React 18, Vite 5, Tailwind CSS v4 (via `@tailwindcss/vite`,
  no `tailwind.config.js`), `firebase` (client SDK, Firestore only)
- **Storage:** Cloud Firestore
- **Scheduling:** GitHub Actions cron (hourly), `workflow_dispatch` for
  manual runs
- **Hosting:** Firebase Hosting (static build of `frontend/`)

## Updating the tracked card(s)

Edit `scraper/src/config/cards.json`. Each entry needs:

- `search.ebay` / `search.goldin` / `search.fanatics` — the query string sent
  to each site
- `parallels` — ordered most-specific-first; each has `match` (keywords that
  must ALL appear in a listing title, lowercase) and optional `psa10Estimate`
  (a `[min, max]` reference range shown in the UI — supplied by hand, never
  scraped)
- `active: true/false` — set `false` to stop scraping a card without deleting
  its config or its Firestore history

No other code changes are needed to track a new card. Multiple `active: true`
cards run in the same hourly pass and each gets its own section in the UI.

## Status

Initial build: scraper (eBay Browse API + Playwright scrapers for
Goldin/Fanatics Collect), Firestore schema, React/Tailwind v4 frontend, and
hourly GitHub Actions workflow are all in place for Jacob Misiorowski's 2022
Bowman Draft Chrome auto. Not yet deployed — see "Missing Steps" in the setup
conversation for the manual account/credential steps required before this
runs live.
