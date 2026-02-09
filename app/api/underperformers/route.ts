import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getPlayerStatsData } from "@/lib/fetch-minutes-value";
import { canBeUnderperformerAgainst, isDefensivePosition } from "@/lib/positions";

const MIN_DISCOVERY_MINUTES = 260;

/**
 * Find candidates - players who seem to underperform based on points vs cheaper players
 * A player is a candidate if there exists a cheaper player with more points
 * from the same or a lower position class.
 */
function findCandidates(players: PlayerStats[]): PlayerStats[] {
  const sorted = [...players].sort((a, b) => b.marketValue - a.marketValue);
  const candidates: PlayerStats[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    if (
      isDefensivePosition(player.position) ||
      player.position === "Central Midfield"
    ) continue;
    if (player.minutes === undefined || player.minutes < MIN_DISCOVERY_MINUTES) continue;

    const cheaperWithMorePoints = sorted.slice(i + 1).some((p) =>
      p.points > player.points && canBeUnderperformerAgainst(player.position, p.position)
    );
    if (cheaperWithMorePoints) {
      candidates.push(player);
    }
  }

  return candidates;
}

function filterUndominatedCandidates(candidates: PlayerStats[]): PlayerStats[] {
  return candidates.filter((player) => {
    const playerMins = player.minutes;
    if (playerMins === undefined) return true;

    const dominated = candidates.some(
      (other) =>
        other.playerId !== player.playerId &&
        other.minutes !== undefined &&
        canBeUnderperformerAgainst(other.position, player.position) &&
        other.marketValue >= player.marketValue &&
        other.minutes >= playerMins &&
        other.points < player.points
    );

    return !dominated;
  });
}

export async function GET() {
  try {
    const allPlayers = await getPlayerStatsData();

    const candidates = findCandidates(allPlayers);
    const underperformers = filterUndominatedCandidates(candidates)
      .sort((a, b) => b.marketValue - a.marketValue);
    return NextResponse.json({ underperformers });
  } catch (error) {
    console.error("Error computing underperformers:", error);
    return NextResponse.json({ error: "Failed to compute underperformers" }, { status: 500 });
  }
}
