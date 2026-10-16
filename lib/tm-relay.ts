/**
 * www.transfermarkt.com's AWS WAF blocks GitHub's Azure ranges, answering them with HTTP 200
 * and an empty body — no 403, and no captcha to solve, since a hard block serves no challenge
 * widget. Since Oct 2026 it also answers Cloudflare's egress with a CloudFront 403, which takes
 * out the production Worker too. AWS egress is still served, so CI and production both relay
 * their Transfermarkt fetches through workers/tm-relay running on Lambda.
 *
 * Every fetch goes through the relay rather than trying direct first: a direct-first fallback
 * would need block-detection in every caller to be correct.
 *
 * TM_RELAY_URL is set in the Actions workflow and as a production Worker secret. Local dev
 * leaves it unset and fetches direct — a home IP isn't blocked.
 *
 * Only route www.transfermarkt.com through tmFetch. The alpha API host
 * (tmapi-alpha.transfermarkt.technology — national-career, club-types) is NOT WAF-blocked and
 * works direct from datacenter IPs, so those calls use plain fetch, never tmFetch.
 */

/**
 * Fetch a www.transfermarkt.com URL through the relay when one is configured, else direct.
 * Relay rejections surface as 4xx/5xx, which callers already treat as fatal rather than retry.
 */
export async function tmFetch(url: string, init?: RequestInit): Promise<Response> {
  const relay = process.env.TM_RELAY_URL;
  if (!relay) return fetch(url, init);

  return fetch(`${relay}?url=${encodeURIComponent(url)}`, {
    ...init,
    headers: { ...init?.headers, "X-Relay-Secret": process.env.TM_RELAY_SECRET ?? "" },
  });
}
