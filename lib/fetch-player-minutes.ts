import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";

export async function fetchPlayerMinutes(playerId: string): Promise<number> {
  if (!playerId) return 0;
  return unstable_cache(
    async () => {
      try {
        const url = `${BASE_URL}/x/leistungsdaten/spieler/${playerId}`;
        const htmlContent = await fetchPage(url);
        console.log(`[player-minutes] ${playerId}: htmlLength=${htmlContent.length} hasTableItems=${htmlContent.includes('class="items"')} hasTfoot=${htmlContent.includes('tfoot')}`);
        const $ = cheerio.load(htmlContent);

        // "Career stats" = didn't play this season
        const headline = $("h2.content-box-headline").first().text().trim();
        console.log(`[player-minutes] ${playerId}: headline="${headline}"`);
        if (headline.includes("Career stats")) return 0;

        const minutesText = $("table.items tfoot tr td.rechts").last().text().trim();
        const cleaned = minutesText.replace(/[.']/g, "").replace(/,/g, "");
        const result = parseInt(cleaned) || 0;
        console.log(`[player-minutes] ${playerId}: minutesText="${minutesText}" cleaned="${cleaned}" result=${result}`);
        return result;
      } catch (err) {
        console.error(`[player-minutes] ${playerId}: ERROR`, err);
        return 0;
      }
    },
    [`player-minutes-${playerId}`],
    { revalidate: 86400, tags: ["player-minutes"] }
  )();
}
