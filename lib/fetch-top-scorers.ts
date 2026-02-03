import * as cheerio from "cheerio";
import type { PlayerStats } from "@/app/types";
import { BASE_URL } from "./constants";
import { fetchPage } from "./fetch";
import { parsePlayerRow, getCurrentSeasonId } from "./player-parsing";

const CACHE_REVALIDATE = 43200; // 12 hours

export async function fetchTopScorers(positionType: string = "forward"): Promise<PlayerStats[]> {
  const seasonId = getCurrentSeasonId();

  let positionPath = "";
  switch (positionType) {
    case "cf":
      positionPath = "ausrichtung//spielerposition_id/14";
      break;
    case "midfielder":
      positionPath = "ausrichtung/Mittelfeld/spielerposition_id/";
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

  const pageResults = await Promise.allSettled(pageUrls.map((url) => fetchPage(url, CACHE_REVALIDATE)));

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

  return players;
}
