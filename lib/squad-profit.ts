import * as cheerio from "cheerio";
import { BASE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copies";
import { fetchPage } from "@/lib/fetch";
import { parseMarketValue } from "@/lib/parse-market-value";

/** One club's squad: what it is worth today against what was paid for it. */
export interface SquadProfitClub {
  id: string;
  name: string;
  league: string;
  marketValue: number;
  purchaseValue: number;
  /** Market value minus purchase value, in euros. */
  diff: number;
  /** Transfermarkt's "value added": the difference as a percent of market value. */
  pct: number;
  /** On the Pareto frontier: no club higher up the table moved its squad by a bigger share. */
  star: boolean;
}

export interface SquadProfit {
  winners: SquadProfitClub[];
  losers: SquadProfitClub[];
}

type Row = Omit<SquadProfitClub, "star">;

// Youth and reserve sides land among the losers with four-digit percentages on a
// few million, which would hand them every star.
const YOUTH = /\bU\d{2}$/;

const pageUrl = (sort: string) =>
  `${BASE_URL}/transfers/einkaufswert/statistik?land_id=&plus=1&sort=${sort}`;

const signed = (text: string) => Math.round((text.includes("-") ? -1 : 1) * parseMarketValue(text));

export function parseSquadProfit(html: string): Row[] {
  const $ = cheerio.load(html);
  return $("table.items > tbody > tr")
    .toArray()
    .flatMap((tr) => {
      const td = $(tr).children("td");
      const link = td.eq(1).find("a").last();
      const id = link.attr("href")?.match(/\/verein\/(\d+)/)?.[1];
      if (!id) return [];
      return [
        {
          id,
          name: link.text().trim(),
          league: td.eq(2).find("a").first().text().trim(),
          marketValue: parseMarketValue(td.eq(5).text()),
          purchaseValue: parseMarketValue(td.eq(6).text()),
          diff: signed(td.eq(7).text()),
          pct: parseFloat(td.eq(8).text().replace(/\s/g, "")),
        },
      ];
    });
}

/** Walking down from the biggest absolute move, a club is starred when its share
 *  beats every club above it — the top one always, then each that does more with less. */
export function starFrontier(clubs: Row[]): SquadProfitClub[] {
  let best = -Infinity;
  return clubs.map((c) => {
    const star = Math.abs(c.pct) > best;
    if (star) best = Math.abs(c.pct);
    return { ...c, star };
  });
}

/** Page one of each end of the table, raw. The filter and the stars are applied on
 *  read, so a deploy that changes them can't be served a copy of the old ones. */
async function scrapeSquadProfit(): Promise<{ up: Row[]; down: Row[] }> {
  const [up, down] = await Promise.all(
    ["diff.desc", "diff"].map(async (sort) => {
      const clubs = parseSquadProfit(await fetchPage(pageUrl(sort)));
      if (clubs.length === 0) throw new Error(`[squad-profit] empty table for sort=${sort}`);
      return clubs;
    }),
  );
  return { up, down };
}

export const squadProfitSource = {
  key: "squad-profit",
  label: "squad profit",
  maxAge: 86400,
  scrape: scrapeSquadProfit,
};

const senior = (clubs: Row[]) => clubs.filter((c) => !YOUTH.test(c.name));

export async function getSquadProfit(): Promise<SquadProfit> {
  const { up, down } = await getCopy(squadProfitSource);
  return {
    winners: starFrontier(senior(up).filter((c) => c.diff > 0)),
    losers: starFrontier(senior(down).filter((c) => c.diff < 0)),
  };
}
