import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { fetchMinutesValueRaw } from "@/lib/fetch-minutes-value";
import { fetchPlayerMinutesRaw } from "@/lib/fetch-player-minutes";
import type { PlayerStatsResult } from "@/app/types";

const CONCURRENCY = 5;
const BATCH_DELAY_MS = 2000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry extends PlayerStatsResult {
  fetchedAt: number;
}

type PlayerCache = Record<string, CacheEntry>;

const CACHE_PATH = join(process.cwd(), "data", "player-cache.json");

async function loadCache(): Promise<PlayerCache> {
  try {
    const raw = await readFile(CACHE_PATH, "utf-8");
    return JSON.parse(raw) as PlayerCache;
  } catch {
    return {};
  }
}

async function saveCache(cache: PlayerCache): Promise<void> {
  await writeFile(CACHE_PATH, JSON.stringify(cache));
}

async function main() {
  console.log("[refresh] Fetching MV pages...");
  const players = await fetchMinutesValueRaw();
  console.log(`[refresh] Got ${players.length} players from MV pages`);

  const cache = await loadCache();
  const now = Date.now();

  const stale = players.filter((p) => {
    const entry = cache[p.playerId];
    return !entry || now - entry.fetchedAt > CACHE_TTL_MS;
  });
  console.log(`[refresh] ${stale.length} players need fresh stats (${players.length - stale.length} cached)`);

  for (let i = 0; i < stale.length; i += CONCURRENCY) {
    const batch = stale.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((p) => fetchPlayerMinutesRaw(p.playerId))
    );
    batch.forEach((p, j) => {
      if (results[j].status === "fulfilled") {
        cache[p.playerId] = { ...results[j].value, fetchedAt: now };
      }
    });
    console.log(`[refresh] Batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(stale.length / CONCURRENCY)}`);
    // Write cache after each batch for crash-safe partial progress
    await saveCache(cache);
    if (i + CONCURRENCY < stale.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // Merge cached stats into players
  for (const p of players) {
    const entry = cache[p.playerId];
    if (entry) {
      p.minutes = entry.minutes;
      p.totalMatches = entry.appearances || p.totalMatches;
      p.goals = entry.goals;
      p.assists = entry.assists;
      if (entry.club) p.club = entry.club;
      if (entry.league) p.league = entry.league;
    }
  }

  const outDir = join(process.cwd(), "data");
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "minutes-value.json");
  await writeFile(outPath, JSON.stringify(players));
  console.log(`[refresh] Wrote ${players.length} players to ${outPath}`);
}

main().catch((err) => {
  console.error("[refresh] Fatal error:", err);
  process.exit(1);
});
