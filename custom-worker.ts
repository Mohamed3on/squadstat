// OpenNext's generated worker only handles fetch; this wraps it to add the daily
// cron that warms the Transfermarkt-backed pages (app/api/cron/warm-cache).
// Excluded from tsconfig: type-checking would follow this import into the build output.

// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

interface Env {
  CRON_SECRET: string;
}

export default {
  fetch: handler.fetch,
  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const request = new Request("https://squadstat.com/api/cron/warm-cache", {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(handler.fetch(request, env, ctx));
  },
};

// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler } from "./.open-next/worker.js";
