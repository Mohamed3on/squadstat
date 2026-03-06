import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";
import { fetchMinutesValueRaw } from "@/lib/fetch-minutes-value";
import { fetchTopScorersRaw, fetchYearlyScorersRaw } from "@/lib/fetch-top-scorers";
import { fetchPlayerMinutesRaw } from "@/lib/fetch-player-minutes";
import type { MinutesValuePlayer, PlayerStatsResult } from "@/app/types";

const CONCURRENCY = { max: 50, min: 10 };
const DELAY = { base: 200, multiplier: 2 };
const FAILURE_THRESHOLD = 0.3;
const CLEAN_BATCHES_TO_RAMP = 3;
const MAX_RETRY_ROUNDS = 5;

const DATA_DIR = join(process.cwd(), "data");
const OUT_PATH = join(DATA_DIR, "minutes-value.json");
const CACHE_PATH = join(DATA_DIR, "player-cache.json");

type Cache = Record<string, PlayerStatsResult>;

// --- 1. Gather & dedupe player pool ---

async function gatherPlayers(): Promise<MinutesValuePlayer[]> {
  console.log("[refresh] Fetching player lists...");
  const [mvPlayers, seasonScorers, yearlyScorers] = await Promise.all([
    fetchMinutesValueRaw(),
    fetchTopScorersRaw(),
    fetchYearlyScorersRaw(),
  ]);

  if (mvPlayers.length === 0) {
    throw new Error("0 players from MV pages — likely rate-limited.");
  }

  const seen = new Set<string>();
  const players: MinutesValuePlayer[] = [];
  for (const { label, list } of [
    { label: "MV", list: mvPlayers },
    { label: "season scorers", list: seasonScorers },
    { label: "yearly scorers", list: yearlyScorers },
  ]) {
    let added = 0;
    for (const p of list) {
      if (!seen.has(p.playerId)) {
        seen.add(p.playerId);
        players.push(p);
        added++;
      }
    }
    console.log(`[refresh] ${label}: +${added} new (${list.length} total)`);
  }

  if (players.length < 100) {
    throw new Error(`Only ${players.length} players — expected 100+.`);
  }
  return players;
}

// --- 2. Fetch per-player stats with adaptive concurrency ---

async function fetchAllStats(playerIds: string[]): Promise<Cache> {
  const cache: Cache = {};
  let remaining = [...playerIds];

  for (let round = 0; round <= MAX_RETRY_ROUNDS && remaining.length > 0; round++) {
    if (round > 0) console.log(`[refresh] Retry ${round}: ${remaining.length} remaining`);

    const state = {
      concurrency: round === 0 ? CONCURRENCY.max : CONCURRENCY.min,
      delay: DELAY.base * (round === 0 ? 1 : 2 ** round),
      cleanStreak: 0,
    };
    const failed: string[] = [];

    for (let i = 0; i < remaining.length; i += state.concurrency) {
      const batch = remaining.slice(i, i + state.concurrency);
      const results = await Promise.allSettled(batch.map((id) => fetchPlayerMinutesRaw(id)));

      let failures = 0;
      for (let j = 0; j < batch.length; j++) {
        const r = results[j];
        if (r.status === "fulfilled") cache[batch[j]] = r.value;
        else { failures++; failed.push(batch[j]); }
      }

      const failRate = failures / batch.length;
      if (failRate > FAILURE_THRESHOLD && state.concurrency > CONCURRENCY.min) {
        state.concurrency = Math.max(CONCURRENCY.min, state.concurrency >> 1);
        state.delay *= DELAY.multiplier;
        state.cleanStreak = 0;
      } else if (failures === 0 && ++state.cleanStreak >= CLEAN_BATCHES_TO_RAMP && state.concurrency < CONCURRENCY.max) {
        state.concurrency = Math.min(CONCURRENCY.max, state.concurrency * 2);
        state.delay = Math.max(DELAY.base, state.delay >> 1);
        state.cleanStreak = 0;
      } else if (failures > 0) {
        state.cleanStreak = 0;
      }

      console.log(`[refresh] ${Object.keys(cache).length}/${playerIds.length} fetched (batch: ${batch.length - failures}/${batch.length} ok)`);
      await writeFile(CACHE_PATH, JSON.stringify(cache));

      if (i + state.concurrency < remaining.length) {
        await new Promise((r) => setTimeout(r, state.delay));
      }
    }
    remaining = failed;
  }

  if (remaining.length > 0) {
    throw new Error(`${remaining.length} players failed after ${MAX_RETRY_ROUNDS} rounds: ${remaining.join(", ")}`);
  }
  return cache;
}

// --- 3. Merge fetched stats into player objects ---

function mergeStats(players: MinutesValuePlayer[], cache: Cache): void {
  for (const p of players) {
    const s = cache[p.playerId];
    if (!s) continue;

    p.minutes = s.minutes;
    p.totalMatches = s.appearances || p.totalMatches;
    p.goals = s.goals;
    p.assists = s.assists;
    p.penaltyGoals = s.penaltyGoals;
    p.penaltyMisses = s.penaltyMisses;
    p.intlGoals = s.intlGoals;
    p.intlAssists = s.intlAssists;
    p.intlMinutes = s.intlMinutes;
    p.intlAppearances = s.intlAppearances;
    p.intlPenaltyGoals = s.intlPenaltyGoals;
    p.intlCareerCaps = s.intlCareerCaps;
    p.gamesMissed = s.gamesMissed;

    if (s.club) p.club = s.club;
    if (s.clubLogoUrl) p.clubLogoUrl = s.clubLogoUrl;
    if (s.league) p.league = s.league;
    if (s.nationalityFlagUrl) p.nationalityFlagUrl = s.nationalityFlagUrl;
    if (s.leagueLogoUrl) p.leagueLogoUrl = s.leagueLogoUrl;
    if (s.contractExpiry) p.contractExpiry = s.contractExpiry;
    if (s.playedPosition) p.playedPosition = s.playedPosition;
    if (s.recentForm?.length) p.recentForm = s.recentForm;
    if (s.marketValue) { p.marketValue = s.marketValue; p.marketValueDisplay = s.marketValueDisplay; }

    s.isCurrentIntl ? (p.isCurrentIntl = true) : delete p.isCurrentIntl;
    s.isNewSigning ? (p.isNewSigning = true) : delete p.isNewSigning;
    s.isOnLoan ? (p.isOnLoan = true) : delete p.isOnLoan;
  }
}

// --- 4. Validate ---

async function validate(players: MinutesValuePlayer[], cache: Cache): Promise<void> {
  const fetched = players.filter((p) => cache[p.playerId]);
  const zeroCount = fetched.filter((p) => p.goals === 0 && p.assists === 0 && p.minutes === 0).length;
  if (fetched.length > 50 && zeroCount / fetched.length > 0.8) {
    throw new Error(`${zeroCount}/${fetched.length} players have zero stats — scraping issue.`);
  }

  try {
    const existing: MinutesValuePlayer[] = JSON.parse(await readFile(OUT_PATH, "utf-8"));
    const oldGA = existing.reduce((s, p) => s + p.goals + p.assists, 0);
    const newGA = players.reduce((s, p) => s + p.goals + p.assists, 0);
    if (oldGA > 100 && newGA < oldGA * 0.5) {
      throw new Error(`Stats regressed: G+A ${oldGA} → ${newGA} (${Math.round((newGA / oldGA) * 100)}%).`);
    }
    console.log(`[refresh] G+A: ${oldGA} → ${newGA} (${newGA >= oldGA ? "+" : ""}${newGA - oldGA})`);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Stats regressed")) throw e;
  }
}

// --- Main pipeline ---

async function main() {
  const players = await gatherPlayers();

  console.log(`[refresh] Fetching stats for ${players.length} players...`);
  const cache = await fetchAllStats(players.map((p) => p.playerId));

  mergeStats(players, cache);
  await validate(players, cache);

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(players));
  await writeFile(join(DATA_DIR, "updated-at.txt"), new Date().toISOString());
  console.log(`[refresh] Done: ${players.length} players → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("[refresh] Fatal:", err);
  process.exit(1);
});
