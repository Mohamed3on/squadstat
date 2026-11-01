// OpenNext's generated worker only handles fetch; this wraps it to add the hourly cron
// declared in wrangler.jsonc, run as a request to its route, and the data workflow's door
// to the data bucket.
// Excluded from tsconfig: type-checking would follow this import into the build output.

// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";

interface Env {
  CRON_SECRET: string;
  DATA_SECRET?: string;
  DATA_BUCKET: {
    get(key: string): Promise<{ body: ReadableStream; httpEtag: string } | null>;
    put(key: string, value: ArrayBuffer): Promise<unknown>;
  };
}

/** `/_data/<file>`: the data workflow reads (GET) and publishes (PUT) the data files
 *  (scripts/outputs.ts) that lib/data.ts serves pages from. Handled here, before OpenNext,
 *  so it never loads the Next server. Without DATA_SECRET (a Preview) it doesn't exist. */
async function dataFile(request: Request, env: Env, file: string): Promise<Response> {
  if (!env.DATA_SECRET || request.headers.get("authorization") !== `Bearer ${env.DATA_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!/^[a-z0-9-]+\.(json|txt)$/.test(file)) return new Response("Bad file", { status: 400 });
  if (request.method === "PUT") {
    await env.DATA_BUCKET.put(file, await request.arrayBuffer());
    return new Response("Stored", { status: 201 });
  }
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const object = await env.DATA_BUCKET.get(file);
  return object
    ? new Response(object.body, { headers: { etag: object.httpEtag } })
    : new Response("Not found", { status: 404 });
}

export default {
  fetch(request: Request, env: Env, ctx: unknown) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/_data/")) return dataFile(request, env, pathname.slice(7));
    return handler.fetch(request, env, ctx);
  },
  async scheduled(_controller: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const request = new Request("https://squadstat.com/api/cron/refresh", {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    ctx.waitUntil(handler.fetch(request, env, ctx));
  },
};

// @ts-ignore `.open-next/worker.js` is generated at build time
export { DOQueueHandler } from "./.open-next/worker.js";
