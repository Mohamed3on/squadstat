import * as cheerio from "cheerio";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";

const CACHE_REVALIDATE = 43200; // 12 hours

export async function fetchPlayerMinutes(playerId: string): Promise<number> {
  if (!playerId) return 0;
  try {
    const url = `${BASE_URL}/x/leistungsdaten/spieler/${playerId}`;
    const htmlContent = await fetchPage(url, CACHE_REVALIDATE);
    const $ = cheerio.load(htmlContent);
    const minutesText = $("table.items tfoot tr td.rechts").last().text().trim();
    const cleaned = minutesText.replace(/[.']/g, "").replace(/,/g, "");
    return parseInt(cleaned) || 0;
  } catch (err) {
    console.error(`Error fetching minutes for player ${playerId}:`, err);
    return 0;
  }
}
