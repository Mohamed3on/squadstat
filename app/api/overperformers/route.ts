import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getPlayerStatsData } from "@/lib/fetch-minutes-value";
import { canBeUnderperformerAgainst, isDefensivePosition, strictlyOutperforms } from "@/lib/positions";

type Candidate = PlayerStats & { outperformsCount: number };

function findCandidates(players: PlayerStats[]): Candidate[] {
  const candidates: Candidate[] = [];

  for (const player of players) {
    if (isDefensivePosition(player.position) || player.position === "Central Midfield") continue;
    if (player.minutes === undefined) continue;

    const outperformsCount = players.filter((p) =>
      p.playerId !== player.playerId &&
      p.marketValue >= player.marketValue &&
      strictlyOutperforms(player, p) &&
      canBeUnderperformerAgainst(p.position, player.position)
    ).length;

    if (outperformsCount >= 2) {
      candidates.push({ ...player, outperformsCount });
    }
  }

  return candidates;
}

function filterUndominated(candidates: Candidate[]): Candidate[] {
  return candidates.filter((player) =>
    !candidates.some(
      (other) =>
        other.playerId !== player.playerId &&
        canBeUnderperformerAgainst(player.position, other.position) &&
        other.marketValue <= player.marketValue &&
        strictlyOutperforms(other, player)
    )
  );
}

export async function GET() {
  try {
    const allPlayers = await getPlayerStatsData();
    const overperformers = filterUndominated(findCandidates(allPlayers))
      .sort((a, b) => a.marketValue - b.marketValue);
    return NextResponse.json({ overperformers });
  } catch (error) {
    console.error("Error computing overperformers:", error);
    return NextResponse.json({ error: "Failed to compute overperformers" }, { status: 500 });
  }
}
