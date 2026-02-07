import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getMinutesValueData, toPlayerStats, POSITION_MAP } from "@/lib/fetch-minutes-value";

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[çÇ]/g, "c")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[ğĞ]/g, "g")
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[ß]/g, "ss")
    .trim();
}

function findPlayerByName(players: PlayerStats[], searchName: string): PlayerStats | null {
  const normalized = normalizeForSearch(searchName);
  return players.find((p) => normalizeForSearch(p.name).includes(normalized)) || null;
}

function findUnderperformers(players: PlayerStats[], target: PlayerStats): PlayerStats[] {
  return players.filter(
    (p) =>
      p.name !== target.name &&
      p.marketValue >= target.marketValue &&
      p.points < target.points
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerName = searchParams.get("name");
  const positionType = searchParams.get("position") || "forward";

  if (!playerName) {
    return NextResponse.json({ error: "Player name is required" }, { status: 400 });
  }

  try {
    const allMV = await getMinutesValueData();
    const positions = POSITION_MAP[positionType] || [];
    const allPlayers = positions.length > 0
      ? allMV.filter((p) => positions.some((pos) => p.position === pos)).map(toPlayerStats)
      : allMV.map(toPlayerStats);

    const targetPlayer = findPlayerByName(allPlayers, playerName);

    if (!targetPlayer) {
      return NextResponse.json({
        error: "Player not found",
        searchedName: playerName,
        totalPlayers: allPlayers.length,
      }, { status: 404 });
    }

    const underperformers = findUnderperformers(allPlayers, targetPlayer);

    return NextResponse.json({
      targetPlayer,
      underperformers,
      totalPlayers: allPlayers.length,
    });
  } catch (error) {
    console.error("Error analyzing player form:", error);
    return NextResponse.json({ error: "Failed to analyze player form" }, { status: 500 });
  }
}
