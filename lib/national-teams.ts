import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { MinutesValuePlayer, NationalTeamValue } from "@/app/types";
import { BASE_URL } from "@/lib/constants";
import { fetchPage } from "@/lib/fetch";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { getPlayerDetailHref, nationalTeamSlug, nationalTeamUrls } from "@/lib/format";
import { parseMarketValue } from "@/lib/parse-market-value";
import { getNationalTeamValues } from "@/lib/squad-values";
import { npga } from "@/lib/stats-toggles";
import { parseNationHeader, parsePlayerTable, type NationTitle } from "@/lib/transfermarkt";
import { landIdFromFlagUrl } from "@/lib/transfermarkt/image";

/** Tag on every national-team page scrape, so the refresh button clears them. */
export const NATIONAL_TEAM_TAG = "national-team";

/** A national team with where it lives: see nationalTeamUrls. */
export type NationalTeam = NationalTeamValue & ReturnType<typeof nationalTeamUrls>;

/**
 * Every national team, found by whichever key a caller holds: Transfermarkt's team
 * id (a match opponent, a /teams link — "is this a nation?" is "is it found by
 * id"), its country id (a source with spellings of its own), or its page's slug.
 */
export const getNationalTeams = cache(async () => {
  const teams: NationalTeam[] = (await getNationalTeamValues()).teams.map((t) => ({
    ...t,
    ...nationalTeamUrls(t),
  }));
  return {
    teams,
    byId: new Map(teams.map((t) => [t.id, t])),
    byLandId: new Map(teams.map((t) => [t.landId, t])),
    bySlug: new Map(teams.map((t) => [nationalTeamSlug(t.name), t])),
  };
});

/** TM team id → the nation, as a plain record, for the callers that hold only an
 *  id: match opponents, a player's national team. */
export const getNationalTeamLinks = async (): Promise<Record<string, NationalTeam>> =>
  Object.fromEntries((await getNationalTeams()).byId);

/**
 * Map of national team name -> its page, as each source spells the name. Matched
 * by Transfermarkt's country id, so a spelling of its own ("DR Congo") still
 * finds its nation.
 */
export async function nationLinks(
  teams: { name: string; landId: number }[],
): Promise<Record<string, string>> {
  const { byLandId } = await getNationalTeams();
  const out: Record<string, string> = {};
  for (const t of teams) {
    const nation = byLandId.get(t.landId);
    if (nation) out[t.name] = nation.href;
  }
  return out;
}

/** A national team's places by value per player: its call-up's among every
 *  nation and within its confederation, and its extended squad's among the
 *  nations whose extended squad is valued. Ties share a place. */
export interface ValueRanks {
  world: number;
  /** null for a nation with no confederation on record. */
  confederation: number | null;
  /** null for a nation outside the fifty whose extended squads are valued. */
  extended: { place: number; of: number } | null;
}

export function valueRanks(teams: NationalTeamValue[], team: NationalTeamValue): ValueRanks {
  const place = (field: NationalTeamValue[], of: (t: NationalTeamValue) => number) =>
    field.filter((t) => of(t) > of(team)).length + 1;
  const callUp = (t: NationalTeamValue) => t.averageValue;
  const valued = teams.filter((t) => t.extendedAverageValue !== undefined);
  return {
    world: place(teams, callUp),
    confederation: team.confederation
      ? place(
          teams.filter((t) => t.confederation === team.confederation),
          callUp,
        )
      : null,
    extended:
      team.extendedAverageValue === undefined
        ? null
        : { place: place(valued, (t) => t.extendedAverageValue!), of: valued.length },
  };
}

export interface Injury {
  name: string;
  /** DD/MM/YYYY, or "" when Transfermarkt has no date. */
  returnDate: string;
}

/** One player of an extended squad, as Transfermarkt lists him. */
export interface SquadEntry {
  playerId: string;
  name: string;
  profileUrl: string;
  imageUrl: string;
  position: string;
  age: number | null;
  club: string;
  clubLogoUrl: string;
  /** Senior matches and goals for this nation. */
  caps: number;
  goals: number;
  /** His last matchday squad for this nation, played in or not: YYYY-MM-DD, or "". */
  lastMatch: string;
  marketValue: number;
  /** The value before Transfermarkt's latest update, or null when it shows none. */
  previousValue: number | null;
  calledUp: boolean;
  captain: boolean;
  injury: Injury | null;
}

/** The detailed extended-squad view (`/plus/1`): #, player, born (age), club,
 *  height, foot, matches, goals, debut, last match, market value. */
const COL = { player: 1, born: 2, club: 3, caps: 6, goals: 7, lastMatch: 9, value: 10 } as const;

const count = (s: string) => Number(s) || 0; // "-" for none
const isoDate = (s: string) =>
  s
    .match(/(\d{2})\/(\d{2})\/(\d{4})/)
    ?.slice(1)
    .reverse()
    .join("-") ?? "";

/** A national team's extended-squad page: its players, and the header's titles
 *  and confederation. */
export function parseExtendedSquad(html: string) {
  const players = parsePlayerTable<SquadEntry>(
    html,
    (p, row) => {
      // "Back injury - Return expected on 21/11/2026", "Ligament injury - Return unknown"
      const injury = row.attr(COL.player, "span.verletzt-table", "title");
      // German on this page ("Vorheriger Marktwert: €25.00m"), so read just the amount.
      const previous = row.attr(COL.value, "span.icons_sprite", "title");
      return {
        playerId: p.playerId,
        name: p.name,
        profileUrl: p.profileUrl,
        imageUrl: p.imageUrl,
        position: p.position,
        age: Number(row.text(COL.born).match(/\((\d+)\)/)?.[1]) || null,
        club: row.link(COL.club).title,
        clubLogoUrl: row.image(COL.club),
        caps: count(row.text(COL.caps)),
        goals: count(row.text(COL.goals)),
        lastMatch: isoDate(row.text(COL.lastMatch)),
        marketValue: parseMarketValue(row.text(COL.value)),
        previousValue: previous.includes("€")
          ? parseMarketValue(previous.slice(previous.indexOf("€")))
          : null,
        calledUp: row.highlighted(COL.player),
        captain: !!row.attr(COL.player, "span.kapitaenicon-table", "title"),
        injury: injury
          ? {
              name: injury.split(" - ")[0].trim(),
              returnDate: injury.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] ?? "",
            }
          : null,
      };
    },
    { playerColumn: COL.player },
  );
  return { players, ...parseNationHeader(html) };
}

/** One page per nation, a day at a time. An empty squad is TM failing, not a
 *  nation without players, so it throws rather than caching a blank. The key
 *  carries the parse's shape: entries outlive deploys, so a change bumps it. */
const getExtendedSquad = (teamId: string) =>
  unstable_cache(
    async () => {
      const page = parseExtendedSquad(
        await fetchPage(`${BASE_URL}/x/erweiterterkader/verein/${teamId}/plus/1`),
      );
      if (page.players.length === 0) throw new Error(`No extended squad for ${teamId}`);
      return page;
    },
    ["national-team-squad", "v2", teamId],
    { revalidate: 86_400, tags: [NATIONAL_TEAM_TAG] },
  )();

export type CallUpStatus = "recent" | "lapsed" | "uncapped";

/** A player on a nation's page: in its call-up, or one of its outsiders. */
export interface NationPlayer {
  playerId: string;
  name: string;
  /** His page here, or his Transfermarkt profile when the site doesn't track him. */
  href: string;
  tracked: boolean;
  imageUrl: string;
  position: string;
  age: number | null;
  club: string;
  clubLogoUrl: string;
  marketValue: number;
  previousValue: number | null;
  /** Senior caps: for this nation, or for whoever capped an outsider beyond it. */
  caps: number;
  /** National-team goals, known for extended-squad players only. */
  goals: number | null;
  /** This season, for tracked players. */
  npga: number | null;
  minutes: number | null;
  calledUp: boolean;
  captain: boolean;
  injury: Injury | null;
  /** Outsiders: where his value would place him in the call-up. */
  callUpPlace?: number;
  /** Outsiders: how close he is to a call-up — picked in the last 18 months, capped
   *  longer ago, or never. */
  status?: CallUpStatus;
  /** Outsiders: his last squad for this nation, YYYY-MM-DD — null when unknown or
   *  never. */
  lastCalledUp?: string | null;
  /** Outsiders who hold this nationality second: the one they hold first. */
  firstNationality?: { name: string; flagUrl: string };
}

/** Where a value would place among the call-up's: 1 + how many are worth more. */
const placeIn = (squad: Pick<SquadEntry, "calledUp" | "marketValue">[]) => {
  const values = squad.filter((s) => s.calledUp).map((s) => s.marketValue);
  return (value: number) => values.filter((v) => v > value).length + 1;
};

/**
 * A nation's players as its page shows them: the call-up, then its outsiders —
 * the rest of the extended squad, and the tracked players with its nationality,
 * first or second, who are neither in that squad nor capped by another nation —
 * each placed against the call-up's values, most valuable first.
 *
 * Without a recorded national team, a first nationality is taken as unclaimed (TM
 * lists a capped dual national under the side he chose) and a capped second one
 * isn't.
 */
export function nationPlayers(
  team: Pick<NationalTeamValue, "id" | "landId">,
  squad: SquadEntry[],
  pool: MinutesValuePlayer[],
): { callUp: NationPlayer[]; outsiders: NationPlayer[] } {
  const byId = new Map(pool.map((p) => [p.playerId, p]));
  const place = placeIn(squad);

  const fromSquad = squad.map(({ profileUrl, lastMatch, ...e }): NationPlayer => {
    const tracked = byId.get(e.playerId);
    return {
      ...e,
      href: tracked ? getPlayerDetailHref(e.playerId) : `${BASE_URL}${profileUrl}`,
      tracked: !!tracked,
      npga: tracked ? npga(tracked) : null,
      minutes: tracked ? tracked.minutes : null,
      ...(!e.calledUp && {
        status: "recent" as const,
        callUpPlace: place(e.marketValue),
        lastCalledUp: lastMatch || null,
      }),
    };
  });

  const inSquad = new Set(squad.map((s) => s.playerId));
  const fromPool = pool.flatMap((p): NationPlayer[] => {
    if (inSquad.has(p.playerId)) return [];
    const first = landIdFromFlagUrl(p.nationalityFlagUrl) === team.landId;
    if (!first && p.secondNationalityId !== team.landId) return [];
    const cappedHere = p.nationalTeamId ? p.nationalTeamId === team.id : first;
    if (p.intlCareerCaps > 0 && !cappedHere) return [];
    return [
      {
        playerId: p.playerId,
        name: p.name,
        href: getPlayerDetailHref(p.playerId),
        tracked: true,
        imageUrl: p.imageUrl,
        position: p.position,
        age: p.age || null,
        club: p.club,
        clubLogoUrl: p.clubLogoUrl,
        marketValue: p.marketValue,
        previousValue: null,
        caps: p.intlCareerCaps,
        goals: null,
        npga: npga(p),
        minutes: p.minutes,
        calledUp: false,
        captain: false,
        injury: null,
        status: p.intlCareerCaps > 0 ? "lapsed" : "uncapped",
        callUpPlace: place(p.marketValue),
        lastCalledUp: (p.intlCareerCaps > 0 && p.lastIntlGame) || null,
        ...(!first && {
          firstNationality: { name: p.nationality, flagUrl: p.nationalityFlagUrl ?? "" },
        }),
      },
    ];
  });

  return {
    callUp: fromSquad.filter((p) => p.calledUp),
    outsiders: [...fromSquad.filter((p) => !p.calledUp), ...fromPool].sort(
      (a, b) => b.marketValue - a.marketValue,
    ),
  };
}

export interface NationalTeamDetail {
  team: NationalTeam;
  ranks: ValueRanks;
  /** How many national teams the world rank is out of. */
  nations: number;
  confederation: string;
  titles: NationTitle[];
  /** null when Transfermarkt didn't serve the extended squad. */
  callUp: NationPlayer[] | null;
  outsiders: NationPlayer[];
  /** The extended squad's value per player: the refresh's figure where it has
   *  one, so it matches the National Teams table and the rank, else this page's. */
  extended: { players: number; perPlayer: number } | null;
  /** The call-up's value per player against the extended squad's: +0.28 when the
   *  players called up are worth 28% more a head than the whole group. */
  callUpGap: number | null;
}

/** Everything a nation's page shows, or null for a slug no national team has. */
export const getNationalTeamDetail = cache(
  async (slug: string): Promise<NationalTeamDetail | null> => {
    const [{ teams, bySlug }, pool] = await Promise.all([
      getNationalTeams(),
      getMinutesValueData(),
    ]);
    const team = bySlug.get(slug);
    if (!team) return null;

    const page = await getExtendedSquad(team.id).catch((err) => {
      console.error(`[national-teams] ${team.name}:`, err);
      return null;
    });
    const players = page && nationPlayers(team, page.players, pool);
    const extended = page && {
      players: page.players.length,
      perPlayer:
        team.extendedAverageValue ??
        page.players.reduce((sum, p) => sum + p.marketValue, 0) / page.players.length,
    };

    return {
      team,
      ranks: valueRanks(teams, team),
      nations: teams.length,
      confederation: team.confederation || page?.confederation || "",
      titles: page?.titles ?? [],
      callUp: players?.callUp ?? null,
      outsiders: players?.outsiders ?? [],
      extended,
      callUpGap: extended?.perPlayer ? team.averageValue / extended.perPlayer - 1 : null,
    };
  },
);
