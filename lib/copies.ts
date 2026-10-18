import { cache } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { refreshing } from "./fetch";

/** A source (CONTEXT.md): a Transfermarkt dataset scraped as one unit. Its copy, the last
 *  complete scrape, lives in R2 so that pages read it instead of scraping (docs/adr/0001). */
export interface Source<T> {
  /** Names the copy in R2. Copies outlive deploys, so bump it when the scrape's shape
   *  changes, or a deploy reads a copy of the old shape. */
  key: string;
  /** What the refresh toast calls it when Transfermarkt didn't answer. */
  label: string;
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

const write = async (source: Source<unknown>, data: unknown) =>
  (await bucket()).put(path(source), JSON.stringify(data));

/** The copy a page shows, read once per render. A source with no copy yet (a new source, an
 *  empty bucket, local dev) is scraped here and stored: the one case where a page scrapes a
 *  source. */
export const getCopy = cache(async <T>(source: Source<T>): Promise<T> => {
  const object = await (await bucket()).get(path(source));
  if (object) return object.json<T>();
  const data = await source.scrape();
  await write(source, data);
  return data;
});

/** When the source's copy was taken, or null if it has none. R2 stamps each object with its
 *  upload, which is the moment its scrape finished. */
export async function copyTakenAt(source: Source<unknown>): Promise<Date | null> {
  return (await (await bucket()).head(path(source)))?.uploaded ?? null;
}

/** A copy under five minutes old is never re-scraped: repeat presses of the refresh button,
 *  or a bot looping on its public endpoint, re-render instead of hammering Transfermarkt. */
const MIN_AGE = 5 * 60;

/** The scheduled refresh runs on the hour, and counts a copy as due ten minutes before its
 *  maximum age: a copy taken a few seconds after one tick would otherwise wait out an extra
 *  hour at the tick where it falls due. */
const TICK_SLACK = 10 * 60;

export type RefreshOutcome = "refreshed" | "fresh" | "failed";

/** The header button's refresh of one source. */
export const refreshSource = (source: Source<unknown>) => refreshOlderThan(source, MIN_AGE);

/** The scheduled refresh of one source: once its copy reaches its maximum age. */
export const refreshIfDue = (source: Source<unknown>) =>
  refreshOlderThan(source, source.maxAge - TICK_SLACK);

/** Re-scrape a source and replace its copy, unless the copy is younger than `seconds`. A
 *  failed or incomplete scrape leaves the old copy in place. */
async function refreshOlderThan(source: Source<unknown>, seconds: number): Promise<RefreshOutcome> {
  const takenAt = await copyTakenAt(source);
  if (takenAt && Date.now() - takenAt.getTime() < seconds * 1000) return "fresh";
  try {
    await write(source, await refreshing.run(true, source.scrape));
    return "refreshed";
  } catch (error) {
    console.error(`[copies] ${source.key} not refreshed, its copy stays:`, error);
    return "failed";
  }
}
