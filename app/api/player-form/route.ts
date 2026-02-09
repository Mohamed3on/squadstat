import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { filterByPosition, isForwardPosition, resolvePositionType, type PositionType } from "@/lib/positions";

const ALLOWED_POSITIONS: readonly PositionType[] = ["all", "forward", "cf", "non-forward"];

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
  const rawPosition = searchParams.get("position");
  const positionType = resolvePositionType(rawPosition, { defaultValue: "forward", allowed: ALLOWED_POSITIONS });

  if (!playerName) {
    return NextResponse.json({ error: "Player name is required" }, { status: 400 });
  }
  if (!positionType) {
    return NextResponse.json({
      error: "Invalid position type",
      position: rawPosition,
      allowed: ALLOWED_POSITIONS,
    }, { status: 400 });
  }

  try {
    const allMV = await getMinutesValueData();
    const allPlayers = filterByPosition(allMV, positionType).map(toPlayerStats);

    const targetPlayer = findPlayerByName(allPlayers, playerName);

    if (!targetPlayer) {
      return NextResponse.json({
        error: "Player not found",
        searchedName: playerName,
        totalPlayers: allPlayers.length,
      }, { status: 404 });
    }

    // If benchmark is not a forward, only compare against non-forwards
    const isTargetForward = isForwardPosition(targetPlayer.position);
    const comparisonPool = isTargetForward
      ? allPlayers
      : allPlayers.filter((p) => !isForwardPosition(p.position));

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
