import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
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
  name: string;
  marketValue: string;
  marketValueNum: number;
  logoUrl: string;
  clubId: string;
}

function parseLeagueTable($: cheerio.CheerioAPI): LeagueTeam[] {
  const teams: LeagueTeam[] = [];

  $("table.items > tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 9) return;

    const positionText = $(cells[0]).text().trim();
    const position = parseInt(positionText, 10);
    if (isNaN(position)) return;

    const logoCell = $(cells[1]);
    const logoUrl = logoCell.find("img").attr("src") || "";

    const nameCell = $(cells[2]);
    const nameLink = nameCell.find("a").first();
    const name = nameLink.attr("title") || nameLink.text().trim();
    const clubUrl = nameLink.attr("href") || "";
    const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
    const clubId = clubIdMatch ? clubIdMatch[1] : "";

    const pointsText = $(cells[cells.length - 1]).text().trim();
    const points = parseInt(pointsText, 10);
    if (isNaN(points)) return;

    if (name && clubId) {
      // Normalize URL to use startseite
      const normalizedUrl = clubUrl.replace(/\/(spielplan|tabelle)\//, "/startseite/");
      teams.push({ name, position, points, logoUrl, clubUrl: `${BASE_URL}${normalizedUrl}`, clubId });
    }
  });

  return teams;
}

function parseMarketValueTable($: cheerio.CheerioAPI): MarketValueTeam[] {
  const teams: MarketValueTeam[] = [];

  // Find the table with market value header (first table.items with 7 columns)
  const mvTable = $("table.items").filter((_, table) => {
    const headerText = $(table).find("thead").text().toLowerCase();
    return headerText.includes("market value") || headerText.includes("marktwert");
  }).first();

  mvTable.find("tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 6) return;

    const logoCell = $(cells[0]);
    const logoUrl = logoCell.find("img").attr("src") || "";

    const nameCell = $(cells[1]);
    const nameLink = nameCell.find("a").first();
    const name = nameLink.attr("title") || nameLink.text().trim();
    const clubUrl = nameLink.attr("href") || "";
    const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
    const clubId = clubIdMatch ? clubIdMatch[1] : "";

    const mvCell = $(cells[cells.length - 1]);
    const marketValue = mvCell.text().trim();
    const marketValueNum = parseMarketValue(marketValue);

    if (name && clubId && marketValueNum > 0) {
      teams.push({ name, marketValue, marketValueNum, logoUrl, clubId });
    }
  });

  return teams;
}

async function fetchLeagueData(league: typeof LEAGUES[number]): Promise<TeamFormEntry[]> {
  try {
    // Fetch league table
    const tableUrl = `${BASE_URL}/${league.slug}/tabelle/wettbewerb/${league.code}`;
    const tableHtml = await fetchPage(tableUrl);
    const $table = cheerio.load(tableHtml);
    const leagueTeams = parseLeagueTable($table);

    // Fetch market values
    const mvUrl = `${BASE_URL}/${league.slug}/startseite/wettbewerb/${league.code}`;
    const mvHtml = await fetchPage(mvUrl);
    const $mv = cheerio.load(mvHtml);
    const mvTeams = parseMarketValueTable($mv);

    // Sort by market value to determine expected positions
    const sortedByMV = [...mvTeams].sort((a, b) => b.marketValueNum - a.marketValueNum);
    const mvRankMap = new Map<string, { rank: number; value: string; valueNum: number }>();
    sortedByMV.forEach((team, idx) => {
      mvRankMap.set(team.clubId, { rank: idx + 1, value: team.marketValue, valueNum: team.marketValueNum });
    });

    // Create points by position lookup
    const pointsByPosition = new Map<number, number>();
    leagueTeams.forEach((team) => {
      pointsByPosition.set(team.position, team.points);
    });

    // Combine data and calculate delta
    const results: TeamFormEntry[] = [];
    for (const team of leagueTeams) {
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

const getTeamFormData = unstable_cache(
  async () => {
    const results = await Promise.all(LEAGUES.map(fetchLeagueData));
    const allTeams = results.flat();

    // Sort by delta pts for overperformers and underperformers
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
  },
  ["team-form"],
  { revalidate: 86400, tags: ["team-form"] }
);

export async function GET() {
  try {
    const data = await getTeamFormData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching team form data:", error);
    return NextResponse.json({ error: "Failed to fetch team form data" }, { status: 500 });
  }
}
