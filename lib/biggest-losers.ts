import { readFile } from "fs/promises";
import { join } from "path";
import type { MarketValueMoversResult } from "@/app/types";

/** Reads pre-built JSON data committed to the repo. */
export async function findRepeatLosers(): Promise<MarketValueMoversResult> {
  const filePath = join(process.cwd(), "data", "biggest-losers.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as MarketValueMoversResult;
}
