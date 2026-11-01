import { cache } from "react";
import type { MarketValueMoversResult } from "@/app/types";
import { readData } from "@/lib/data";

async function readMovers(file: string): Promise<MarketValueMoversResult> {
  const data = await readData<MarketValueMoversResult>(file);
  return {
    ...data,
    repeatMovers: [...data.repeatMovers].sort(
      (a, b) =>
        b.reduce((s, m) => s + m.absoluteChange, 0) - a.reduce((s, m) => s + m.absoluteChange, 0),
    ),
  };
}

// Published data (lib/data.ts), sorted per request and deduped with React cache.
export const findRepeatLosers = cache(() => readMovers("biggest-losers.json"));
export const findRepeatWinners = cache(() => readMovers("biggest-winners.json"));
