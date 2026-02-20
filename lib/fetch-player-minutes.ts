import * as cheerio from "cheerio";
import type { PlayerStatsResult } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";

const ZERO_STATS: PlayerStatsResult = {
  minutes: 0,
  appearances: 0,
  goals: 0,
  assists: 0,
  penaltyGoals: 0,
  penaltyMisses: 0,
  intlGoals: 0,
  intlAssists: 0,
  intlMinutes: 0,
  intlAppearances: 0,
  intlPenaltyGoals: 0,
  intlCareerCaps: 0,
  club: "",
  clubLogoUrl: "",
  league: "",
  isNewSigning: false,
  isOnLoan: false,
  playedPosition: "",
  contractExpiry: undefined,
};

const CEAPI_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "application/json",
};

/** Domestic league competition ID → display name */
const LEAGUE_NAMES: Record<string, string> = {
  GB1: "Premier League",
  ES1: "LaLiga",
  L1: "Bundesliga",
  IT1: "Serie A",
  FR1: "Ligue 1",
  PO1: "Liga Portugal",
  NL1: "Eredivisie",
  BE1: "Jupiler Pro League",
  TR1: "Süper Lig",
  SA1: "Saudi Pro League",
  BRA1: "Série A",
  RU1: "Premier Liga",
  GR1: "Super League 1",
  DK1: "Superliga",
  GB2: "Championship",
  ES2: "LaLiga2",
};

/** Current Transfermarkt season ID (e.g. 2025 = the 25/26 season). */
function currentSeasonId(): number {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 7 ? year : year - 1;
}

interface CeapiGame {
  gameInformation: { seasonId: number; competitionTypeId: number; competitionId: string };
  statistics: {
    goalStatistics: { goalsScoredTotal?: number | null; assists?: number | null; penaltyShooterGoalsScored?: number | null; penaltyShooterMisses?: number | null };
    playingTimeStatistics: { playedMinutes?: number | null };
  };
}

interface AggregatedStats {
  goals: number; assists: number; minutes: number; appearances: number; penaltyGoals: number; penaltyMisses: number;
  intlGoals: number; intlAssists: number; intlMinutes: number; intlAppearances: number; intlPenaltyGoals: number;
  league: string;
}

function aggregateSeasonStats(games: CeapiGame[]): AggregatedStats {
  const seasonId = currentSeasonId();
  let goals = 0, assists = 0, minutes = 0, appearances = 0, penaltyGoals = 0, penaltyMisses = 0;
  let intlGoals = 0, intlAssists = 0, intlMinutes = 0, intlAppearances = 0, intlPenaltyGoals = 0;
  let league = "";
  for (const g of games) {
    if (g.gameInformation.seasonId !== seasonId) continue;
    const gs = g.statistics.goalStatistics;
    const pts = g.statistics.playingTimeStatistics;
    const isIntl = g.gameInformation.competitionTypeId === 11;
    if (isIntl) {
      intlGoals += gs.goalsScoredTotal ?? 0;
      intlAssists += gs.assists ?? 0;
      intlPenaltyGoals += gs.penaltyShooterGoalsScored ?? 0;
      const mins = pts.playedMinutes ?? 0;
      intlMinutes += mins;
      if (mins > 0) intlAppearances++;
    } else {
      goals += gs.goalsScoredTotal ?? 0;
      assists += gs.assists ?? 0;
      penaltyGoals += gs.penaltyShooterGoalsScored ?? 0;
      penaltyMisses += gs.penaltyShooterMisses ?? 0;
      const mins = pts.playedMinutes ?? 0;
      minutes += mins;
      if (mins > 0) appearances++;
      if (!league && g.gameInformation.competitionTypeId === 1) {
        league = LEAGUE_NAMES[g.gameInformation.competitionId] ?? "";
      }
    }
  }
  return { goals, assists, minutes, appearances, penaltyGoals, penaltyMisses, intlGoals, intlAssists, intlMinutes, intlAppearances, intlPenaltyGoals, league };
}

/** Raw fetch — no caching. Used by the offline refresh script. */
export async function fetchPlayerMinutesRaw(playerId: string): Promise<PlayerStatsResult> {
  if (!playerId) return ZERO_STATS;

  // Fetch HTML (for club/ribbon) and ceapi (for stats) in parallel
  const [htmlContent, ceapiRes] = await Promise.all([
    fetchPage(`${BASE_URL}/x/leistungsdaten/spieler/${playerId}`),
    fetch(`${BASE_URL}/ceapi/performance-game/${playerId}`, {
      headers: CEAPI_HEADERS,
      cache: "no-store",
    }),
  ]);

  // Parse club/ribbon from HTML
  const $ = cheerio.load(htmlContent);
  const clubInfo = $(".data-header__club-info");
  const club = clubInfo.find(".data-header__club a").text().trim();
  const clubLogoImg = $(".data-header__box__club-link img").first();
  const clubLogoSrcset = (clubLogoImg.attr("srcset") || "").trim();
  const clubLogoUrl = clubLogoSrcset.split(/\s+/)[0] || clubLogoImg.attr("src") || "";
  const ribbonText = $(".data-header__ribbon span").text().trim().toLowerCase();
  const isOnLoan = ribbonText === "on loan";
  const isNewSigning = ribbonText === "new arrival" || isOnLoan;

  // Most-played position this season from the "Positions played" pitch visualization
  let playedPosition = "";
  let maxGames = 0;
  $(".zahl-anzeige.played-position__pos-box").each((_, el) => {
    const games = parseInt($(el).find(".played-position__text-box").text().trim()) || 0;
    if (games > maxGames) {
      maxGames = games;
      playedPosition = $(el).attr("title")?.trim() || "";
    }
  });

  // Parse senior international caps from profile header (Caps/Goals: N)
  // The team label varies: "Current international", "Former International", "National player"
  // Find the <ul> containing Caps/Goals, then check the team name in the sibling <li>
  const capsLi = $("li:contains('Caps/Goals')").first();
  const capsUl = capsLi.closest("ul");
  const natTeamName = capsUl.find("a[href*='/startseite/verein/']").first().attr("title") || "";
  const isSeniorTeam = natTeamName && !/U\d/i.test(natTeamName);
  const intlCareerCaps = isSeniorTeam ? (parseInt(capsLi.find("a").first().text().trim()) || 0) : 0;

  // Parse contract expiry from club info header
  const contractLabel = clubInfo.find(".data-header__label:contains('Contract expires:')");
  const contractExpiry = contractLabel.find(".data-header__content").text().trim() || undefined;

  // Parse stats + league from ceapi
  if (!ceapiRes.ok) {
    return { ...ZERO_STATS, club, clubLogoUrl, intlCareerCaps, isNewSigning, isOnLoan, playedPosition, contractExpiry };
  }
  const ceapi = await ceapiRes.json();
  const games: CeapiGame[] = ceapi?.data?.performance ?? [];
  const stats = aggregateSeasonStats(games);

  return { ...stats, club, clubLogoUrl, intlCareerCaps, isNewSigning, isOnLoan, playedPosition, contractExpiry };
}
