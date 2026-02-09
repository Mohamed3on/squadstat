import * as cheerio from "cheerio";
import type { PlayerStatsResult } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";

const ZERO_STATS: PlayerStatsResult = {
  minutes: 0,
  appearances: 0,
  goals: 0,
  assists: 0,
  club: "",
  league: "",
  isNewSigning: false,
};

/** Raw fetch — no caching. Used by the offline refresh script. */
export async function fetchPlayerMinutesRaw(playerId: string): Promise<PlayerStatsResult> {
  if (!playerId) return ZERO_STATS;
  const url = `${BASE_URL}/x/leistungsdaten/spieler/${playerId}`;
  const htmlContent = await fetchPage(url);
  const $ = cheerio.load(htmlContent);

  const headlines = $("h2.content-box-headline")
    .map((_, el) => $(el).text().trim().toLowerCase())
    .get();
  if (headlines.some((h) => h.includes("career stats"))) return ZERO_STATS;

  // Club & league from data-header
  const clubInfo = $(".data-header__club-info");
  const club = clubInfo.find(".data-header__club a").text().trim();
  const league = clubInfo.find(".data-header__league a").text().trim();

  const footer = $("table.items tfoot tr").last();
  const parse = (s: string) => parseInt(s.trim().replace(/[.']/g, "").replace(/,/g, "")) || 0;

  const zentriert = footer.find("td.zentriert");
  const rechts = footer.find("td.rechts");

  const appearances = parse(zentriert.eq(0).text());
  const goals = parse(zentriert.eq(1).text());
  const assists = parse(zentriert.eq(2).text());
  const minutes = parse(rechts.last().text());

  const ribbonText = $(".data-header__ribbon span").text().trim().toLowerCase();
  const isNewSigning = ribbonText === "new arrival" || ribbonText === "on loan";

  return { minutes, appearances, goals, assists, club, league, isNewSigning };
}
