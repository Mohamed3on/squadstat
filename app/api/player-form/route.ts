import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.transfermarkt.com";

interface PlayerStats {
  name: string;
  position: string;
  age: number;
  club: string;
  league: string;
  matches: number;
  goals: number;
  assists: number;
  points: number;
  marketValue: number;
  marketValueDisplay: string;
  profileUrl: string;
  imageUrl: string;
  playerId: string;
  minutes?: number;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 43200 }, // Cache for 12 hours
  });
  return response.text();
}

function parseMarketValue(valueStr: string): number {
  const cleaned = valueStr.replace(/[€,]/g, "").trim();
  const match = cleaned.match(/([\d.]+)(m|k)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit === "m") return num * 1_000_000;
  if (unit === "k") return num * 1_000;
  return num;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePlayerRow($: cheerio.CheerioAPI, row: any): PlayerStats | null {
  const cells = $(row).find("> td");
  if (cells.length < 10) return null;

  const nameCell = $(cells[1]);
  const inlineTable = nameCell.find(".inline-table");
  const nameLink = inlineTable.find("td.hauptlink a");
  const name = nameLink.attr("title") || nameLink.text().trim();
  const profileUrl = nameLink.attr("href") || "";
  const position = inlineTable.find("tr").eq(1).find("td").text().trim();
  const imgEl = inlineTable.find("img").first();
  const imageUrl = imgEl.attr("data-src") || imgEl.attr("src") || "";

  const playerIdMatch = profileUrl.match(/\/spieler\/(\d+)/);
  const playerId = playerIdMatch ? playerIdMatch[1] : "";

  const age = parseInt($(cells[2]).text().trim()) || 0;

  const clubCell = $(cells[4]);
  const clubInline = clubCell.find(".inline-table");
  const clubLink = clubInline.find("td.hauptlink a");
  const club = clubLink.attr("title") || clubLink.text().trim();
  const leagueLink = clubInline.find("tr").eq(1).find("a");
  const league = leagueLink.text().trim();

  const matches = parseInt($(cells[5]).find("a").text().trim()) || parseInt($(cells[5]).text().trim()) || 0;
  const goals = parseInt($(cells[6]).text().trim()) || 0;
  const assists = parseInt($(cells[7]).text().trim()) || 0;
  const points = parseInt($(cells[8]).text().trim()) || 0;
  const marketValueDisplay = $(cells[9]).text().trim();
  const marketValue = parseMarketValue(marketValueDisplay);

  if (!name) return null;
  return { name, position, age, club, league, matches, goals, assists, points, marketValue, marketValueDisplay, profileUrl, imageUrl, playerId };
}

function getCurrentSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month < 9 ? String(year - 1) : String(year);
}

async function fetchTopScorers(positionType: string = "forward"): Promise<PlayerStats[]> {
  const seasonId = getCurrentSeasonId();

  let positionPath = "";
  switch (positionType) {
    case "cf":
      positionPath = "ausrichtung//spielerposition_id/14";
      break;
    case "rw":
      positionPath = "ausrichtung//spielerposition_id/12";
      break;
    case "lw":
      positionPath = "ausrichtung//spielerposition_id/11";
      break;
    case "all":
      positionPath = "ausrichtung//spielerposition_id/";
      break;
    case "forward":
    default:
      positionPath = "ausrichtung/Sturm/spielerposition_id/";
      break;
  }

  const baseUrl = `${BASE_URL}/scorer/topscorer/statistik/${seasonId}/saison_id/${seasonId}/selectedOptionKey/6/land_id/0/altersklasse//${positionPath}/filter/0/yt0/Show/plus/1/galerie/0/sort/marktwert.desc`;

  // Fetch all pages in parallel for speed
  const pageUrls = Array.from({ length: 10 }, (_, i) => {
    const page = i + 1;
    return page === 1 ? `${baseUrl}?ajax=yw1` : `${baseUrl}/page/${page}?ajax=yw1`;
  });

  const pageResults = await Promise.allSettled(pageUrls.map(fetchPage));

  const players: PlayerStats[] = [];
  for (const result of pageResults) {
    if (result.status === "fulfilled") {
      const $ = cheerio.load(result.value);
      const rows = $("table.items > tbody > tr");
      rows.each((_, row) => {
        const player = parsePlayerRow($, row);
        if (player?.name) players.push(player);
      });
    }
  }

  return players;
}

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

async function fetchPlayerMinutes(playerId: string): Promise<number> {
  if (!playerId) return 0;
  try {
    const url = `${BASE_URL}/x/leistungsdaten/spieler/${playerId}`;
    const htmlContent = await fetchPage(url);
    const $ = cheerio.load(htmlContent);
    const minutesText = $("table.items tfoot tr td.rechts").last().text().trim();
    const cleaned = minutesText.replace(/[.']/g, "").replace(/,/g, "");
    return parseInt(cleaned) || 0;
  } catch (err) {
    console.error(`Error fetching minutes for player ${playerId}:`, err);
    return 0;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerName = searchParams.get("name");
  const positionType = searchParams.get("position") || "forward";
  const includeMinutes = searchParams.get("minutes") === "true";

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

    if (includeMinutes) {
      targetPlayer.minutes = await fetchPlayerMinutes(targetPlayer.playerId);
      await Promise.all(
        underperformers.map(async (p) => {
          p.minutes = await fetchPlayerMinutes(p.playerId);
        })
      );
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
