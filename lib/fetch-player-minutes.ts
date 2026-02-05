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
        const $ = cheerio.load(htmlContent);

        // New layout: tm-player-performance-table (current season stats)
        const perfTable = $("tm-player-performance-table");
        if (perfTable.length > 0) {
          const totalRow = perfTable.find(".grid-row--dark").last();
          const cells = totalRow.find(".grid__cell--center");
          const minutesText = cells.last().text().trim();
          const cleaned = minutesText.replace(/[.']/g, "").replace(/,/g, "");
          return parseInt(cleaned) || 0;
        }

        // Old layout with "Career stats" = didn't play this season
        const headline = $("h2.content-box-headline").text().trim();
        if (headline.includes("Career stats")) {
          return 0;
        }

        return 0;
      } catch (err) {
        console.error(`Error fetching minutes for player ${playerId}:`, err);
        return 0;
      }
    },
    [`player-minutes-${playerId}`],
    { revalidate: 86400, tags: ["player-minutes"] }
  )();
}
