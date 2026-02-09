import * as cheerio from "cheerio";
import type { MinutesValuePlayer } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";
import { parseMarketValue } from "./parse-market-value";

const SCORER_PAGES = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTopScorerRow($: cheerio.CheerioAPI, row: any): MinutesValuePlayer | null {
  const cells = $(row).find("> td");
  if (cells.length < 8) return null;

  // Cell 1: Player (inline-table with name, position, image, profileUrl)
  const nameCell = $(cells[1]);
  const inlineTable = nameCell.find(".inline-table");
  const nameLink = inlineTable.find("td.hauptlink a");
  const name = nameLink.attr("title") || nameLink.text().trim();
  const profileUrl = nameLink.attr("href") || "";
  const position = inlineTable.find("tr").eq(1).find("td").text().trim();
  const imgEl = inlineTable.find("img").first();
  const imageUrl = (imgEl.attr("data-src") || imgEl.attr("src") || "").replace("/medium/", "/header/");

  const playerIdMatch = profileUrl.match(/\/spieler\/(\d+)/);
  const playerId = playerIdMatch ? playerIdMatch[1] : "";

  // Cell 2: Age
  const age = parseInt($(cells[2]).text().trim()) || 0;

  // Cell 3: Nationality
  const nationality = $(cells[3]).find("img").first().attr("title") || "";

  // Cell 4: Club / League (inline-table)
  const clubCell = $(cells[4]);
  const clubInline = clubCell.find(".inline-table");
  const club = clubInline.find("td.hauptlink a").attr("title") || "";
  const league = clubInline.find("tr").eq(1).find("a").attr("title") || "";

  // Cell 5: Matches
  const totalMatches = parseInt($(cells[5]).text().trim()) || 0;

  // Cell 6: Goals
  const goals = parseInt($(cells[6]).text().trim()) || 0;

  // Cell 7: Assists
  const assists = parseInt($(cells[7]).text().trim()) || 0;

  // Last cell: Market Value (e.g. "€50.00m") — only present when cell contains "€"
  const lastCell = $(cells[cells.length - 1]);
  const lastText = lastCell.text().trim();
  const hasMV = lastText.includes("€");
  const marketValue = hasMV ? parseMarketValue(lastText) : 0;
  const marketValueDisplay = hasMV ? lastText : "-";

  if (!name || !playerId) return null;

  return {
    name,
    position,
    age,
    club,
    league,
    nationality,
    marketValue,
    marketValueDisplay,
    minutes: 0,
    clubMatches: 0,
    intlMatches: 0,
    totalMatches,
    goals,
    assists,
    imageUrl,
    profileUrl,
    playerId,
  };
}

/** Fetches top scorers from Transfermarkt (2 pages, ~50 players). */
export async function fetchTopScorersRaw(): Promise<MinutesValuePlayer[]> {
  const baseUrl = `${BASE_URL}/scorer/topscorer/statistik/2024/saison_id/2025/selectedOptionKey/6/land_id/0/altersklasse//ausrichtung//spielerposition_id//filter/0/yt0/Show/plus/1/galerie/0`;
  const urls = Array.from({ length: SCORER_PAGES }, (_, i) => {
    const page = i + 1;
    return page === 1 ? `${baseUrl}?ajax=yw1` : `${baseUrl}/page/${page}?ajax=yw1`;
  });

  const results = await Promise.allSettled(urls.map((url) => fetchPage(url)));

  const players: MinutesValuePlayer[] = [];
  const seen = new Set<string>();

  for (const [index, result] of results.entries()) {
    if (result.status !== "fulfilled") {
      console.error(`[fetchTopScorersRaw] Failed to fetch ${urls[index]}:`, result.reason);
      continue;
    }
    const $ = cheerio.load(result.value);
    $("table.items > tbody > tr").each((_, row) => {
      const player = parseTopScorerRow($, row);
      if (player && !seen.has(player.playerId)) {
        seen.add(player.playerId);
        players.push(player);
      }
    });
  }

  return players;
}
