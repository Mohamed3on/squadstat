import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { fetchMinutesValueRaw } from "@/lib/fetch-minutes-value";
import { fetchTopScorersRaw } from "@/lib/fetch-top-scorers";
import { fetchPlayerMinutesRaw } from "@/lib/fetch-player-minutes";
import type { PlayerStatsResult } from "@/app/types";

const CONCURRENCY = 10;
const BATCH_DELAY_MS = 2000;

type PlayerCache = Record<string, PlayerStatsResult>;

const CACHE_PATH = join(process.cwd(), "data", "player-cache.json");

async function saveCache(cache: PlayerCache): Promise<void> {
  await writeFile(CACHE_PATH, JSON.stringify(cache));
}

async function main() {
  console.log("[refresh] Fetching MV pages...");
  const players = await fetchMinutesValueRaw();
  console.log(`[refresh] Got ${players.length} players from MV pages`);

  // Merge top scorers not already in MV set
  console.log("[refresh] Fetching top scorers...");
  const scorers = await fetchTopScorersRaw();
  const mvIds = new Set(players.map((p) => p.playerId));
  let added = 0;
  for (const scorer of scorers) {
    if (!mvIds.has(scorer.playerId)) {
      players.push(scorer);
      mvIds.add(scorer.playerId);
      added++;
    }
  }
  console.log(`[refresh] Added ${added} new players from top scorers (${scorers.length} total, ${scorers.length - added} already in MV)`);

  const cache: PlayerCache = {};

  console.log(`[refresh] Fetching stats for ${players.length} players...`);

  for (let i = 0; i < players.length; i += CONCURRENCY) {
    const batch = players.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((p) => fetchPlayerMinutesRaw(p.playerId))
    );
    batch.forEach((p, j) => {
      if (results[j].status === "fulfilled") {
        cache[p.playerId] = results[j].value;
      }
    });
    console.log(`[refresh] Batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(players.length / CONCURRENCY)}`);
    // Write cache after each batch for crash-safe partial progress
    await saveCache(cache);
    if (i + CONCURRENCY < players.length) {
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
      if (entry.isNewSigning) {
        p.isNewSigning = true;
      } else {
        delete p.isNewSigning;
      }
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
