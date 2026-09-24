import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as cheerio from "cheerio";
import { BASE_URL } from "@/lib/constants";
import { fetchPage } from "@/lib/fetch";
import { parseMarketValue } from "@/lib/parse-market-value";
import { canonicalLeagueName } from "@/lib/leagues";
import type {
  NationalTeamValue,
  NationalTeamValueResult,
  SquadValueClub,
  SquadValueResult,
} from "@/app/types";

const DATA_DIR = join(process.cwd(), "data");
const LABEL = "squad-values";

/** TM serves 25 teams a page. A short page anywhere but the end of a table
 *  means the selectors moved or we got a rate-limit stub, not a thin day. */
const PER_PAGE = 25;
/** The club table runs thousands deep; its first four pages are the hundred.
 *  The national one is read to its end. */
const CLUB_PAGES = 4;

/** `plus=1` is what adds the three derived columns — value per player, what the
 *  top eighteen are worth, and their share. Without it TM serves only squad
 *  size, average age and the total. */
const clubsUrl = (page: number) =>
  `${BASE_URL}/vereins-statistik/wertvollstemannschaften/marktwertetop?plus=1&page=${page}`;

/** Here `plus=1` adds only value per player — TM prints no top eighteen for
 *  national teams — and `kontinent_id=0` is every confederation. */
const nationsUrl = (page: number) =>
  `${BASE_URL}/vereins-statistik/wertvollstenationalmannschaften/marktwertetop?kontinent_id=0&plus=1&page=${page}`;

const CLUB_ID = /\/verein\/(\d+)/;
const COMPETITION = /\/wettbewerb\/([A-Za-z0-9]+)$/;
/** TM addresses a flag by its country id: /flagge/tiny/50.png is France. */
const LAND_ID = /\/flagge\/\w+\/(\d+)\.png/;
const PAGE = /[?&]page=(\d+)/;

/** #, crest, club, competition, squad size, ø age, value, ø per player, top 18, share. */
const COL = {
  club: 2,
  competition: 3,
  squadSize: 4,
  averageAge: 5,
  totalValue: 6,
  averageValue: 7,
  topEighteenValue: 8,
  topEighteenShare: 9,
} as const;

/** #, flag and country, confederation, squad size, ø age, value, ø per player. */
const NATION_COL = {
  nation: 1,
  confederation: 2,
  squadSize: 3,
  averageAge: 4,
  totalValue: 5,
  averageValue: 6,
} as const;

/** The one confederation TM spells out rather than abbreviates. */
const CONFEDERATION: Record<string, string> = {
  "South American Football Confederation": "CONMEBOL",
};

function parseClubs(html: string): SquadValueClub[] {
  const $ = cheerio.load(html);
  const clubs: SquadValueClub[] = [];

  $("table.items > tbody > tr").each((_, el) => {
    const cells = $(el).find("> td");
    const link = $(cells[COL.club]).find("a").first();
    const id = (link.attr("href") || "").match(CLUB_ID)?.[1];
    if (!id) return; // header / spacer row

    const competition = $(cells[COL.competition]).find("a[href*='/wettbewerb/']").first();
    const text = (i: number) => $(cells[i]).text().trim();

    clubs.push({
      id,
      name: link.attr("title") || link.text().trim(),
      league: canonicalLeagueName(competition.text().trim()),
      leagueCode: (competition.attr("href") || "").match(COMPETITION)?.[1] ?? "",
      squadSize: Number(text(COL.squadSize)) || 0,
      averageAge: Number(text(COL.averageAge)) || 0,
      totalValue: parseMarketValue(text(COL.totalValue)),
      averageValue: parseMarketValue(text(COL.averageValue)),
      topEighteenValue: parseMarketValue(text(COL.topEighteenValue)),
      topEighteenShare: parseFloat(text(COL.topEighteenShare)) || 0,
    });
  });

  return clubs;
}

function parseNations(html: string): NationalTeamValue[] {
  const $ = cheerio.load(html);
  const teams: NationalTeamValue[] = [];

  $("table.items > tbody > tr").each((_, el) => {
    // Direct cells only: the country cell nests a table of its own for the flag.
    const cells = $(el).find("> td");
    const nation = $(cells[NATION_COL.nation]);
    const link = nation.find("td.hauptlink a").first();
    const id = (link.attr("href") || "").match(CLUB_ID)?.[1];
    if (!id) return; // header / spacer row

    const text = (i: number) => $(cells[i]).text().trim();
    const confederation = text(NATION_COL.confederation);

    teams.push({
      id,
      name: link.attr("title") || link.text().trim(),
      landId: Number((nation.find("img").attr("src") || "").match(LAND_ID)?.[1]) || 0,
      confederation: CONFEDERATION[confederation] ?? confederation,
      squadSize: Number(text(NATION_COL.squadSize)) || 0,
      averageAge: Number(text(NATION_COL.averageAge)) || 0,
      totalValue: parseMarketValue(text(NATION_COL.totalValue)),
      averageValue: parseMarketValue(text(NATION_COL.averageValue)),
    });
  });

  return teams;
}

/** A table's last page, off the pagination every page carries. */
function lastPage(html: string): number {
  const $ = cheerio.load(html);
  const pages = $(".tm-pagination a")
    .map((_, a) => Number(($(a).attr("href") || "").match(PAGE)?.[1]) || 1)
    .get();
  return Math.max(1, ...pages);
}

/** The first `depth` pages of one table, or all of it without a depth, each
 *  checked for a full page — bar the table's own last. */
async function scrape<T extends { id: string }>(
  what: string,
  url: (page: number) => string,
  parse: (html: string) => T[],
  depth?: number,
): Promise<T[]> {
  const first = await fetchPage(url(1));
  const last = depth ?? lastPage(first);
  const rest = await Promise.all(Array.from({ length: last - 1 }, (_, i) => fetchPage(url(i + 2))));
  const pages = [first, ...rest].map(parse);

  pages.forEach((rows, i) => {
    const end = depth === undefined && i === last - 1;
    if (end ? rows.length === 0 : rows.length !== PER_PAGE) {
      throw new Error(
        `Parsed ${rows.length} ${what} from page ${i + 1} (expected ${end ? "some" : PER_PAGE}) — selectors moved or Transfermarkt is rate limiting.`,
      );
    }
  });
  const rows = pages.flat();

  // Same team on two pages means the table shifted under the paging, which
  // would silently drop whoever it pushed off the end.
  const ids = new Set(rows.map((r) => r.id));
  if (ids.size !== rows.length) {
    throw new Error(
      `${rows.length - ids.size} ${what} appear twice across ${last} pages — the table moved mid-scrape.`,
    );
  }
  return rows;
}

async function save(
  file: string,
  what: string,
  rows: { name: string; averageValue: number }[],
  data: SquadValueResult | NationalTeamValueResult,
) {
  const out = join(DATA_DIR, `${file}.json`);
  const next = JSON.stringify(data);
  if (next === (await readFile(out, "utf-8").catch(() => ""))) {
    // The scrape runs on the plain 3-hourly tick, but squad values only move on
    // a market-value update or a completed transfer. Writing nothing when
    // nothing changed keeps the timestamp honest and saves a deploy.
    console.log(`[${LABEL}] Unchanged — ${rows.length} ${what}`);
    return;
  }

  await writeFile(out, next);
  await writeFile(join(DATA_DIR, `${file}-updated-at.txt`), new Date().toISOString());
  console.log(
    `[${LABEL}] ${rows.length} ${what} — ${rows[0].name} leads on value, ` +
      `${[...rows].sort((a, b) => b.averageValue - a.averageValue)[0].name} on value per player`,
  );
}

async function main() {
  const [clubs, nations] = await Promise.all([
    scrape("clubs", clubsUrl, parseClubs, CLUB_PAGES),
    scrape("national teams", nationsUrl, parseNations),
  ]);
  // The national table runs on past the valued sides into ones TM has no
  // figures for — gone ones like the Soviet Union, and a few like the Bahamas
  // it has never valued — which a value ranking can't place.
  const teams = nations.filter((t) => t.totalValue > 0);
  await save("squad-values", "clubs", clubs, { clubs });
  await save("national-team-values", "national teams", teams, { teams });
}

main().catch((err) => {
  console.error(`[${LABEL}] Fatal error:`, err);
  process.exit(1);
});
