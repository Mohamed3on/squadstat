import { NextRequest, NextResponse } from "next/server";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";
import type { PlayerStatsResult } from "@/app/types";

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = (await request.json()) as { playerIds: string[] };
    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: "playerIds must be an array" }, { status: 400 });
    }

    const stats: Record<string, PlayerStatsResult> = {};
    const CONCURRENCY = 25;
    for (let i = 0; i < playerIds.length; i += CONCURRENCY) {
      const batch = playerIds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((id) => fetchPlayerMinutes(id))
      );
      batch.forEach((id, j) => {
        stats[id] = results[j].status === "fulfilled"
          ? results[j].value
          : { minutes: 0, appearances: 0, goals: 0, assists: 0 };
      });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error batch fetching minutes:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
