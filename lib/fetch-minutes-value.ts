import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import type { MinutesValuePlayer } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";
import { parseMarketValue } from "./parse-market-value";
import { getCurrentSeasonId } from "./player-parsing";

const CACHE_REVALIDATE = 259200; // 3 days
const MV_PAGES = 20;
const MINUTES_PAGES = 80;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMarketValueRow($: cheerio.CheerioAPI, row: any): Partial<MinutesValuePlayer> | null {
  const cells = $(row).find("> td");
  if (cells.length < 6) return null;

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

  // Nationality from flag images
  const natCell = $(cells[3]);
  const nationality = natCell.find("img").first().attr("title") || "";

  const clubCell = $(cells[4]);
  const clubInline = clubCell.find(".inline-table");
  const clubLink = clubInline.find("td.hauptlink a");
  const club = clubLink.attr("title") || clubLink.text().trim();
  const leagueLink = clubInline.find("tr").eq(1).find("a");
  const league = leagueLink.text().trim();

  const mvDisplay = $(cells[5]).text().trim();
  const marketValue = parseMarketValue(mvDisplay);

  if (!name || !playerId) return null;
  return { name, position, age, club, league, nationality, marketValue, marketValueDisplay: mvDisplay, imageUrl, profileUrl, playerId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMinutesRow($: cheerio.CheerioAPI, row: any): { playerId: string; minutes: number; clubMatches: number; intlMatches: number; totalMatches: number } | null {
  const cells = $(row).find("> td");
  if (cells.length < 9) return null;

  const nameCell = $(cells[1]);
  const profileUrl = nameCell.find(".inline-table td.hauptlink a").attr("href") || "";
  const playerIdMatch = profileUrl.match(/\/spieler\/(\d+)/);
  if (!playerIdMatch) return null;

  const clubMatches = parseInt($(cells[5]).find("a").text().trim()) || parseInt($(cells[5]).text().trim()) || 0;
  const intlMatches = parseInt($(cells[6]).find("a").text().trim()) || parseInt($(cells[6]).text().trim()) || 0;
  const minutesText = $(cells[7]).text().trim().replace(/[.']/g, "");
  const minutes = parseInt(minutesText) || 0;
  const totalMatches = parseInt($(cells[8]).text().trim()) || 0;

  return { playerId: playerIdMatch[1], minutes, clubMatches, intlMatches, totalMatches };
}

export const getMinutesValueData = unstable_cache(
  async (): Promise<MinutesValuePlayer[]> => {
    const seasonId = getCurrentSeasonId();

    // Build MV URLs
    const mvBaseUrl = `${BASE_URL}/spieler-statistik/wertvollstespieler/marktwertetop`;
    const mvUrls = Array.from({ length: MV_PAGES }, (_, i) => {
      const page = i + 1;
      const base = `${mvBaseUrl}?ajax=yw1&altersklasse=alle&ausrichtung=alle&land_id=0&yt0=Show`;
      return page === 1 ? base : `${base}&page=${page}`;
    });

    // Build Minutes URLs
    const minutesBaseUrl = `${BASE_URL}/meisteeinsaetze/gesamteinsaetze/statistik/${seasonId}/ajax/yw1/selectedOptionKey/6/land_id/0/saison_id/${seasonId}/altersklasse/alle/plus/1/sort/gesamtminuten.desc`;
    const minutesUrls = Array.from({ length: MINUTES_PAGES }, (_, i) => {
      const page = i + 1;
      return page === 1 ? `${minutesBaseUrl}?ajax=yw1` : `${minutesBaseUrl}/page/${page}?ajax=yw1`;
    });

    // Fetch both in parallel
    const [mvResults, minutesResults] = await Promise.all([
      Promise.allSettled(mvUrls.map((url) => fetchPage(url))),
      Promise.allSettled(minutesUrls.map((url) => fetchPage(url))),
    ]);

    // Parse MV data
    const mvMap = new Map<string, Partial<MinutesValuePlayer>>();
    for (const result of mvResults) {
      if (result.status !== "fulfilled") continue;
      const $ = cheerio.load(result.value);
      $("table.items > tbody > tr").each((_, row) => {
        const player = parseMarketValueRow($, row);
        if (player?.playerId) mvMap.set(player.playerId, player);
      });
    }

    // Parse minutes data
    const minutesMap = new Map<string, { minutes: number; clubMatches: number; intlMatches: number; totalMatches: number }>();
    for (const result of minutesResults) {
      if (result.status !== "fulfilled") continue;
      const $ = cheerio.load(result.value);
      $("table.items > tbody > tr").each((_, row) => {
        const data = parseMinutesRow($, row);
        if (data) minutesMap.set(data.playerId, data);
      });
    }

    // Merge: start from MV list, attach minutes (default 0 if not in minutes list)
    const players: MinutesValuePlayer[] = [];
    for (const [playerId, mv] of mvMap) {
      const mins = minutesMap.get(playerId);
      players.push({
        name: mv.name!,
        position: mv.position || "",
        age: mv.age || 0,
        club: mv.club || "",
        league: mv.league || "",
        nationality: mv.nationality || "",
        marketValue: mv.marketValue || 0,
        marketValueDisplay: mv.marketValueDisplay || "",
        minutes: mins?.minutes ?? 0,
        clubMatches: mins?.clubMatches ?? 0,
        intlMatches: mins?.intlMatches ?? 0,
        totalMatches: mins?.totalMatches ?? 0,
        imageUrl: mv.imageUrl || "",
        profileUrl: mv.profileUrl || "",
        playerId,
      });
    }

    // Sort by market value descending
    players.sort((a, b) => b.marketValue - a.marketValue);
    return players;
  },
  ["minutes-value"],
  { revalidate: CACHE_REVALIDATE, tags: ["minutes-value"] }
);
