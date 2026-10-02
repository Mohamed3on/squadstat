/** Batch lookups against TM's alpha API, used by the refresh script: club types
 *  for data/club-types.json, and players' second nationalities. */

const ALPHA_API = "https://tmapi-alpha.transfermarkt.technology";
const ALPHA_BATCH = 40;
const HEADERS = { "User-Agent": "Mozilla/5.0", Accept: "application/json" };

/** One `ids[]=` batch after another, keeping whatever `read` finds per item.
 *  Missing/failed IDs are omitted and HTTP/connection failures go to `logger`:
 *  these lookups are best-effort enrichment, so a flaky alpha host never aborts
 *  the refresh (the caller tolerates a partial map and re-tries misses next run). */
async function batchLookup<T>(
  path: string,
  ids: string[],
  read: (item: Record<string, any>) => T | null | undefined,
  logger: (msg: string) => void,
): Promise<Record<string, T>> {
  const out: Record<string, T> = {};
  for (let i = 0; i < ids.length; i += ALPHA_BATCH) {
    const batch = ids.slice(i, i + ALPHA_BATCH);
    const url = `${ALPHA_API}${path}?${batch.map((id) => `ids[]=${id}`).join("&")}`;
    const label = `alpha ${path} batch ${i / ALPHA_BATCH}`;
    try {
      const r = await fetch(url, { headers: HEADERS });
      if (!r.ok) {
        logger(`${label}: HTTP ${r.status}`);
        continue;
      }
      const j = (await r.json()) as { data?: Record<string, any>[] };
      for (const item of j.data ?? []) {
        const value = read(item);
        if (value != null) out[item.id] = value;
      }
    } catch (err) {
      logger(`${label}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return out;
}

/** clubId → clubTypeId, for the IDs the API responded for. */
export function fetchClubTypes(
  ids: string[],
  logger: (msg: string) => void = console.warn,
): Promise<Record<string, number>> {
  return batchLookup(
    "/clubs",
    ids,
    (c) => (typeof c.baseDetails?.clubTypeId === "number" ? c.baseDetails.clubTypeId : null),
    logger,
  );
}

/** playerId → TM country id of the player's second nationality, for dual
 *  nationals only — the profile header shows just the first. */
export function fetchSecondNationalities(
  ids: string[],
  logger: (msg: string) => void = console.warn,
): Promise<Record<string, number>> {
  return batchLookup(
    "/players",
    ids,
    (p) => p.nationalityDetails?.nationalities?.secondNationalityId ?? null,
    logger,
  );
}
