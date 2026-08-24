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
│       ├── lib/                 shared Firestore/matching helpers
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

### How each source actually gets data

- **eBay:** the official, ToS-compliant **Browse API** — a plain
  authenticated REST call (OAuth client-credentials).
- **Goldin:** no documented public API, but its own `/buy` search page is
  backed by a plain JSON endpoint (`d1wu47wucybvr3.cloudfront.net/api/lots_v2`)
  that needs no auth or cookies — found by watching the network tab while
  using the site's real search box. `scraper/src/sources/goldin.js` calls it
  directly.
- **Fanatics Collect:** also no documented public API. Its search is Algolia
  under the hood: the site first fetches a short-lived, scoped search key
  from its GraphQL endpoint (`webSearchKeyQuery`), then queries Algolia
  directly with it. `scraper/src/sources/fanatics.js` replicates both calls.

All three sources are called with plain `fetch` — **no headless browser is
needed for any of them.** An earlier version of this scraper drove a
Playwright browser to scrape rendered HTML for Goldin/Fanatics, which turned
out to be the wrong approach: their `/search` pages don't reliably exist as
real URLs, real search happens through JS-driven API calls, and the
DOM-scraping heuristic silently pulled unrelated homepage carousel content in
testing. Hitting the same JSON APIs their own frontends use is both simpler
and far more reliable.

### Known limitations — read before relying on this

- **These are undocumented, internal APIs**, not public developer APIs. They
  can change or add rate limiting/auth requirements without notice — treat
  Goldin/Fanatics data as "best effort, verify before buying," and keep the
  hourly cadence (don't increase scrape frequency).
- **Title-based parallel tagging is a heuristic**, not exact. It's covered by
  a regression test (`scraper/test-match.mjs`, run in CI before every scrape)
  built from real listing titles pulled during development, which caught two
  real bugs: a raw substring match tagged an unrelated "RayWave" parallel as
  "Wave" (fixed by requiring whole-word, adjacent-phrase matches), and titles
  that abbreviate "Refractor" as "Ref" weren't matching at all (fixed by
  accepting both). A generic "Refractor (base)" fallback also risks catching
  untracked exclusive parallels (e.g. a Fanatics-only "Asia Refractor") that
  happen to contain the word "Refractor" — a small `exclude` list per
  parallel in `cards.json` guards against known cases; add to it if you spot
  a new one in the "Unmatched / Other" bucket. A color+print-run listing that
  omits the word "Refractor"/"Ref" entirely (sellers sometimes do this) will
  land in "Unmatched / Other" rather than being guessed at — that's a
  deliberate false-negative-over-false-positive tradeoff.
- **If a source fails on a given run** (network error, schema change), the
  scraper logs the error and leaves that source's last-known-good listings in
  Firestore untouched, rather than wiping them — check the colored status
  dots at the top of each card section in the UI to see per-source
  freshness/errors.
- A source returning zero results is not necessarily a bug — Goldin and
  Fanatics Collect are auction houses, not fixed inventory, so a given
  parallel may simply have no live listing at a given hour.
- Fanatics Collect has three listing types with different data shapes, found
  the hard way: Weekly/Premier auction images expose `medium`/`large` sizes,
  but Buy Now (`FIXED` marketplace) listings only expose `small`/`thumbnail`
  — missing those in the image fallback chain silently dropped every Buy Now
  listing's image. Their URL path also isn't `marketplace.toLowerCase()`:
  Weekly/Premier use `/weekly/`/`/premier/`, but Buy Now uses `/buy-now/`,
  not `/fixed/` — confirmed by watching the real search UI navigate, not
  guessed. Both are covered by `MARKETPLACE_PATH` in `fanatics.js`; if
  Fanatics adds a new marketplace type, listings of that type will link/image
  correctly only once that map is extended.

## Tech stack

- **Scraper:** Node 20, `firebase-admin`, plain `fetch` for all three sources
- **Frontend:** React 18, Vite 5, Tailwind CSS v4 (via `@tailwindcss/vite`,
  no `tailwind.config.js`), `firebase` (client SDK, Firestore only)
- **Storage:** Cloud Firestore
- **Scheduling:** GitHub Actions cron (hourly), `workflow_dispatch` for
  manual runs
- **Hosting:** Firebase Hosting (static build of `frontend/`)

## Updating the tracked card(s)

Edit `scraper/src/config/cards.json`. Each entry needs:

- `search.ebay` / `search.goldin` / `search.fanatics` — the query string sent
  to each site. Keep these broad (e.g. player surname + year + set, not every
  qualifier) — an overly specific phrase can return zero results even when
  matching listings exist.
- `relevanceKeywords` — words that must ALL appear in a title (whole word,
  anywhere) before it's kept at all; filters out unrelated products a broad
  keyword search can surface (a different year, a non-Chrome product,
  memorabilia, a case break).
- `relevancePhrases` — an OR-list of adjacent-word phrases; at least one must
  appear or the listing is dropped. This is the important one: it's what
  actually separates a real pack-pulled on-card autograph from a non-auto
  base card *and* from an aftermarket-signed card (someone signed a raw card
  later and got it authenticated) — `relevanceKeywords` alone can't tell
  those apart, since both can legitimately contain the word "auto" somewhere.
  Every genuine listing seen during testing used the card's own printed
  designation, "PROSPECT AUTO" or "ROOKIE AUTO", as an exact adjacent phrase;
  an aftermarket-signed card's listing doesn't organically use that phrasing.
- `parallels` — ordered most-specific-first; each has `match` (words that
  must appear as an adjacent phrase, in order — `"refractor"` also accepts
  the "Ref" abbreviation), optional `exclude` (words that veto an otherwise
  matching parallel), and optional `psa10Estimate` (a `[min, max]` reference
  range shown in the UI — supplied by hand, never scraped).
- `active: true/false` — set `false` to stop scraping a card without deleting
  its config or its Firestore history.

After editing `parallels`, run `npm test` in `scraper/` — it re-checks the
matcher against real titles seen during development and will catch an
accidental regression before it reaches production data.

No other code changes are needed to track a new card. Multiple `active: true`
cards run in the same hourly pass and each gets its own section in the UI.

## Status

Live: scraper (eBay Browse API + direct Goldin/Fanatics Collect API calls),
Firestore schema, React/Tailwind v4 frontend, and hourly GitHub Actions
workflow are all deployed and confirmed working end-to-end for Jacob
Misiorowski's 2022 Bowman Draft Chrome auto — Fanatics Collect is returning
real, correctly-tagged listings; Goldin currently has no live listings for
this specific card (confirmed via its API, not a bug); eBay is pending
developer account verification (`EBAY_CLIENT_ID`/`EBAY_CLIENT_SECRET` not yet
set).
