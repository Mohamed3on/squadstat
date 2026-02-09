import * as cheerio from "cheerio";
import { readFile } from "fs/promises";
import { join } from "path";
import type { MinutesValuePlayer, PlayerStats } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";
import { parseMarketValue } from "./parse-market-value";

const MV_PAGES = 20;

export { FORWARD_POSITIONS, POSITION_MAP } from "./positions";

export function toPlayerStats(p: MinutesValuePlayer): PlayerStats {
  return {
    name: p.name,
    position: p.position,
    age: p.age,
    club: p.club,
    league: p.league,
    matches: p.totalMatches,
    goals: p.goals,
    assists: p.assists,
    points: p.goals + p.assists,
    marketValue: p.marketValue,
    marketValueDisplay: p.marketValueDisplay,
    profileUrl: p.profileUrl,
    imageUrl: p.imageUrl,
    playerId: p.playerId,
    minutes: p.minutes,
    isNewSigning: p.isNewSigning,
  };
}

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
  const imageUrl = (imgEl.attr("data-src") || imgEl.attr("src") || "").replace("/small/", "/header/");

  const playerIdMatch = profileUrl.match(/\/spieler\/(\d+)/);
  const playerId = playerIdMatch ? playerIdMatch[1] : "";

  const age = parseInt($(cells[2]).text().trim()) || 0;

  // Nationality from flag images
  const natCell = $(cells[3]);
  const nationality = natCell.find("img").first().attr("title") || "";

  const clubCell = $(cells[4]);
  const clubLink = clubCell.find("a").first();
  const club = clubLink.attr("title") || clubLink.find("img").attr("title") || "";
  const league = "";

  const mvDisplay = $(cells[5]).text().trim();
  const marketValue = parseMarketValue(mvDisplay);

  if (!name || !playerId) return null;
  return { name, position, age, club, league, nationality, marketValue, marketValueDisplay: mvDisplay, imageUrl, profileUrl, playerId };
}

/** Raw scraper — no caching. Fetches MV pages only (identity + market value). */
export async function fetchMinutesValueRaw(): Promise<MinutesValuePlayer[]> {
  const mvBaseUrl = `${BASE_URL}/spieler-statistik/wertvollstespieler/marktwertetop`;
  const mvUrls = Array.from({ length: MV_PAGES }, (_, i) => {
    const page = i + 1;
    const base = `${mvBaseUrl}?ajax=yw1&altersklasse=alle&ausrichtung=alle&land_id=0&yt0=Show`;
    return page === 1 ? base : `${base}&page=${page}`;
  });

  const mvResults = await Promise.allSettled(mvUrls.map((url) => fetchPage(url)));

  const mvMap = new Map<string, Partial<MinutesValuePlayer>>();
  for (const result of mvResults) {
    if (result.status !== "fulfilled") continue;
    const $ = cheerio.load(result.value);
    $("table.items > tbody > tr").each((_, row) => {
      const player = parseMarketValueRow($, row);
      if (player?.playerId) mvMap.set(player.playerId, player);
    });
  }

  const players: MinutesValuePlayer[] = [];
  for (const [playerId, mv] of mvMap) {
    players.push({
      name: mv.name!,
      position: mv.position || "",
      age: mv.age || 0,
      club: mv.club || "",
      league: mv.league || "",
      nationality: mv.nationality || "",
      marketValue: mv.marketValue || 0,
      marketValueDisplay: mv.marketValueDisplay || "",
      minutes: 0,
      clubMatches: 0,
      intlMatches: 0,
      totalMatches: 0,
      goals: 0,
      assists: 0,
      imageUrl: mv.imageUrl || "",
      profileUrl: mv.profileUrl || "",
      playerId,
    });
  }

  players.sort((a, b) => b.marketValue - a.marketValue);
  return players;
}

/** Reads pre-built JSON data committed to the repo. */
export async function getMinutesValueData(): Promise<MinutesValuePlayer[]> {
  const filePath = join(process.cwd(), "data", "minutes-value.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as MinutesValuePlayer[];
}
