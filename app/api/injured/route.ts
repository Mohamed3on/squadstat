import { NextRequest, NextResponse } from "next/server";
import { getInjuredPlayers, fetchLeagueInjured } from "@/lib/injured";

export async function GET(request: NextRequest) {
  try {
    const league = request.nextUrl.searchParams.get("league");
    if (league) {
      const players = await fetchLeagueInjured(league);
      return NextResponse.json({ players });
    }
    const data = await getInjuredPlayers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching injured players:", error);
    return NextResponse.json({ error: "Failed to fetch injured players" }, { status: 500 });
  }
}
