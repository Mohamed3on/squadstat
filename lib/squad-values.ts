import type { NationalTeamValueResult, SquadValueClub, SquadValueResult } from "@/app/types";
import { readData } from "@/lib/data";

/** Where the squad-value ranking lives. */
export const SQUAD_VALUES_PATH = "/squad-values";

/** Published data (lib/data.ts). */
export const getSquadValues = (): Promise<SquadValueResult> =>
  readData<SquadValueResult>("squad-values.json");

/** The same for the national-team table, which the same refresh writes. */
export const getNationalTeamValues = (): Promise<NationalTeamValueResult> =>
  readData<NationalTeamValueResult>("national-team-values.json");

/** Where a club stands among the hundred most valuable squads. */
export interface SquadValuePlace {
  club: SquadValueClub;
  /** Place by total squad value — the ranking that picked the hundred, so this
   *  one is exact all the way down. */
  rank: number;
  /** Place by value per player, within those same hundred. Not a world rank: a
   *  small squad of expensive players can average more than clubs the table
   *  never reached, so this is only "of the hundred". */
  perPlayerRank: number;
  /** Place by value per player among the clubs from the same league that made
   *  the hundred. For a league the site tracks the standings page gives an
   *  exact rank; this one is for the leagues it doesn't. */
  leaguePerPlayerRank: number;
  total: number;
}

/**
 * A club's place among the most valuable squads, or `null` for the clubs the
 * table never reaches — which is nearly all of them.
 *
 * Ties share a place: two squads worth the same are both nth, not nth and the
 * one after.
 */
export async function getSquadValuePlace(clubId: string): Promise<SquadValuePlace | null> {
  const { clubs } = await getSquadValues();
  const club = clubs.find((c) => c.id === clubId);
  if (!club) return null;

  const placeBy = (of: (c: SquadValueClub) => number) =>
    clubs.filter((c) => of(c) > of(club)).length + 1;

  return {
    club,
    rank: placeBy((c) => c.totalValue),
    perPlayerRank: placeBy((c) => c.averageValue),
    leaguePerPlayerRank:
      clubs.filter((c) => c.league === club.league && c.averageValue > club.averageValue).length +
      1,
    total: clubs.length,
  };
}
