import { NextResponse } from "next/server";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { filterByPosition, resolvePositionType, type PositionType } from "@/lib/positions";

const ALLOWED_POSITIONS: readonly PositionType[] = ["all", "forward", "cf", "non-forward"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPosition = searchParams.get("position");
  const position = resolvePositionType(rawPosition, { defaultValue: "all", allowed: ALLOWED_POSITIONS });

  if (!position) {
    return NextResponse.json({
      error: "Invalid position type",
      position: rawPosition,
      allowed: ALLOWED_POSITIONS,
    }, { status: 400 });
  }

  try {
    const allMV = await getMinutesValueData();
    const players = filterByPosition(allMV, position).map(toPlayerStats);

    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
