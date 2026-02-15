import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getPlayerStatsData } from "@/lib/fetch-minutes-value";
import { canBeUnderperformerAgainst, canBeOutperformerAgainst, isDefensivePosition, strictlyOutperforms } from "@/lib/positions";

type Candidate = PlayerStats & { outperformedByCount: number };

const MIN_DISCOVERY_MINUTES = 260;

function findCandidates(players: PlayerStats[]): Candidate[] {
  const candidates: Candidate[] = [];

  for (const player of players) {
    if (isDefensivePosition(player.position) || player.position === "Central Midfield") continue;
    if (player.minutes === undefined || player.minutes < MIN_DISCOVERY_MINUTES) continue;

    const outperformedByCount = players.filter((p) =>
      p.playerId !== player.playerId &&
      p.marketValue <= player.marketValue &&
      strictlyOutperforms(p, player) &&
      canBeOutperformerAgainst(p.position, player.position)
    ).length;

    if (outperformedByCount >= 2) {
      candidates.push({ ...player, outperformedByCount });
    }
  }

  return candidates;
}

function filterUndominated(candidates: Candidate[]): Candidate[] {
  return candidates.filter((player) =>
    !candidates.some(
      (other) =>
        other.playerId !== player.playerId &&
        canBeUnderperformerAgainst(other.position, player.position) &&
        other.marketValue >= player.marketValue &&
        strictlyOutperforms(player, other)
    )
  );
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
