import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getMinutesValueData, toPlayerStats, POSITION_MAP, FORWARD_POSITIONS } from "@/lib/fetch-minutes-value";

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

function findOutperformers(players: PlayerStats[], target: PlayerStats): PlayerStats[] {
  return players.filter(
    (p) =>
      p.name !== target.name &&
      p.marketValue <= target.marketValue &&
      p.points > target.points
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
    let allPlayers;
    if (positionType === "non-forward") {
      allPlayers = allMV.filter((p) => !FORWARD_POSITIONS.includes(p.position)).map(toPlayerStats);
    } else {
      const positions = POSITION_MAP[positionType] || [];
      allPlayers = positions.length > 0
        ? allMV.filter((p) => positions.some((pos) => p.position === pos)).map(toPlayerStats)
        : allMV.map(toPlayerStats);
    }

    const targetPlayer = findPlayerByName(allPlayers, playerName);

    if (!targetPlayer) {
      return NextResponse.json({
        error: "Player not found",
        searchedName: playerName,
        totalPlayers: allPlayers.length,
      }, { status: 404 });
    }

    // If benchmark is not a forward, only compare against non-forwards
    const isTargetForward = FORWARD_POSITIONS.includes(targetPlayer.position);
    const comparisonPool = isTargetForward
      ? allPlayers
      : allPlayers.filter((p) => !FORWARD_POSITIONS.includes(p.position));

    const underperformers = findUnderperformers(comparisonPool, targetPlayer);
    const outperformers = findOutperformers(comparisonPool, targetPlayer)
      .sort((a, b) => b.points - a.points || a.marketValue - b.marketValue);

    return NextResponse.json({
      targetPlayer,
      underperformers,
      outperformers,
      totalPlayers: allPlayers.length,
    });
  } catch (error) {
    console.error("Error analyzing player form:", error);
    return NextResponse.json({ error: "Failed to analyze player form" }, { status: 500 });
  }
}
