import * as cheerio from "cheerio";
import type { PlayerStats } from "@/app/types";
import { parseMarketValue } from "./parse-market-value";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePlayerRow($: cheerio.CheerioAPI, row: any): PlayerStats | null {
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

export function getCurrentSeasonId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month < 9 ? String(year - 1) : String(year);
}
