import { cache } from "react";
import { getCopy } from "./copies";
import { getCurrentMarketValues } from "./current-values";
import { analyzeTransfers, type FeeVsValueData } from "./fee-vs-value";
import { TOP_TRANSFER_LIMIT } from "./constants";
import { fetchTopTransfers } from "./fetch-top-transfers";
import { canonicalLeagueName } from "./leagues";

/** The scrape, and only the scrape.
 *
 *  Transfers move once a day at most outside a deadline, and the whole fetch is
 *  16 pages, so a day-old copy costs one scrape a day and keeps the page instant.
 *
 *  The row limit is part of the copy's key because it is the one thing about the
 *  scrape a deploy can change: without it, raising the limit lands on a copy still
 *  holding the old count and the page quotes the previous number for a day.
 *
 *  What is copied is the raw table, which moves only when the scraper does —
 *  not the analysis on top of it. Copies outlive deployments, so anything inside
 *  the scrape keeps being served after a deploy that changed how it works. That
 *  cost the unstable_cache before them a hand-bumped SHAPE_VERSION, nine of them,
 *  and the failure whenever someone forgot was silent: re-basing `ratio` on today's
 *  value left every type satisfied and the page served the previous formula's
 *  numbers for a day. Keeping the derivation outside means a deploy cannot ship
 *  beside a stale computation, because there is no stored computation. */
export const topTransfersSource = {
  key: `top-transfers-${TOP_TRANSFER_LIMIT}`,
  label: "top transfers",
  maxAge: 86400,
  scrape: () => fetchTopTransfers(),
};

const fetchCached = () => getCopy(topTransfersSource);

/** Priced against today's market values, fresh on every request.
 *
 *  `analyzeTransfers` is a map over 400 rows against a process-memoised lookup,
 *  so running it per request costs nothing measurable and buys back the whole
 *  cache-invalidation problem. It also drops `getDataVersion` from the picture:
 *  the committed dataset is no longer read from inside a cached region, so there
 *  is nothing to key on to make a data deploy miss. React's `cache` still
 *  dedupes it within a single render. */
export const getFeeVsValueData = cache(async (): Promise<FeeVsValueData> => {
  const [{ season, transfers }, currentValues] = await Promise.all([
    fetchCached(),
    getCurrentMarketValues(),
  ]);
  // Spelled canonically here rather than in the scrape, so a day-old cached table
  // can't carry Transfermarkt's "LaLiga" past a deploy.
  const canonical = transfers.map((t) => ({
    ...t,
    from: { ...t.from, league: canonicalLeagueName(t.from.league) },
    to: { ...t.to, league: canonicalLeagueName(t.to.league) },
  }));
  return analyzeTransfers(season, canonical, currentValues);
});
