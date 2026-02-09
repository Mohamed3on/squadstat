import { NextResponse } from "next/server";
import { getPlayerStatsData } from "@/lib/fetch-minutes-value";

export async function GET() {
  try {
    const players = await getPlayerStatsData();

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
