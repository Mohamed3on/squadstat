import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { filterByPosition, resolvePositionType, type PositionType } from "@/lib/positions";

const MIN_MARKET_VALUE = 10_000_000; // €10m minimum to be considered
const MAX_RESULTS = 50; // Return top candidates, client filters further
const ALLOWED_POSITIONS: readonly PositionType[] = ["forward", "cf", "non-forward"];

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
  const rawPosition = searchParams.get("position");
  const positionType = resolvePositionType(rawPosition, { defaultValue: "cf", allowed: ALLOWED_POSITIONS });
  if (!positionType) {
    return NextResponse.json({
      error: "Invalid position type",
      position: rawPosition,
      allowed: ALLOWED_POSITIONS,
    }, { status: 400 });
  }

  try {
    const allMV = await getMinutesValueData();
    const allPlayers = filterByPosition(allMV, positionType).map(toPlayerStats);

    const candidates = findCandidates(allPlayers);
    const underperformers = candidates.sort((a, b) => b.marketValue - a.marketValue).slice(0, MAX_RESULTS);
    return NextResponse.json({ underperformers });
  } catch (error) {
    console.error("Error computing underperformers:", error);
    return NextResponse.json({ error: "Failed to compute underperformers" }, { status: 500 });
  }
}
