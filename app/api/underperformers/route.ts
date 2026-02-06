import { NextResponse } from "next/server";
import { unstable_cache, revalidateTag } from "next/cache";
import type { PlayerStats } from "@/app/types";
import { fetchTopScorers } from "@/lib/fetch-top-scorers";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";

const MIN_MARKET_VALUE = 10_000_000; // €10m minimum to be considered
const MAX_RESULTS = 50; // Return top candidates, client filters further
const CONCURRENCY = 25;

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

async function computeUnderperformers(positionType: string): Promise<PlayerStats[]> {
  const allPlayers = await fetchTopScorers(positionType);
  const candidates = findCandidates(allPlayers);
  const sliced = candidates.sort((a, b) => b.marketValue - a.marketValue).slice(0, MAX_RESULTS);

  // Enrich with minutes data so the client doesn't need a second round-trip
  for (let i = 0; i < sliced.length; i += CONCURRENCY) {
    const batch = sliced.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((p) => fetchPlayerMinutes(p.playerId))
    );
    batch.forEach((p, j) => {
      if (results[j].status === "fulfilled") {
        p.minutes = results[j].value.minutes;
      }
    });
  }

  return sliced;
}

const getCachedUnderperformers = unstable_cache(
  async (positionType: string) => computeUnderperformers(positionType),
  ["underperformers"],
  { revalidate: 86400, tags: ["underperformers"] }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const positionType = searchParams.get("position") || "cf";
  const bustCache = searchParams.get("bust") === "true";

  if (!["forward", "cf", "midfielder"].includes(positionType)) {
    return NextResponse.json({ error: "Invalid position type" }, { status: 400 });
  }

  if (bustCache) {
    revalidateTag("underperformers");
    return NextResponse.json({ cleared: true });
  }

  try {
    const underperformers = await getCachedUnderperformers(positionType);
    return NextResponse.json({ underperformers });
  } catch (error) {
    console.error("Error computing underperformers:", error);
    return NextResponse.json({ error: "Failed to compute underperformers" }, { status: 500 });
  }
}
