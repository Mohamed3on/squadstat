import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import type { InjuredPlayer } from "@/app/types";
import { BASE_URL } from "./constants";
import { LEAGUES } from "./leagues";
import { fetchPage } from "./fetch";
import { parseMarketValue } from "./parse-market-value";

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
    const clubLogoUrl = (clubCell.find("img").attr("src") || "").replace("/tiny/", "/head/");

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

async function fetchLeagueInjured(league: (typeof LEAGUES)[number]): Promise<InjuredPlayer[]> {
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

export const getInjuredPlayers = unstable_cache(
  async () => {
    const results = await Promise.all(LEAGUES.map(fetchLeagueInjured));
    const allPlayers = results.flat().sort((a, b) => b.marketValueNum - a.marketValueNum);

    return {
      success: true,
      players: allPlayers,
      totalPlayers: allPlayers.length,
      leagues: LEAGUES.map((l) => l.name),
    };
  },
  ["injured-players"],
  { revalidate: 86400, tags: ["injured"] }
);
