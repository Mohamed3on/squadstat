import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import type { InjuredPlayer } from "@/app/types";

const BASE_URL = "https://www.transfermarkt.com";

const LEAGUES = [
  { code: "L1", name: "Bundesliga", slug: "bundesliga" },
  { code: "GB1", name: "Premier League", slug: "premier-league" },
  { code: "ES1", name: "La Liga", slug: "laliga" },
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
  const match = cleaned.match(/([\d.]+)(k|m)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit === "m") return num * 1_000_000;
  if (unit === "k") return num * 1_000;
  return num;
}

function parseInjuredPlayers($: cheerio.CheerioAPI, leagueName: string): InjuredPlayer[] {
  const players: InjuredPlayer[] = [];

  $("table.items > tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 5) return;

    const nameCell = $(cells[0]);
    const inlineTable = nameCell.find(".inline-table");
    const playerLink = inlineTable.find(".hauptlink a").first();
    const name = playerLink.attr("title") || playerLink.text().trim();
    const profileUrl = playerLink.attr("href") || "";
    const position = inlineTable.find("tr:last-child td").text().trim();
    const imageUrl = inlineTable.find("img").attr("data-src") || inlineTable.find("img").attr("src") || "";

    const clubCell = $(cells[1]);
    const clubLink = clubCell.find("a").first();
    const club = clubLink.attr("title") || "";
    const clubLogoUrl = clubCell.find("img").attr("src") || "";

    const injury = $(cells[2]).text().trim();
    const returnDate = $(cells[3]).text().trim();
    const marketValue = $(cells[4]).text().trim();
    const marketValueNum = parseMarketValue(marketValue);

    if (name && marketValueNum > 0) {
      players.push({
        name,
        position,
        club,
        clubLogoUrl,
        injury,
        returnDate,
        marketValue,
        marketValueNum,
        imageUrl,
        profileUrl: profileUrl ? `${BASE_URL}${profileUrl}` : "",
        league: leagueName,
      });
    }
  });

  return players;
}

async function fetchLeagueInjured(league: typeof LEAGUES[number]): Promise<InjuredPlayer[]> {
  const url = `${BASE_URL}/${league.slug}/verletztespieler/wettbewerb/${league.code}/ajax/yw1/sort/marktwert.desc?ajax=yw1`;
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    return parseInjuredPlayers($, league.name);
  } catch (error) {
    console.error(`Failed to fetch ${league.name}:`, error);
    return [];
  }
}

const getInjuredPlayers = unstable_cache(
  async () => {
    // Fetch all leagues in parallel for maximum speed
    const results = await Promise.all(LEAGUES.map(fetchLeagueInjured));

    // Flatten and sort by market value
    const allPlayers = results.flat().sort((a, b) => b.marketValueNum - a.marketValueNum);

    return {
      success: true,
      players: allPlayers,
      totalPlayers: allPlayers.length,
      leagues: LEAGUES.map(l => l.name),
    };
  },
  ["injured-players"],
  { revalidate: 86400, tags: ["injured"] } // 24 hour cache
);

export async function GET() {
  try {
    const data = await getInjuredPlayers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching injured players:", error);
    return NextResponse.json({ error: "Failed to fetch injured players" }, { status: 500 });
  }
}
