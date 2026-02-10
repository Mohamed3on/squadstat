import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { fetchMinutesValueRaw } from "@/lib/fetch-minutes-value";
import { fetchTopScorersRaw } from "@/lib/fetch-top-scorers";
import { fetchPlayerMinutesRaw } from "@/lib/fetch-player-minutes";
import type { PlayerStatsResult } from "@/app/types";

const INITIAL_CONCURRENCY = 30;
const MIN_CONCURRENCY = 5;
const INITIAL_DELAY_MS = 500;
const BACKOFF_MULTIPLIER = 2;
const FAILURE_THRESHOLD = 0.3;
const CLEAN_BATCHES_TO_RAMP_UP = 3;

type PlayerCache = Record<string, PlayerStatsResult>;
type PlayerEntry = { playerId: string };

const CACHE_PATH = join(process.cwd(), "data", "player-cache.json");

async function saveCache(cache: PlayerCache): Promise<void> {
  await writeFile(CACHE_PATH, JSON.stringify(cache));
}

async function fetchBatched(
  players: PlayerEntry[],
  cache: PlayerCache,
  state: { concurrency: number; delayMs: number },
) {
  let cleanStreak = 0;
  let batchNum = 0;
  const failed: PlayerEntry[] = [];
  const total = players.length;

  for (let i = 0; i < total; i += state.concurrency) {
    batchNum++;
    const batch = players.slice(i, i + state.concurrency);
    const results = await Promise.allSettled(
      batch.map((p) => fetchPlayerMinutesRaw(p.playerId))
    );

    let batchFailures = 0;
    batch.forEach((p, j) => {
      if (results[j].status === "fulfilled") {
        cache[p.playerId] = results[j].value;
      } else {
        batchFailures++;
        failed.push(p);
      }
    });

    const failRate = batchFailures / batch.length;
    if (failRate > FAILURE_THRESHOLD && state.concurrency > MIN_CONCURRENCY) {
      state.concurrency = Math.max(MIN_CONCURRENCY, Math.floor(state.concurrency / 2));
      state.delayMs *= BACKOFF_MULTIPLIER;
      cleanStreak = 0;
      console.log(`[refresh] Batch ${batchNum}: ${batchFailures}/${batch.length} failed → concurrency=${state.concurrency}, delay=${state.delayMs}ms`);
    } else {
      console.log(`[refresh] Batch ${batchNum}: ${batch.length - batchFailures}/${batch.length} ok (${Object.keys(cache).length}/${total} total)`);
      if (batchFailures === 0) {
        cleanStreak++;
        if (cleanStreak >= CLEAN_BATCHES_TO_RAMP_UP && state.concurrency < INITIAL_CONCURRENCY) {
          state.concurrency = Math.min(INITIAL_CONCURRENCY, state.concurrency * 2);
          state.delayMs = Math.max(INITIAL_DELAY_MS, Math.floor(state.delayMs / BACKOFF_MULTIPLIER));
          cleanStreak = 0;
          console.log(`[refresh] Ramping up → concurrency=${state.concurrency}, delay=${state.delayMs}ms`);
        }
      } else {
        cleanStreak = 0;
      }
    }

    await saveCache(cache);
    if (i + state.concurrency < total) {
      await new Promise((r) => setTimeout(r, state.delayMs));
    }
  }

  return failed;
}

async function main() {
  console.log("[refresh] Fetching MV pages...");
  const players = await fetchMinutesValueRaw();
  console.log(`[refresh] Got ${players.length} players from MV pages`);

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
  const state = { concurrency: INITIAL_CONCURRENCY, delayMs: INITIAL_DELAY_MS };
  console.log(`[refresh] Fetching stats for ${players.length} players (concurrency: ${state.concurrency})...`);

  const failed = await fetchBatched(players, cache, state);

  // Retry failures once with conservative settings
  if (failed.length > 0) {
    console.log(`[refresh] Retrying ${failed.length} failed players...`);
    state.concurrency = MIN_CONCURRENCY;
    state.delayMs = INITIAL_DELAY_MS * 4;
    const stillFailed = await fetchBatched(failed, cache, state);
    if (stillFailed.length > 0) {
      console.warn(`[refresh] ${stillFailed.length} players failed permanently: ${stillFailed.map((p) => p.playerId).join(", ")}`);
    }
  }

  // Merge stats into players
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
  console.log(`[refresh] Done: ${Object.keys(cache).length}/${players.length} players fetched → ${outPath}`);
}

main().catch((err) => {
  console.error("[refresh] Fatal error:", err);
  process.exit(1);
});
