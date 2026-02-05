import { NextRequest, NextResponse } from "next/server";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";

export async function POST(request: NextRequest) {
  try {
    const { playerIds } = (await request.json()) as { playerIds: string[] };
    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: "playerIds must be an array" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      playerIds.map((id) => fetchPlayerMinutes(id))
    );

    const minutes: Record<string, number> = {};
    playerIds.forEach((id, i) => {
      minutes[id] = results[i].status === "fulfilled" ? results[i].value : 0;
    });

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error("Error batch fetching minutes:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
