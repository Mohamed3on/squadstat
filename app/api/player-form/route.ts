import { NextResponse } from "next/server";
import type { PlayerStats } from "@/app/types";
import { fetchTopScorers } from "@/lib/fetch-top-scorers";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";

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

const CONCURRENCY = 25;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerName = searchParams.get("name");
  const positionType = searchParams.get("position") || "forward";

  if (!playerName) {
    return NextResponse.json({ error: "Player name is required" }, { status: 400 });
  }

  try {
    const allPlayers = await fetchTopScorers(positionType);
    const targetPlayer = findPlayerByName(allPlayers, playerName);

    if (!targetPlayer) {
      return NextResponse.json({
        error: "Player not found",
        searchedName: playerName,
        totalPlayers: allPlayers.length,
      }, { status: 404 });
    }

    const underperformers = findUnderperformers(allPlayers, targetPlayer);

    // Enrich all players with minutes data
    const allToEnrich = [targetPlayer, ...underperformers];
    for (let i = 0; i < allToEnrich.length; i += CONCURRENCY) {
      const batch = allToEnrich.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((p) => fetchPlayerMinutes(p.playerId))
      );
      batch.forEach((p, j) => {
        if (results[j].status === "fulfilled") {
          p.minutes = results[j].value.minutes;
        }
      });
    }

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
