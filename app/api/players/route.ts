import { NextResponse } from "next/server";
import { getMinutesValueData, toPlayerStats, POSITION_MAP, FORWARD_POSITIONS } from "@/lib/fetch-minutes-value";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get("position") || "all";

  try {
    const allMV = await getMinutesValueData();
    let players;
    if (position === "non-forward") {
      players = allMV.filter((p) => !FORWARD_POSITIONS.includes(p.position)).map(toPlayerStats);
    } else {
      const positions = POSITION_MAP[position];
      players = positions
        ? allMV.filter((p) => positions.some((pos) => p.position === pos)).map(toPlayerStats)
        : allMV.map(toPlayerStats);
    }

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
