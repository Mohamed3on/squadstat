import { getCloudflareContext } from "@opennextjs/cloudflare";

/** A source (CONTEXT.md): a Transfermarkt dataset scraped as one unit. Its copy, the last
 *  complete scrape, lives in R2 so that pages read it instead of scraping (docs/adr/0001). */
export interface Source<T> {
  /** Names the copy in R2. Copies outlive deploys, so bump it when the scrape's shape
   *  changes, or a deploy reads a copy of the old shape. */
  key: string;
  /** Seconds a copy may age before the scheduled refresh re-scrapes it. */
  maxAge: number;
  /** One whole scrape. Throws unless Transfermarkt answered completely, since only a
   *  complete scrape may replace a copy. */
  scrape: () => Promise<T>;
}

// The copies share the bucket OpenNext keeps its cache in (a Preview gets its own), under
// their own prefix. Async mode also works under `next dev`, where it binds a local R2.
async function bucket() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.NEXT_INC_CACHE_R2_BUCKET) throw new Error("[copies] no R2 bucket bound");
  return env.NEXT_INC_CACHE_R2_BUCKET;
}

const path = (source: Source<unknown>) => `copies/${source.key}.json`;

/** When the source's copy was taken, or null if it has none. R2 stamps each object with its
 *  upload, which is the moment its scrape finished. */
export async function copyTakenAt(source: Source<unknown>): Promise<Date | null> {
  return (await (await bucket()).head(path(source)))?.uploaded ?? null;
}

/** The scheduled refresh runs on the hour, and counts a copy as due ten minutes before its
 *  maximum age: a copy taken a few seconds after one tick would otherwise wait out an extra
 *  hour at the tick where it falls due. */
const TICK_SLACK = 10 * 60;

export type RefreshOutcome = "refreshed" | "fresh" | "failed";

/** The scheduled refresh of one source: re-scrape it once its copy reaches its maximum age.
 *  A failed or incomplete scrape leaves the old copy in place. */
export async function refreshIfDue(source: Source<unknown>): Promise<RefreshOutcome> {
  const takenAt = await copyTakenAt(source);
  if (takenAt && Date.now() - takenAt.getTime() < (source.maxAge - TICK_SLACK) * 1000) {
    return "fresh";
  }
  try {
    const data = await source.scrape();
    await (await bucket()).put(path(source), JSON.stringify(data));
    return "refreshed";
  } catch (error) {
    console.error(`[copies] ${source.key} not refreshed, its copy stays:`, error);
    return "failed";
  }
}
