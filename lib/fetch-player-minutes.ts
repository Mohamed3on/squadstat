import * as cheerio from "cheerio";
import type { PlayerStatsResult } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";

const ZERO_STATS: PlayerStatsResult = {
  minutes: 0,
  appearances: 0,
  goals: 0,
  assists: 0,
  club: "",
  league: "",
  isNewSigning: false,
  isOnLoan: false,
};

const CEAPI_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "application/json",
};

/** Current Transfermarkt season ID (e.g. 2025 = the 25/26 season). */
function currentSeasonId(): number {
  const now = new Date();
  const year = now.getFullYear();
  // Season flips around August
  return now.getMonth() >= 7 ? year : year - 1;
}

interface CeapiGame {
  gameInformation: { seasonId: number; competitionTypeId: number };
  statistics: {
    goalStatistics: { goalsScoredTotal?: number | null; assists?: number | null };
    playingTimeStatistics: { playedMinutes?: number | null };
  };
}

function aggregateSeasonStats(games: CeapiGame[]): { goals: number; assists: number; minutes: number; appearances: number } {
  const seasonId = currentSeasonId();
  let goals = 0, assists = 0, minutes = 0, appearances = 0;
  for (const g of games) {
    if (g.gameInformation.seasonId !== seasonId) continue;
    const gs = g.statistics.goalStatistics;
    const pts = g.statistics.playingTimeStatistics;
    goals += gs.goalsScoredTotal ?? 0;
    assists += gs.assists ?? 0;
    const mins = pts.playedMinutes ?? 0;
    minutes += mins;
    if (mins > 0) appearances++;
  }
  return { goals, assists, minutes, appearances };
}

/** Raw fetch — no caching. Used by the offline refresh script. */
export async function fetchPlayerMinutesRaw(playerId: string): Promise<PlayerStatsResult> {
  if (!playerId) return ZERO_STATS;

  // Fetch HTML (for club/league/ribbon) and ceapi (for stats) in parallel
  const [htmlContent, ceapiRes] = await Promise.all([
    fetchPage(`${BASE_URL}/x/leistungsdaten/spieler/${playerId}`),
    fetch(`${BASE_URL}/ceapi/performance-game/${playerId}`, {
      headers: CEAPI_HEADERS,
      cache: "no-store",
    }),
  ]);

  // Parse club/league/ribbon from HTML
  const $ = cheerio.load(htmlContent);
  const clubInfo = $(".data-header__club-info");
  const club = clubInfo.find(".data-header__club a").text().trim();
  const league = clubInfo.find(".data-header__league a").text().trim();
  const ribbonText = $(".data-header__ribbon span").text().trim().toLowerCase();
  const isOnLoan = ribbonText === "on loan";
  const isNewSigning = ribbonText === "new arrival" || isOnLoan;

  // Parse stats from ceapi
  if (!ceapiRes.ok) {
    return { ...ZERO_STATS, club, league, isNewSigning, isOnLoan };
  }
  const ceapi = await ceapiRes.json();
  const games: CeapiGame[] = ceapi?.data?.performance ?? [];
  const { goals, assists, minutes, appearances } = aggregateSeasonStats(games);

  return { minutes, appearances, goals, assists, club, league, isNewSigning, isOnLoan };
}
