import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";

export async function GET() {
  try {
    const [players, clubsRaw] = await Promise.all([
      getMinutesValueData(),
      readFile(join(process.cwd(), "data", "clubs.json"), "utf-8").catch(() => "{}"),
    ]);
    const playerIndex = players.map((p) => ({
      id: p.playerId,
      name: p.name,
      club: p.club,
      position: p.position,
      league: p.league,
      nationality: p.nationality ?? "",
      imageUrl: p.imageUrl,
      marketValue: p.marketValue,
    }));
    const clubs: Record<string, { name: string; logoUrl: string }> = JSON.parse(clubsRaw);
    const teamIndex = Object.entries(clubs).map(([id, c]) => ({
      id,
      name: c.name,
      logoUrl: c.logoUrl,
    }));
    // Leagues and every other page come from the static lib/site-pages.ts on the
    // client; only the data-driven players and teams need to travel over the wire.
    return NextResponse.json(
      { players: playerIndex, teams: teamIndex },
      {
        headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
      },
    );
  } catch (error) {
    console.error("[API /players/search] Failed to build search index:", error);
    return NextResponse.json({ error: "Failed to load player search data" }, { status: 500 });
  }
}
