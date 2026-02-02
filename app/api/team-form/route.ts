import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { TeamFormEntry } from "@/app/types";

const BASE_URL = "https://www.transfermarkt.com";

const LEAGUES = [
  { code: "GB1", name: "Premier League", slug: "premier-league" },
  { code: "ES1", name: "La Liga", slug: "laliga" },
  { code: "L1", name: "Bundesliga", slug: "bundesliga" },
  { code: "IT1", name: "Serie A", slug: "serie-a" },
  { code: "FR1", name: "Ligue 1", slug: "ligue-1" },
];

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  return response.text();
}

function parseMarketValue(value: string): number {
  if (!value || value === "-") return 0;
  const cleaned = value.replace(/[€,]/g, "").trim();
  const match = cleaned.match(/([\d.]+)(k|m|bn)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit === "bn") return num * 1_000_000_000;
  if (unit === "m") return num * 1_000_000;
  if (unit === "k") return num * 1_000;
  return num;
}

interface LeagueTeam {
  name: string;
  position: number;
  points: number;
  logoUrl: string;
  clubUrl: string;
  clubId: string;
}

interface MarketValueTeam {
  clubId: string;
  marketValue: string;
  marketValueNum: number;
}

// Parse both tables from the startseite page
function parseStartseitePage($: cheerio.CheerioAPI): { standings: LeagueTeam[]; marketValues: MarketValueTeam[] } {
  const standings: LeagueTeam[] = [];
  const marketValues: MarketValueTeam[] = [];

  // Find standings table (has "Pts" but NOT "market value" in header)
  const standingsTable = $("table.items").filter((_, table) => {
    const headerText = $(table).find("thead").text().toLowerCase();
    const hasPts = headerText.includes("pts") || headerText.includes("pkte");
    const hasMarketValue = headerText.includes("market value") || headerText.includes("marktwert");
    return hasPts && !hasMarketValue;
  }).first();

  standingsTable.find("tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 5) return;

    const positionText = $(cells[0]).text().trim();
    const position = parseInt(positionText, 10);
    if (isNaN(position)) return;

    const clubCell = $(cells[1]);
    const clubLink = clubCell.find("a").first();
    const logoUrl = clubCell.find("img").attr("src") || "";
    const name = clubLink.attr("title") || "";
    const clubUrl = clubLink.attr("href") || "";
    const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
    const clubId = clubIdMatch ? clubIdMatch[1] : "";

    const pointsText = $(cells[cells.length - 1]).text().trim();
    const points = parseInt(pointsText, 10);
    if (isNaN(points)) return;

    if (name && clubId) {
      const normalizedUrl = clubUrl.replace(/\/(spielplan|tabelle)\//, "/startseite/");
      standings.push({ name, position, points, logoUrl, clubUrl: `${BASE_URL}${normalizedUrl}`, clubId });
    }
  });

  // Find market value table (has "market value" in header)
  const mvTable = $("table.items").filter((_, table) => {
    const headerText = $(table).find("thead").text().toLowerCase();
    return headerText.includes("market value") || headerText.includes("marktwert");
  }).first();

  mvTable.find("tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 6) return;

    const nameCell = $(cells[1]);
    const clubUrl = nameCell.find("a").first().attr("href") || "";
    const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
    const clubId = clubIdMatch ? clubIdMatch[1] : "";

    const mvCell = $(cells[cells.length - 2]);
    const marketValue = mvCell.text().trim();
    const marketValueNum = parseMarketValue(marketValue);

    if (clubId && marketValueNum > 0) {
      marketValues.push({ clubId, marketValue, marketValueNum });
    }
  });

  return { standings, marketValues };
}

async function fetchLeagueData(league: typeof LEAGUES[number]): Promise<TeamFormEntry[]> {
  try {
    // Single fetch per league - startseite has both tables
    const url = `${BASE_URL}/${league.slug}/startseite/wettbewerb/${league.code}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const { standings, marketValues } = parseStartseitePage($);

    // Sort by market value to determine expected positions
    const sortedByMV = [...marketValues].sort((a, b) => b.marketValueNum - a.marketValueNum);
    const mvRankMap = new Map<string, { rank: number; value: string; valueNum: number }>();
    sortedByMV.forEach((team, idx) => {
      mvRankMap.set(team.clubId, { rank: idx + 1, value: team.marketValue, valueNum: team.marketValueNum });
    });

    // Create points by position lookup
    const pointsByPosition = new Map<number, number>();
    standings.forEach((team) => {
      pointsByPosition.set(team.position, team.points);
    });

    // Combine data and calculate delta
    const results: TeamFormEntry[] = [];
    for (const team of standings) {
      const mvData = mvRankMap.get(team.clubId);
      if (!mvData) continue;

      const expectedPosition = mvData.rank;
      const expectedPoints = pointsByPosition.get(expectedPosition) || team.points;
      const deltaPts = team.points - expectedPoints;

      results.push({
        name: team.name,
        league: league.name,
        leaguePosition: team.position,
        points: team.points,
        marketValue: mvData.value,
        marketValueNum: mvData.valueNum,
        marketValueRank: mvData.rank,
        expectedPoints,
        deltaPts,
        logoUrl: team.logoUrl,
        clubUrl: team.clubUrl,
      });
    }

    return results;
  } catch (error) {
    console.error(`Failed to fetch ${league.name}:`, error);
    return [];
  }
}

async function getTeamFormData() {
  const results = await Promise.all(LEAGUES.map(fetchLeagueData));
  const allTeams = results.flat();

  const overperformers = [...allTeams]
    .filter((t) => t.deltaPts > 0)
    .sort((a, b) => b.deltaPts - a.deltaPts)
    .slice(0, 20);

  const underperformers = [...allTeams]
    .filter((t) => t.deltaPts < 0)
    .sort((a, b) => a.deltaPts - b.deltaPts)
    .slice(0, 20);

  return {
    success: true,
    overperformers,
    underperformers,
    totalTeams: allTeams.length,
    leagues: LEAGUES.map((l) => l.name),
  };
}

export async function GET() {
  try {
    const data = await getTeamFormData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching team form data:", error);
    return NextResponse.json({ error: "Failed to fetch team form data" }, { status: 500 });
  }
}
