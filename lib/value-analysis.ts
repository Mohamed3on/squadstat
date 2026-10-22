import type { PlayerStats } from "@/app/types";
import { buildLeagueValues, noLeagueEdge } from "@/lib/filter-players";
import {
  canBeUnderperformerAgainst,
  canBeOutperformerAgainst,
  effectivePosition as pos,
  isAttackingPosition,
  isDefensivePosition,
  strictlyOutperforms,
} from "@/lib/positions";

export type ValueCandidate = PlayerStats & { count: number };

export const MIN_COMPARISON_COUNT = 3;
/** Both sides of a comparison need this much play: one cameo goal or assist is no evidence. */
export const MIN_COMPARISON_MINUTES = 180;

type ValueComparable = {
  playerId: string;
  marketValue: number;
  points: number;
  minutes?: number;
  position: string;
  playedPosition?: string;
};

const hasEnoughMinutes = (p: ValueComparable) =>
  p.minutes === undefined || p.minutes >= MIN_COMPARISON_MINUTES;

/** The bargain/overpriced rule, owned here and only here: `candidate` costs
 *  equal-or-more than `target` yet is strictly outperformed by it (at a
 *  position where that comparison is fair). */
export function underperformsTarget(
  candidate: ValueComparable,
  target: ValueComparable,
  targetPosition: string = pos(target),
): boolean {
  return (
    candidate.playerId !== target.playerId &&
    hasEnoughMinutes(candidate) &&
    hasEnoughMinutes(target) &&
    candidate.marketValue >= target.marketValue &&
    strictlyOutperforms(target, candidate) &&
    canBeUnderperformerAgainst(pos(candidate), targetPosition)
  );
}

/** Mirror rule: `candidate` costs equal-or-less yet strictly outperforms `target`. */
export function outperformsTarget(
  candidate: ValueComparable,
  target: ValueComparable,
  targetPosition: string = pos(target),
): boolean {
  return (
    candidate.playerId !== target.playerId &&
    hasEnoughMinutes(candidate) &&
    hasEnoughMinutes(target) &&
    candidate.marketValue <= target.marketValue &&
    strictlyOutperforms(candidate, target) &&
    canBeOutperformerAgainst(pos(candidate), targetPosition)
  );
}

/** Count how many players in `pool` the given player compares against. */
export function countComparisons(
  player: PlayerStats,
  pool: PlayerStats[],
  candidateOutperforms: boolean,
): number {
  const ep = pos(player);
  return pool.filter((p) =>
    candidateOutperforms ? underperformsTarget(p, player, ep) : outperformsTarget(p, player, ep),
  ).length;
}

/**
 * Find players who are either overperformers (bargains) or underperformers (overpriced).
 * When `candidateOutperforms` is true, finds cheap players outperforming expensive ones.
 * When false, finds expensive players outperformed by cheaper ones.
 */
export function findValueCandidates(
  players: PlayerStats[],
  {
    candidateOutperforms,
    allLeagues = false,
    sortAsc,
  }: {
    candidateOutperforms: boolean;
    /** Count peers with a league edge too. Over/Under does, then narrows its counts client-side. */
    allLeagues?: boolean;
    sortAsc: boolean;
  },
): ValueCandidate[] {
  const leagueValues = buildLeagueValues(players);
  // By default the counted peers (pricier for a bargain, cheaper for an overpriced player) drop
  // those with a league edge, as on the player page.
  const pools = new Map<string, PlayerStats[]>();
  const poolFor = (league: string) => {
    if (allLeagues) return players;
    let pool = pools.get(league);
    if (!pool) {
      const peer = candidateOutperforms ? "pricier" : "cheaper";
      pool = players.filter(noLeagueEdge(leagueValues, league, peer));
      pools.set(league, pool);
    }
    return pool;
  };
  const candidates: ValueCandidate[] = [];

  for (const player of players) {
    if (player.minutes === undefined) continue;
    if (candidateOutperforms ? isDefensivePosition(pos(player)) : !isAttackingPosition(pos(player)))
      continue;

    const count = countComparisons(player, poolFor(player.league), candidateOutperforms);
    if (count >= MIN_COMPARISON_COUNT) candidates.push({ ...player, count });
  }

  // A player only hides behind a starker case that has no league edge on him — the same bar the
  // player page's badge counts peers by.
  const undominated = candidates.filter(
    (player) =>
      !candidates.some(
        (other) =>
          other.playerId !== player.playerId &&
          noLeagueEdge(
            leagueValues,
            player.league,
            candidateOutperforms ? "cheaper" : "pricier",
          )(other) &&
          (candidateOutperforms
            ? canBeUnderperformerAgainst(pos(player), pos(other)) &&
              other.marketValue <= player.marketValue &&
              strictlyOutperforms(other, player)
            : canBeUnderperformerAgainst(pos(other), pos(player)) &&
              other.marketValue >= player.marketValue &&
              strictlyOutperforms(player, other)),
      ),
  );

  return undominated.sort((a, b) =>
    sortAsc ? a.marketValue - b.marketValue : b.marketValue - a.marketValue,
  );
}
