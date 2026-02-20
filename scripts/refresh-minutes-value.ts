import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { fetchMinutesValueRaw } from "@/lib/fetch-minutes-value";
import { fetchTopScorersRaw } from "@/lib/fetch-top-scorers";
import { fetchPlayerMinutesRaw } from "@/lib/fetch-player-minutes";
import type { MinutesValuePlayer } from "@/app/types";
import type { PlayerStatsResult } from "@/app/types";

const INITIAL_CONCURRENCY = 30;
const MIN_CONCURRENCY = 5;
const INITIAL_DELAY_MS = 500;
const BACKOFF_MULTIPLIER = 2;
const FAILURE_THRESHOLD = 0.3;
const CLEAN_BATCHES_TO_RAMP_UP = 3;
const MAX_RETRY_ROUNDS = 5;
const MIN_EXPECTED_PLAYERS = 100;

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

async function fetchWithRetry(
  players: PlayerEntry[],
  cache: PlayerCache,
): Promise<void> {
  const state = { concurrency: INITIAL_CONCURRENCY, delayMs: INITIAL_DELAY_MS };
  let remaining = players;

  for (let round = 0; round < MAX_RETRY_ROUNDS; round++) {
    if (round > 0) {
      state.concurrency = MIN_CONCURRENCY;
      state.delayMs = INITIAL_DELAY_MS * 2 ** round;
      console.log(`[refresh] Retry round ${round}: ${remaining.length} players (concurrency=${state.concurrency}, delay=${state.delayMs}ms)`);
    }

    remaining = await fetchBatched(remaining, cache, state);
    if (remaining.length === 0) return;
  }

  throw new Error(`${remaining.length} players failed after ${MAX_RETRY_ROUNDS} rounds: ${remaining.map((p) => p.playerId).join(", ")}`);
}

async function main() {
  console.log("[refresh] Fetching MV pages...");
  const players = await fetchMinutesValueRaw();
  console.log(`[refresh] Got ${players.length} players from MV pages`);

  if (players.length === 0) {
    throw new Error("Got 0 players from MV pages — likely rate-limited. Aborting to protect existing data.");
  }

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

  if (players.length < MIN_EXPECTED_PLAYERS) {
    throw new Error(`Only got ${players.length} players (expected ${MIN_EXPECTED_PLAYERS}+). Aborting to protect existing data.`);
  }

  const cache: PlayerCache = {};
  console.log(`[refresh] Fetching stats for ${players.length} players (concurrency: ${INITIAL_CONCURRENCY})...`);

  await fetchWithRetry(players, cache);

  // Merge stats into players
  for (const p of players) {
    const entry = cache[p.playerId];
    if (entry) {
      p.minutes = entry.minutes;
      p.totalMatches = entry.appearances || p.totalMatches;
      p.goals = entry.goals;
      p.assists = entry.assists;
      p.penaltyGoals = entry.penaltyGoals;
      p.penaltyMisses = entry.penaltyMisses;
      p.intlGoals = entry.intlGoals;
      p.intlAssists = entry.intlAssists;
      p.intlMinutes = entry.intlMinutes;
      p.intlAppearances = entry.intlAppearances;
      p.intlPenaltyGoals = entry.intlPenaltyGoals;
      p.intlCareerCaps = entry.intlCareerCaps;
      if (entry.contractExpiry) p.contractExpiry = entry.contractExpiry;
      if (entry.playedPosition) p.playedPosition = entry.playedPosition;
      if (entry.club) p.club = entry.club;
      if (entry.clubLogoUrl) p.clubLogoUrl = entry.clubLogoUrl;
      if (entry.league) p.league = entry.league;
      if (entry.isNewSigning) {
        p.isNewSigning = true;
      } else {
        delete p.isNewSigning;
      }
      if (entry.isOnLoan) {
        p.isOnLoan = true;
      } else {
        delete p.isOnLoan;
      }
    }
  }

  // Guard 1: abort if stats look broken (>80% of fetched players have zero goals+assists+minutes)
  const fetched = players.filter((p) => cache[p.playerId]);
  const allZero = fetched.filter((p) => p.goals === 0 && p.assists === 0 && p.minutes === 0);
  if (fetched.length > 50 && allZero.length / fetched.length > 0.8) {
    throw new Error(
      `${allZero.length}/${fetched.length} players have zero stats — likely a scraping issue. Aborting to protect existing data.`
    );
  }

  // Guard 2: regression check — compare total stats against existing data
  const outDir = join(process.cwd(), "data");
  const outPath = join(outDir, "minutes-value.json");
  try {
    const existing: MinutesValuePlayer[] = JSON.parse(await readFile(outPath, "utf-8"));
    const oldTotal = existing.reduce((s, p) => s + p.goals + p.assists, 0);
    const newTotal = players.reduce((s, p) => s + p.goals + p.assists, 0);
    if (oldTotal > 100 && newTotal < oldTotal * 0.5) {
      throw new Error(
        `Stats regressed: old total G+A=${oldTotal}, new=${newTotal} (${Math.round(newTotal / oldTotal * 100)}%). Aborting to protect existing data.`
      );
    }
    console.log(`[refresh] Stats check: old G+A=${oldTotal}, new=${newTotal} (${newTotal >= oldTotal ? "+" : ""}${newTotal - oldTotal})`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Stats regressed")) throw e;
    console.log("[refresh] No existing data to compare against, skipping regression check");
  }

  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(players));
  await writeFile(join(outDir, "updated-at.txt"), new Date().toISOString());
  console.log(`[refresh] Done: ${Object.keys(cache).length}/${players.length} players → ${outPath}`);
}

main().catch((err) => {
  console.error("[refresh] Fatal error:", err);
  process.exit(1);
});
