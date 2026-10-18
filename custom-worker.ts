// OpenNext's generated worker only handles fetch; this wraps it to add the crons declared in
// wrangler.jsonc, each run as a request to its route.
// Excluded from tsconfig: type-checking would follow this import into the build output.

// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

interface Env {
  CRON_SECRET: string;
}

const CRON_ROUTES: Record<string, string> = {
  "0 * * * *": "/api/cron/refresh",
  "0 6 * * *": "/api/cron/warm-cache",
};

export default {
  fetch: handler.fetch,
  async scheduled(
    controller: { cron: string },
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void },
  ) {
    const request = new Request(`https://squadstat.com${CRON_ROUTES[controller.cron]}`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(handler.fetch(request, env, ctx));
  },
};

// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler } from "./.open-next/worker.js";
