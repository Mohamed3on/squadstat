import { NextResponse } from "next/server";
import { fetchTopScorers } from "@/lib/fetch-top-scorers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const position = searchParams.get("position") || "all";

  try {
    const players = await fetchTopScorers(position);
    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}
