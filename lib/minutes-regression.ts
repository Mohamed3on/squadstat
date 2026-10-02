import type { MinutesValuePlayer } from "@/app/types";

export interface RegressionReport {
  /** Players whose drop looks like a real scrape failure. */
  scattered: MinutesValuePlayer[];
  /** Clubs where most players regressed together (likely TM match void/postpone). */
  ignoredClubs: string[];
  /** Players ignored because their whole club regressed. */
  ignoredCount: number;
  /** Tolerated count of scattered drops before failing. */
  maxScattered: number;
  /** True when scattered drops exceed maxScattered — caller should fail. */
  fail: boolean;
}

export const MINUTES_DROP_TOLERANCE = 5;

/**
 * Classify per-player minute regressions as either:
 *   1. Whole-club corrections (TM voids/postpones a match → all club players lose ~90'), or
 *   2. Scattered individual drops (legit TM stat tweaks, tolerated up to a cap), or
 *   3. A real scrape failure (`fail: true`).
 */
export function analyzeMinutesRegressions(
  oldPlayers: MinutesValuePlayer[],
  newPlayers: MinutesValuePlayer[],
): RegressionReport {
  const oldById = new Map(oldPlayers.map((p) => [p.playerId, p]));
  const regressed = newPlayers.filter((p) => {
    const old = oldById.get(p.playerId);
    return !!old && old.minutes - p.minutes > MINUTES_DROP_TOLERANCE;
  });

  const clubKey = (p: MinutesValuePlayer) => p.club ?? "?";
  const totalByClub = new Map<string, number>();
  for (const p of newPlayers) totalByClub.set(clubKey(p), (totalByClub.get(clubKey(p)) ?? 0) + 1);
  const regressedByClub = new Map<string, number>();
  for (const p of regressed)
    regressedByClub.set(clubKey(p), (regressedByClub.get(clubKey(p)) ?? 0) + 1);

  const wholeClub = new Set<string>();
  for (const [club, n] of regressedByClub) {
    if (n >= 3 && n / (totalByClub.get(club) ?? 1) >= 0.5) wholeClub.add(club);
  }
  const scattered = regressed.filter((p) => !wholeClub.has(clubKey(p)));
  const maxScattered = Math.max(10, Math.floor(newPlayers.length * 0.02));

  return {
    scattered,
    ignoredClubs: [...wholeClub].sort(),
    ignoredCount: regressed.length - scattered.length,
    maxScattered,
    fail: scattered.length > maxScattered,
  };
}

export function sampleRegressionDrops(
  oldPlayers: MinutesValuePlayer[],
  regressed: MinutesValuePlayer[],
  n = 5,
): string {
  const oldById = new Map(oldPlayers.map((p) => [p.playerId, p]));
  return regressed
    .slice(0, n)
    .map((p) => `${p.name} (${oldById.get(p.playerId)!.minutes}' → ${p.minutes}')`)
    .join(", ");
}

export interface PublishVerdict {
  /** Why the rows must not be written; empty means they may. */
  failures: string[];
  /** Tolerated oddities, worth a line in the run log. */
  warnings: string[];
  /** The figures the checks measured, for the run log. */
  notes: string[];
}

/**
 * The minutes-value refresh's one publish gate. It judges exactly the rows about
 * to be written against the last committed file, both through the same top-flight
 * filter, so like meets like: judged before that filter, the rows still carried
 * scorer-pool goals and players about to be dropped, which leaned the G+A and
 * player-count guards toward passing.
 */
export function publishVerdict({
  committed,
  rows,
  pool,
  seasonChanged,
  skipMinutesRegression,
}: {
  /** Last run's committed rows; null when nothing has been committed yet. */
  committed: MinutesValuePlayer[] | null;
  /** The exact rows about to be written. */
  rows: MinutesValuePlayer[];
  /** Every player the refresh gathered. Only the market-value check reads it: a
   *  player without a value never reaches `rows`, so there it could never fail. */
  pool: MinutesValuePlayer[];
  seasonChanged: boolean;
  /** SKIP_MINUTES_REGRESSION=1, the escape hatch for an intentional aggregation
   *  change (e.g. tightening the first-team filter). Kept narrow: it tolerates the
   *  minutes-drop wave and nothing else. */
  skipMinutesRegression: boolean;
}): PublishVerdict {
  const failures: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];
  const verdict: PublishVerdict = { failures, warnings, notes };

  const fetched = rows.filter((p) => p.fetchedAt);
  const zeroStats = fetched.filter((p) => p.goals === 0 && p.assists === 0 && p.minutes === 0);
  const zeroMV = pool.filter((p) => p.marketValue <= 0);
  notes.push(
    `Validation: ${zeroStats.length}/${fetched.length} zero-stats, ${zeroMV.length}/${pool.length} zero-MV`,
  );
  // Aggregation-bug backstop: even right after an early season flip (~35%
  // coverage) zero-stats can't legitimately exceed ~65%. Near-total zeros mean
  // aggregation broke (e.g. corrupted clubTypes) despite healthy rawGames —
  // the season-coverage guard upstream can't see that.
  if (fetched.length > 50 && zeroStats.length / fetched.length > 0.8) {
    failures.push(
      `${zeroStats.length}/${fetched.length} players aggregated to zero stats despite healthy payloads — aggregation bug.`,
    );
  }
  if (zeroMV.length > pool.length * 0.1) {
    failures.push(`${zeroMV.length}/${pool.length} players have no market value — scraping issue.`);
  }

  // A deliberate season flip resets every stat; comparing against the old
  // season's file would only produce false alarms.
  if (seasonChanged) {
    notes.push("Season flipped — skipping old-vs-new regression checks this run.");
    return verdict;
  }
  if (!committed) {
    notes.push("No committed data yet — skipping old-vs-new regression checks.");
    return verdict;
  }

  const ga = (players: MinutesValuePlayer[]) =>
    players.reduce((s, p) => s + p.goals + p.assists, 0);
  const oldGA = ga(committed);
  const newGA = ga(rows);
  const oldCount = committed.length;
  const newCount = rows.length;
  notes.push(
    `G+A: ${oldGA} → ${newGA} (${newGA >= oldGA ? "+" : ""}${newGA - oldGA}), players: ${oldCount} → ${newCount} (${newCount >= oldCount ? "+" : ""}${newCount - oldCount})`,
  );
  if (oldGA > 100 && newGA < oldGA * 0.85) {
    failures.push(
      `Stats regressed: G+A ${oldGA} → ${newGA} (${Math.round((newGA / oldGA) * 100)}%).`,
    );
  }
  if (oldCount > 100 && newCount < oldCount * 0.85) {
    failures.push(
      `Player count regressed: ${oldCount} → ${newCount} (${Math.round((newCount / oldCount) * 100)}%).`,
    );
  }

  // Per-player regression: tolerate small minute drops, whole-club corrections
  // (TM voids/postpones a match → every club player loses ~90'), and a small
  // number of scattered drops (individual stat tweaks). Fail only on a wide
  // wave that suggests the scrape itself broke.
  const report = analyzeMinutesRegressions(committed, rows);
  if (report.ignoredClubs.length > 0) {
    warnings.push(
      `Ignoring whole-club corrections (likely match void/postpone): ${report.ignoredClubs.join(", ")} — ${report.ignoredCount} players`,
    );
  }
  const drops = sampleRegressionDrops(committed, report.scattered);
  if (report.fail) {
    const msg = `${report.scattered.length} player(s) regressed >${MINUTES_DROP_TOLERANCE}' (tolerance ${report.maxScattered}, e.g. ${drops}) — scrape regressed silently.`;
    if (skipMinutesRegression) warnings.push(`SKIP_MINUTES_REGRESSION=1 — tolerating: ${msg}`);
    else failures.push(msg);
  } else if (report.scattered.length > 0) {
    warnings.push(
      `${report.scattered.length} scattered minute drops within tolerance ${report.maxScattered}: ${drops}`,
    );
  }
  return verdict;
}
