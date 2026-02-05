import { NextRequest, NextResponse } from "next/server";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = (await request.json()) as { playerIds: string[] };
    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: "playerIds must be an array" }, { status: 400 });
    }

    const minutes: Record<string, number> = {};
    const CONCURRENCY = 50;
    for (let i = 0; i < playerIds.length; i += CONCURRENCY) {
      const batch = playerIds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((id) => fetchPlayerMinutes(id))
      );
      batch.forEach((id, j) => {
        minutes[id] = results[j].status === "fulfilled" ? results[j].value : 0;
      });
    }

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error batch fetching minutes:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
