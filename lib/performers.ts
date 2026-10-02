import type { TeamFormEntry } from "@/app/types";

/** Clubs above and below the table their squad value predicts, biggest gap first,
 *  the richer squad first on a tie. Its own module, not lib/team-form's: the Value
 *  vs Table view re-splits per league in the browser, and importing anything from
 *  team-form dragged its scrapers (cheerio, the fetch layer) into that bundle. */
export function splitPerformers(teams: TeamFormEntry[], limit?: number) {
  const over = teams
    .filter((t) => t.deltaPts > 0)
    .sort((a, b) => b.deltaPts - a.deltaPts || b.marketValueNum - a.marketValueNum);
  const under = teams
    .filter((t) => t.deltaPts < 0)
    .sort((a, b) => a.deltaPts - b.deltaPts || b.marketValueNum - a.marketValueNum);
  return {
    overperformers: limit ? over.slice(0, limit) : over,
    underperformers: limit ? under.slice(0, limit) : under,
  };
}
