import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as cheerio from "cheerio";
import { BASE_URL } from "@/lib/constants";
import { fetchPage } from "@/lib/fetch";
import { parseMarketValue } from "@/lib/parse-market-value";
import type { SquadValueClub, SquadValueResult } from "@/app/types";

const DATA_DIR = join(process.cwd(), "data");
const LABEL = "squad-values";
const OUT = join(DATA_DIR, "squad-values.json");
const STAMP = join(DATA_DIR, "squad-values-updated-at.txt");

/** TM serves 25 clubs a page, and the table is four pages deep. A short page
 *  means the selectors moved or we got a rate-limit stub, not a thin day. */
const PAGES = [1, 2, 3, 4];
const PER_PAGE = 25;

/** `plus=1` is what adds the three derived columns — value per player, what the
 *  top eighteen are worth, and their share. Without it TM serves only squad
 *  size, average age and the total. */
const pageUrl = (page: number) =>
  `${BASE_URL}/vereins-statistik/wertvollstemannschaften/marktwertetop?plus=1&page=${page}`;

const CLUB_ID = /\/verein\/(\d+)/;
const COMPETITION = /\/wettbewerb\/([A-Za-z0-9]+)$/;

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

function parseClubs(html: string, page: number): SquadValueClub[] {
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
      league: competition.text().trim(),
      leagueCode: (competition.attr("href") || "").match(COMPETITION)?.[1] ?? "",
      squadSize: Number(text(COL.squadSize)) || 0,
      averageAge: Number(text(COL.averageAge)) || 0,
      totalValue: parseMarketValue(text(COL.totalValue)),
      averageValue: parseMarketValue(text(COL.averageValue)),
      topEighteenValue: parseMarketValue(text(COL.topEighteenValue)),
      topEighteenShare: parseFloat(text(COL.topEighteenShare)) || 0,
    });
  });

  if (clubs.length !== PER_PAGE) {
    throw new Error(
      `Parsed ${clubs.length} clubs from page ${page} (expected ${PER_PAGE}) — selectors moved or Transfermarkt is rate limiting.`,
    );
  }
  return clubs;
}

async function main() {
  const pages = await Promise.all(
    PAGES.map(async (page) => parseClubs(await fetchPage(pageUrl(page)), page)),
  );
  const clubs = pages.flat();

  // Same club on two pages means the table shifted under the paging, which
  // would silently drop whoever it pushed off the end.
  const ids = new Set(clubs.map((c) => c.id));
  if (ids.size !== clubs.length) {
    throw new Error(
      `${clubs.length - ids.size} club(s) appear twice across the four pages — the table moved mid-scrape.`,
    );
  }

  const next = JSON.stringify({ clubs } satisfies SquadValueResult);
  if (next === (await readFile(OUT, "utf-8").catch(() => ""))) {
    // The scrape runs on the plain 3-hourly tick, but squad values only move on
    // a market-value update or a completed transfer. Writing nothing when
    // nothing changed keeps the timestamp honest and saves a deploy.
    console.log(`[${LABEL}] Unchanged — ${clubs.length} clubs`);
    return;
  }

  await writeFile(OUT, next);
  await writeFile(STAMP, new Date().toISOString());
  console.log(
    `[${LABEL}] ${clubs.length} clubs — ${clubs[0].name} leads on value, ` +
      `${[...clubs].sort((a, b) => b.averageValue - a.averageValue)[0].name} on value per player`,
  );
}

main().catch((err) => {
  console.error(`[${LABEL}] Fatal error:`, err);
  process.exit(1);
});
