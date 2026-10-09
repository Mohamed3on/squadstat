import { createHash } from "node:crypto";
import { defineCloudflareConfig, getCloudflareContext } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

type IncrementalCache = Parameters<typeof withRegionalCache>[0];

const dataKey = (key: string) => `data-cache/${createHash("sha256").update(key).digest("hex")}`;

/** OpenNext keys every R2 entry by build, but a data-cache entry (unstable_cache) has to
 *  outlive deploys, as it did on Vercel: the data workflows deploy up to ~20 times a day,
 *  and each would otherwise re-scrape every Transfermarkt source on its first visits.
 *  Prerendered pages stay per build, since a deploy changes what they render. */
const r2KeepingDataAcrossDeploys: IncrementalCache = {
  // R2's own name, or the deploy skips uploading the build's prerenders to the bucket.
  name: r2IncrementalCache.name,
  async get(key, cacheType) {
    if (cacheType !== "fetch") return r2IncrementalCache.get(key, cacheType);
    const object = await getCloudflareContext().env.NEXT_INC_CACHE_R2_BUCKET?.get(dataKey(key));
    return object ? { value: await object.json(), lastModified: object.uploaded.getTime() } : null;
  },
  async set(key, value, cacheType) {
    if (cacheType !== "fetch") return r2IncrementalCache.set(key, value, cacheType);
    await getCloudflareContext().env.NEXT_INC_CACHE_R2_BUCKET?.put(
      dataKey(key),
      JSON.stringify(value),
    );
  },
  delete: (key) => r2IncrementalCache.delete(key),
};

// Data and prerenders live in R2 (fronted by each colo's Cache API), revalidateTag and
// revalidatePath stamps in D1, and ISR regeneration goes through a Durable Object queue.
// See https://opennext.js.org/cloudflare/caching.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2KeepingDataAcrossDeploys, { mode: "long-lived" }),
  queue: doQueue,
  tagCache: d1NextTagCache,
});
