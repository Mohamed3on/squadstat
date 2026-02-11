import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getPlayerStatsData } from "@/lib/fetch-minutes-value";
import { canBeUnderperformerAgainst, canBeOutperformerAgainst, isDefensivePosition } from "@/lib/positions";

type Candidate = PlayerStats & { outperformedByCount: number };

const MIN_DISCOVERY_MINUTES = 260;

function findCandidates(players: PlayerStats[]): Candidate[] {
  const sorted = [...players].sort((a, b) => b.marketValue - a.marketValue);
  const candidates: Candidate[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    if (isDefensivePosition(player.position) || player.position === "Central Midfield") continue;
    if (player.minutes === undefined || player.minutes < MIN_DISCOVERY_MINUTES) continue;

    const cheaper = sorted.slice(i + 1);
    const outperformedByCount = cheaper.filter((p) =>
      p.points > player.points &&
      canBeOutperformerAgainst(p.position, player.position) &&
      (p.minutes === undefined || p.minutes <= player.minutes!)
    ).length;

    if (outperformedByCount >= 2) {
      candidates.push({ ...player, outperformedByCount });
    }
  }

  return candidates;
}

function filterUndominated(candidates: Candidate[]): Candidate[] {
  return candidates.filter((player) => {
    if (player.minutes === undefined) return true;
    return !candidates.some(
      (other) =>
        other.playerId !== player.playerId &&
        other.minutes !== undefined &&
        canBeUnderperformerAgainst(other.position, player.position) &&
        other.marketValue >= player.marketValue &&
        other.minutes >= player.minutes! &&
        other.points < player.points
    );
  });
}

export async function GET() {
  try {
    const allPlayers = await getPlayerStatsData();
    const underperformers = filterUndominated(findCandidates(allPlayers))
      .sort((a, b) => b.marketValue - a.marketValue);
    return NextResponse.json({ underperformers });
  } catch (error) {
    console.error("Error computing underperformers:", error);
    return NextResponse.json({ error: "Failed to compute underperformers" }, { status: 500 });
  }
}
