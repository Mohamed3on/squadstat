const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export async function fetchPage(url: string, revalidate?: number): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      headers: HEADERS,
      ...(revalidate !== undefined && { next: { revalidate } }),
    });
    const html = await response.text();
    // Transfermarkt rate-limit responses are ~146 bytes
    if (html.length > 500) return html;
    console.warn(`[fetch] Rate limited (${html.length}b), retry ${attempt + 1}/${MAX_RETRIES}: ${url}`);
    if (attempt < MAX_RETRIES - 1) {
      const jitter = Math.random() * 500;
      await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** attempt + jitter));
    }
  }
  throw new Error(`[fetch] Failed after ${MAX_RETRIES} retries: ${url}`);
}
