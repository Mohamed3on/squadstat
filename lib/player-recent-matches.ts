import { LEAGUE_NAMES, type RecentGameStats } from "./player-aggregation";

/** Cups, super cups and European competitions that appear in match logs. Kept apart from
 *  LEAGUE_NAMES, which also names a player's current league and must only hold leagues. */
const COMPETITION_NAMES: Record<string, string> = {
  CL: "Champions League",
  CLQ: "Champions League qualifying",
  EL: "Europa League",
  ELQ: "Europa League qualifying",
  UCOL: "Conference League",
  ECLQ: "Conference League qualifying",
  USC: "UEFA Super Cup",
  CGB: "EFL Cup",
  GBCS: "Community Shield",
  DFB: "DFB-Pokal",
  DFL: "DFL-Supercup",
  CIT: "Coppa Italia",
  CDR: "Copa del Rey",
  FRCH: "Trophée des Champions",
  POCP: "Taça de Portugal",
  POSU: "Supertaça",
  NLSC: "Johan Cruyff Shield",
  BESC: "Belgian Super Cup",
  SAKC: "King's Cup",
  ACLE: "AFC Champions League Elite",
  L2: "2. Bundesliga",
  UKR1: "Ukrainian Premier League",
  UKRP: "Ukrainian Cup",
  RUP: "Russian Cup",
};

/**
 * Fills remaining gaps in a player's stored recent matches (competition names).
 * Opponent names/logos are pre-populated by the refresh script via clubs.json;
 * nothing here touches the network.
 */
export function enrichRecentMatches(matches: RecentGameStats[]): RecentGameStats[] {
  return matches.map((match) => ({
    ...match,
    competitionName:
      match.competitionName ||
      (match.competitionId
        ? (LEAGUE_NAMES[match.competitionId] ?? COMPETITION_NAMES[match.competitionId])
        : undefined),
  }));
}
