import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getMinutesValueData, toPlayerStats, POSITION_MAP } from "@/lib/fetch-minutes-value";

const MIN_MARKET_VALUE = 10_000_000; // €10m minimum to be considered
const MAX_RESULTS = 50; // Return top candidates, client filters further

/**
 * Find candidates - players who seem to underperform based on points vs cheaper players
 * A player is a candidate if there exists a cheaper player with more points
 */
function findCandidates(players: PlayerStats[]): PlayerStats[] {
  const sorted = [...players].sort((a, b) => b.marketValue - a.marketValue);
  const candidates: PlayerStats[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    if (player.marketValue < MIN_MARKET_VALUE) continue;

    const cheaperWithMorePoints = sorted.slice(i + 1).some(p => p.points > player.points);
    if (cheaperWithMorePoints) {
      candidates.push(player);
    }
  }

  return candidates;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const positionType = searchParams.get("position") || "cf";

  if (!["forward", "cf", "midfielder"].includes(positionType)) {
    return NextResponse.json({ error: "Invalid position type" }, { status: 400 });
  }

  try {
    const allMV = await getMinutesValueData();
    const positions = POSITION_MAP[positionType] || [];
    const allPlayers = allMV
      .filter((p) => positions.some((pos) => p.position === pos))
      .map(toPlayerStats);

    const candidates = findCandidates(allPlayers);
    const underperformers = candidates.sort((a, b) => b.marketValue - a.marketValue).slice(0, MAX_RESULTS);
    return NextResponse.json({ underperformers });
  } catch (error) {
    console.error("Error computing underperformers:", error);
    return NextResponse.json({ error: "Failed to compute underperformers" }, { status: 500 });
  }
}
