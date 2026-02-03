import { NextResponse } from "next/server";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  if (!playerId) {
    return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
  }

  try {
    const minutes = await fetchPlayerMinutes(playerId);
    return NextResponse.json({ playerId, minutes });
  } catch (error) {
    console.error("Error fetching player minutes:", error);
    return NextResponse.json({ error: "Failed to fetch player minutes" }, { status: 500 });
  }
}
