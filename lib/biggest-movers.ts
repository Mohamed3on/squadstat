import { cache } from "react";
import type { MarketValueMoversResult } from "@/app/types";
import biggestLosers from "@/data/biggest-losers.json";
import biggestWinners from "@/data/biggest-winners.json";

async function readMovers(json: unknown): Promise<MarketValueMoversResult> {
  const data = json as MarketValueMoversResult;
  return {
    ...data,
    repeatMovers: [...data.repeatMovers].sort(
      (a, b) =>
        b.reduce((s, m) => s + m.absoluteChange, 0) - a.reduce((s, m) => s + m.absoluteChange, 0),
    ),
  };
}

// Bundled into the build, sorted per request and deduped with React cache. These JSONs
// only change via data-refresh deploys, so a cross-deploy unstable_cache could only
// serve them stale.
export const findRepeatLosers = cache(() => readMovers(biggestLosers));
export const findRepeatWinners = cache(() => readMovers(biggestWinners));
