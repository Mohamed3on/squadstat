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

interface CacheEntry {
  data: PlayerStats[];
  timestamp: number;
}

// In-memory cache for 24 hours
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 43200 },
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

async function fetchTopScorers(positionType: string): Promise<PlayerStats[]> {
  const seasonId = getCurrentSeasonId();

  let positionPath = "";
  switch (positionType) {
    case "cf":
      positionPath = "ausrichtung//spielerposition_id/14";
      break;
    case "forward":
    default:
      positionPath = "ausrichtung/Sturm/spielerposition_id/";
      break;
  }

  const baseUrl = `${BASE_URL}/scorer/topscorer/statistik/${seasonId}/saison_id/${seasonId}/selectedOptionKey/6/land_id/0/altersklasse//${positionPath}/filter/0/yt0/Show/plus/1/galerie/0/sort/marktwert.desc`;

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

  // Sort by market value descending
  return players.sort((a, b) => b.marketValue - a.marketValue);
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
  } catch {
    return 0;
  }
}

/**
 * Step 1: Find candidates - players who seem to underperform based on points vs cheaper players
 * A player is a candidate if there exists a cheaper player with more points
 */
function findCandidates(players: PlayerStats[]): PlayerStats[] {
  const candidates: PlayerStats[] = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    // Check if any cheaper player (later in the sorted list) has more points
    const cheaperWithMorePoints = players.slice(i + 1).some(p => p.points > player.points);
    if (cheaperWithMorePoints) {
      candidates.push(player);
    }
  }

  return candidates;
}

/**
 * Step 2: After fetching minutes, find real underperformers
 * A player is a real underperformer if NO player with >= market value AND >= minutes has fewer points
 */
function findRealUnderperformers(players: PlayerStats[]): PlayerStats[] {
  return players.filter(player => {
    // Check if there's anyone with >= value and >= minutes who has fewer points
    const dominatedBy = players.some(other =>
      other.playerId !== player.playerId &&
      other.marketValue >= player.marketValue &&
      (other.minutes ?? 0) >= (player.minutes ?? 0) &&
      other.points < player.points
    );
    // Real underperformer = NOT dominated by anyone
    return !dominatedBy;
  });
}

async function computeUnderperformers(positionType: string): Promise<PlayerStats[]> {
  // Step 1: Fetch all players sorted by market value desc
  const allPlayers = await fetchTopScorers(positionType);

  // Step 2: Find candidates (preliminary filter without minutes)
  const candidates = findCandidates(allPlayers);

  if (candidates.length === 0) {
    return [];
  }

  // Step 3: Fetch minutes only for candidates (in parallel, batched for speed)
  const BATCH_SIZE = 20;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const minutesResults = await Promise.all(
      batch.map(p => fetchPlayerMinutes(p.playerId))
    );
    batch.forEach((player, idx) => {
      player.minutes = minutesResults[idx];
    });
  }

  // Step 4: Apply real underperformer filter with minutes
  const realUnderperformers = findRealUnderperformers(candidates);

  // Sort by market value descending
  return realUnderperformers.sort((a, b) => b.marketValue - a.marketValue);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const positionType = searchParams.get("position") || "cf";

  // Validate position type
  if (!["forward", "cf"].includes(positionType)) {
    return NextResponse.json({ error: "Invalid position type" }, { status: 400 });
  }

  const cacheKey = `underperformers-${positionType}`;
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return NextResponse.json({
      underperformers: cached.data,
      cached: true,
      cacheAge: Math.floor((now - cached.timestamp) / 1000 / 60), // minutes
    });
  }

  try {
    const underperformers = await computeUnderperformers(positionType);

    // Update cache
    cache.set(cacheKey, { data: underperformers, timestamp: now });

    return NextResponse.json({
      underperformers,
      cached: false,
    });
  } catch (error) {
    console.error("Error computing underperformers:", error);
    return NextResponse.json({ error: "Failed to compute underperformers" }, { status: 500 });
  }
}
