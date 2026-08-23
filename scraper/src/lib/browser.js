import { chromium } from "playwright";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Opens a single headless page with a normal desktop browser fingerprint.
 * Caller is responsible for calling `close()` when done.
 */
export async function openPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1366, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();

  return {
    page,
    close: () => browser.close(),
  };
}

/**
 * Runs `fn(page)` with retries and a fresh page each attempt. Marketplace
 * sites like Goldin/Fanatics can be slow or return anti-bot challenge pages
 * intermittently — this retries a couple times before giving up, rather than
 * failing the whole hourly run over one flaky load.
 */
export async function withRetries(fn, { attempts = 3, delayMs = 4000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const { page, close } = await openPage();
    try {
      return await fn(page);
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt}/${attempts} failed: ${err.message}`);
    } finally {
      await close();
    }
    if (attempt < attempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}
