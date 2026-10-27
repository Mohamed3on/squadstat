import { AsyncLocalStorage } from "node:async_hooks";
import { tmFetch } from "./tm-relay";

/** The one door to www.transfermarkt.com. Everything a TM request needs —
 *  the shared concurrency limiter, retry/backoff policy, the rate-limit and
 *  WAF-block heuristics, relay routing (via tm-relay), and the JSON contract —
 *  lives behind `fetchPage` / `fetchJson`. Callers never hand-roll retries or
 *  call `tmFetch` directly; the alpha API host is the only sanctioned plain
 *  `fetch` (it is not WAF-blocked and must not go through the relay). */

const BASE_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Cache-Control": "no-cache",
};

const JSON_HEADERS: Record<string, string> = {
  "User-Agent": BASE_HEADERS["User-Agent"],
  Accept: "application/json",
};

// The relay answers its own rejections with exactly these bodies
// (workers/tm-relay/src/index.ts): a bad secret, a host outside the allowlist,
// a bad url param. Any other 403/405/429 is Transfermarkt's AWS WAF — its
// rate-based block is a bare 403 with no body, its CAPTCHA an HTML 405 — and
// that one is transient:
// Workers egress IPs rotate per request, so the retry lands on a different
// address. Retrying a relay rejection never helps.
const RELAY_REJECTIONS = new Set([
  "forbidden",
  "host not allowed",
  "missing url param",
  "malformed url param",
]);
const isWafBlock = (status: number, body: string) =>
  (status === 403 || status === 405 || status === 429) && !RELAY_REJECTIONS.has(body);

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const onWorkers = globalThis.navigator?.userAgent === "Cloudflare-Workers";

/** Set around a refresh's scrapes (lib/copies.ts). Anything else on a Worker is a page
 *  render, which tries each fetch twice so a Transfermarkt outage costs its visitor seconds,
 *  not minutes; refreshes, CI scripts and local dev keep all five attempts. */
export const refreshing = new AsyncLocalStorage<boolean>();
// Transfermarkt pages average ~4s, so wall time is roughly sum(latency)/maxConcurrent.
// Measured across 12 history pages: 4 concurrent → 3.6s, 12 concurrent → 1.7s, with no
// rate-limiting or 5xx from TM either way. 10 keeps most of that win with headroom.
// Never on Workers: one isolate serves many requests, and a request queued here behind
// another's fetch has no I/O of its own, so the runtime kills it as hung (error 1101). The
// requests it kills can strand slots, wedging the isolate until it recycles. Workers already
// cap each request at six open connections.
let maxConcurrent = onWorkers ? Infinity : 10;

/** Override the concurrency limit (e.g. for batch scripts with their own backoff).
 *  Call it inside the script's main(), never at module scope — import order
 *  must not decide which script's limit wins. */
export function setMaxConcurrent(n: number) {
  maxConcurrent = n;
}

let active = 0;
const queue: (() => void)[] = [];

async function acquireSlot() {
  while (active >= maxConcurrent) {
    await new Promise<void>((resolve) => queue.push(resolve));
  }
  active++;
}

function releaseSlot() {
  active--;
  queue.shift()?.();
}

type BodyCheck<T> = (body: string) => { ok: true; value: T } | { ok: false; reason: string };

// Transfermarkt rate-limit responses are ~146 bytes — only these are worth
// retrying. A blocked IP answers 200 with an empty body, which lands here too.
const htmlBody: BodyCheck<string> = (body) =>
  body.length > 500
    ? { ok: true, value: body }
    : { ok: false, reason: `rate limited / blocked (${body.length}b)` };

// Valid JSON can be tiny, so no length heuristic: a WAF empty-200 or an HTML
// maintenance page simply fails to parse and retries.
const jsonBody: BodyCheck<unknown> = (body) => {
  try {
    return { ok: true, value: JSON.parse(body) };
  } catch {
    return { ok: false, reason: `non-JSON body (${body.length}b)` };
  }
};

async function fetchWithRetries<T>(
  url: string,
  init: RequestInit,
  check: BodyCheck<T>,
): Promise<T> {
  let lastReason = "";
  const attempts = onWorkers && !refreshing.getStore() ? 2 : MAX_RETRIES;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await tmFetch(url, init);
      if (response.status >= 400 && response.status < 500) {
        const reason = (await response.text().catch(() => "")).trim();
        if (isWafBlock(response.status, reason)) {
          lastReason = `HTTP ${response.status} from Transfermarkt`;
          console.warn(
            `[fetch] ${lastReason} (WAF block), retry ${attempt + 1}/${attempts}: ${url}`,
          );
        } else {
          // Relay rejection or a plain 404 — retrying never helps. The relay
          // explains itself in the body, so carry it into the error: the status
          // alone can't tell a bad secret from a dead upstream.
          throw new Error(`HTTP ${response.status}${reason ? `: ${reason.slice(0, 120)}` : ""}`);
        }
      } else if (response.status >= 500) {
        // 5xx = TM outage/maintenance — transient by nature. Cancel the unread body: on a
        // Worker it holds one of the request's six connections until the runtime cancels it
        // "to prevent deadlock", stalling every fetch queued behind it.
        await response.body?.cancel();
        lastReason = `HTTP ${response.status}`;
        console.warn(`[fetch] ${lastReason}, retry ${attempt + 1}/${attempts}: ${url}`);
      } else {
        const result = check(await response.text());
        if (result.ok) return result.value;
        lastReason = result.reason;
        console.warn(`[fetch] ${lastReason}, retry ${attempt + 1}/${attempts}: ${url}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("HTTP ")) throw err; // 4xx stays fatal
      lastReason = msg;
      console.warn(`[fetch] ${msg}, retry ${attempt + 1}/${attempts}: ${url}`);
    }
    if (attempt < attempts - 1) {
      const jitter = Math.random() * 500;
      await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** attempt + jitter));
    }
  }
  throw new Error(`[fetch] Failed after ${attempts} retries (${lastReason || "unknown"}): ${url}`);
}

/** Always no-store: a scrape must see Transfermarkt's current page, never Next's fetch
 *  cache, or a refresh would replace a copy with hours-old HTML. */
export async function fetchPage(
  url: string,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  await acquireSlot();
  try {
    return await fetchWithRetries(
      url,
      { headers: { ...BASE_HEADERS, ...extraHeaders }, cache: "no-store" },
      htmlBody,
    );
  } finally {
    releaseSlot();
  }
}

/** Fetch a TM JSON endpoint (e.g. ceapi) with the same slotting, relay routing
 *  and retry policy as fetchPage. Returns the parsed value; shape checks stay
 *  with the caller. Always no-store — JSON endpoints are refresh territory. */
export async function fetchJson(
  url: string,
  extraHeaders?: Record<string, string>,
): Promise<unknown> {
  await acquireSlot();
  try {
    return await fetchWithRetries(
      url,
      { headers: { ...JSON_HEADERS, ...extraHeaders }, cache: "no-store" },
      jsonBody,
    );
  } finally {
    releaseSlot();
  }
}
