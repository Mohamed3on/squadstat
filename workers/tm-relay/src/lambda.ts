/**
 * The same relay, run on AWS Lambda behind a Function URL. Transfermarkt's WAF started
 * answering every Cloudflare egress IP with a CloudFront 403 in Oct 2026 — Workers fetches
 * included, so the Worker relay and the production site both lost Transfermarkt — while AWS egress
 * is still served. This adapts the Function URL event to the Worker's fetch handler, so the
 * secret check, host allowlist and header scrubbing stay in one place (index.ts).
 *
 * Function `squadstat-tm-relay` in eu-central-1 (nearest Transfermarkt's Hamburg origin),
 * RELAY_SECRET in its environment. Deployed by hand: `workers/tm-relay/deploy-lambda.sh`.
 */
import { gzipSync } from "node:zlib";
import relay from "./index";

interface FunctionUrlEvent {
  rawPath: string;
  rawQueryString: string;
  headers: Record<string, string>;
}

export async function handler(event: FunctionUrlEvent) {
  const request = new Request(`https://lambda${event.rawPath}?${event.rawQueryString}`, {
    headers: event.headers,
  });
  const response = await relay.fetch(request, { RELAY_SECRET: process.env.RELAY_SECRET ?? "" });
  const headers = Object.fromEntries(response.headers);
  // AWS bills egress past 100 GB a month, and the refresh alone relays ~2 GB of HTML a day.
  // Gzip cuts that ~6x; Bun's and Workers' fetch both ask for it and undo it transparently.
  if (!event.headers["accept-encoding"]?.includes("gzip")) {
    return { statusCode: response.status, headers, body: await response.text() };
  }
  return {
    statusCode: response.status,
    headers: { ...headers, "content-encoding": "gzip" },
    body: gzipSync(await response.arrayBuffer()).toString("base64"),
    isBase64Encoded: true,
  };
}
