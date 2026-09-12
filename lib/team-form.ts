import { cache } from "react";
import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import type { Matchday, MatchdayClub, MatchdayGame, TeamFormEntry } from "@/app/types";
import { BASE_URL } from "./constants";
import { LEAGUES } from "./leagues";
import { fetchPage } from "./fetch";
import { parseMarketValue } from "./parse-market-value";
import { tmImage } from "@/lib/transfermarkt";
interface LeagueTeam {
  name: string;
  position: number;
  points: number;
  logoUrl: string;
  clubUrl: string;
  clubId: string;
}

interface MarketValueTeam {
  clubId: string;
  marketValue: string;
  marketValueNum: number;
}

function parseStartseitePage($: cheerio.CheerioAPI): {
  standings: LeagueTeam[];
  marketValues: MarketValueTeam[];
} {
  const standings: LeagueTeam[] = [];
  const marketValues: MarketValueTeam[] = [];

  const standingsTable = $("table.items")
    .filter((_, table) => {
      const headerText = $(table).find("thead").text().toLowerCase();
      const hasPts = headerText.includes("pts") || headerText.includes("pkte");
      const hasMarketValue =
        headerText.includes("market value") || headerText.includes("marktwert");
      return hasPts && !hasMarketValue;
    })
    .first();

  standingsTable.find("tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 5) return;

    const positionText = $(cells[0]).text().trim();
    const position = parseInt(positionText, 10);
    if (isNaN(position)) return;

    const clubCell = $(cells[1]);
    const clubLink = clubCell.find("a").first();
    const logoUrl = tmImage(clubCell.find("img").attr("src") || "");
    const name = clubLink.attr("title") || "";
    const clubUrl = clubLink.attr("href") || "";
    const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
    const clubId = clubIdMatch ? clubIdMatch[1] : "";

    const pointsText = $(cells[cells.length - 1])
      .text()
      .trim();
    const points = parseInt(pointsText, 10);
    if (isNaN(points)) return;

    if (name && clubId) {
      const normalizedUrl = clubUrl.replace(/\/(spielplan|tabelle)\//, "/startseite/");
      standings.push({
        name,
        position,
        points,
        logoUrl,
        clubUrl: `${BASE_URL}${normalizedUrl}`,
        clubId,
      });
    }
  });

  const mvTable = $("table.items")
    .filter((_, table) => {
      const headerText = $(table).find("thead").text().toLowerCase();
      return headerText.includes("market value") || headerText.includes("marktwert");
    })
    .first();

  mvTable.find("tbody > tr").each((_, row) => {
    const cells = $(row).find("> td");
    if (cells.length < 6) return;

    const nameCell = $(cells[1]);
    const clubUrl = nameCell.find("a").first().attr("href") || "";
    const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
    const clubId = clubIdMatch ? clubIdMatch[1] : "";

    const mvCell = $(cells[cells.length - 2]);
    const marketValue = mvCell.text().trim();
    const marketValueNum = parseMarketValue(marketValue);

    if (clubId && marketValueNum > 0) {
      marketValues.push({ clubId, marketValue, marketValueNum });
    }
  });

  return { standings, marketValues };
}

function matchdayClub(cell: cheerio.Cheerio<any>): MatchdayClub | null {
  const link = cell.find(".vereinsname a").first();
  const id = link.attr("href")?.match(/\/verein\/(\d+)/)?.[1];
  return id ? { id, name: link.text().trim() } : null;
}

/**
 * The matchday box under the table: the rounds TM tabs as last / current / next
 * matchday, oldest first. A tab without a round number — TM's "Rearranged match"
 * catch-up list — is skipped.
 */
export function parseMatchdays($: cheerio.CheerioAPI): Matchday[] {
  const rounds: Matchday[] = [];
  $("#wettbewerbSpieltagsbox [id^='spieltagtabs-']").each((_, tab) => {
    const number = Number(
      $(tab)
        .find("a[href*='/spieltag/']")
        .attr("href")
        ?.match(/\/spieltag\/(\d+)/)?.[1],
    );
    if (!number) return;

    const games: MatchdayGame[] = [];
    let date = ""; // TM prints each date once, on the day's first game
    $(tab)
      .find("tr.begegnungZeile")
      .each((_, tr) => {
        const row = $(tr);
        const href = row.find("td.zeit a[href*='/datum/']").attr("href");
        date = href?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? date;
        const home = matchdayClub(row.find("td.verein-heim"));
        const away = matchdayClub(row.find("td.verein-gast"));
        const result = row.find("td.ergebnis .matchresult").first();
        if (!home || !away || !result.length) return;
        games.push({
          date,
          home,
          away,
          status: result.hasClass("finished")
            ? "finished"
            : result.hasClass("liveresult")
              ? "live"
              : "scheduled",
          result: result.text().trim(),
        });
      });
    if (games.length > 0) rounds.push({ number, games });
  });
  return rounds;
}

/** The round worth showing: the one with the most recently played game — so a
 *  fixture brought forward from a later round doesn't pull the page ahead — or,
 *  before a season's first game, the first one listed. */
export function latestMatchday(rounds: Matchday[]): Matchday | null {
  // ISO dates compare as strings; a round with nothing played yet scores "".
  const lastPlayed = (r: Matchday) =>
    r.games.reduce((d, g) => (g.status !== "scheduled" && g.date > d ? g.date : d), "");
  return rounds.reduce<Matchday | null>(
    (latest, r) => (latest && lastPlayed(latest) >= lastPlayed(r) ? latest : r),
    null,
  );
}

async function fetchLeagueData(
  league: (typeof LEAGUES)[number],
): Promise<{ teams: TeamFormEntry[]; rounds: Matchday[] }> {
  try {
    const url = `${BASE_URL}/${league.slug}/startseite/wettbewerb/${league.code}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const { standings, marketValues } = parseStartseitePage($);

    const sortedByMV = [...marketValues].sort((a, b) => b.marketValueNum - a.marketValueNum);
    const mvRankMap = new Map<string, { rank: number; value: string; valueNum: number }>();
    sortedByMV.forEach((team, idx) => {
      mvRankMap.set(team.clubId, {
        rank: idx + 1,
        value: team.marketValue,
        valueNum: team.marketValueNum,
      });
    });

    // TM prints one shared position number for tied teams (on matchday 1
    // sixteen clubs are all "3rd"), so keying off that label leaves most ranks
    // with no entry. The rows themselves still arrive in TM's own ranked order,
    // tiebreakers applied, so row N is the Nth-best side: the Nth-most-valuable
    // squad is expected to post the points total sitting in row N.
    const results: TeamFormEntry[] = [];
    for (const team of standings) {
      const mvData = mvRankMap.get(team.clubId);
      if (!mvData) continue;

      const expectedPosition = mvData.rank;
      const expectedPoints = standings[expectedPosition - 1]?.points ?? team.points;
      const deltaPts = team.points - expectedPoints;

      results.push({
        name: team.name,
        league: league.name,
        leaguePosition: team.position,
        points: team.points,
        marketValue: mvData.value,
        marketValueNum: mvData.valueNum,
        marketValueRank: mvData.rank,
        expectedPoints,
        deltaPts,
        logoUrl: team.logoUrl,
        clubUrl: team.clubUrl,
        clubId: team.clubId,
      });
    }

    return { teams: results, rounds: parseMatchdays($) };
  } catch (error) {
    console.error(`Failed to fetch ${league.name}:`, error);
    throw error;
  }
}

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

// Each league's competition page carries both its table and its matchday box, so
// one cached fetch per league feeds getTeamFormData and getLeagueMatchday.
const fetchLeaguePages = unstable_cache(
  async () => {
    const MAX_ATTEMPTS = 3;
    const allTeams: TeamFormEntry[] = [];
    const rounds: Record<string, Matchday[]> = {};
    let pending = [...LEAGUES];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && pending.length > 0; attempt++) {
      const results = await Promise.allSettled(pending.map(fetchLeagueData));
      const nextPending: typeof pending = [];

      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          allTeams.push(...r.value.teams);
          rounds[pending[i].name] = r.value.rounds;
        } else {
          nextPending.push(pending[i]);
        }
      });

      pending = nextPending;

      if (pending.length > 0) {
        console.warn(
          `team-form attempt ${attempt}/${MAX_ATTEMPTS}: missing leagues: ${pending.map((l) => l.name).join(", ")}`,
        );
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }

    if (pending.length > 0) {
      throw new Error(
        `Failed to fetch all 5 leagues after ${MAX_ATTEMPTS} attempts. Missing: ${pending.map((l) => l.name).join(", ")}`,
      );
    }

    return { allTeams, rounds };
  },
  ["team-form"],
  { revalidate: 7200, tags: ["team-form"] },
);

// A page calling both below shares one lookup, so a cold miss can't fetch every league twice.
const getLeaguePages = cache(fetchLeaguePages);

export async function getTeamFormData() {
  const { allTeams } = await getLeaguePages();
  return { success: true, allTeams, leagues: LEAGUES.map((l) => l.name) };
}

/** The round a league page shows — chosen per request, so a change to the
 *  choice never waits out a stale cache entry. */
export async function getLeagueMatchday(leagueName: string): Promise<Matchday | null> {
  const { rounds } = await getLeaguePages();
  return latestMatchday(rounds[leagueName] ?? []);
}
