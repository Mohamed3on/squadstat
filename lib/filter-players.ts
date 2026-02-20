export const TOP_5_LEAGUES = ["Premier League", "LaLiga", "Bundesliga", "Serie A", "Ligue 1"];

export function filterPlayersByLeagueAndClub<T extends { league: string; club: string }>(
  players: T[],
  leagueFilter: string,
  clubFilter: string
): T[] {
  return players.filter((player) => {
    if (leagueFilter !== "all" && player.league !== leagueFilter) return false;
    if (clubFilter !== "all" && clubFilter && player.club !== clubFilter) return false;
    return true;
  });
}

export function filterTop5<T extends { league: string }>(players: T[]): T[] {
  return players.filter((p) => TOP_5_LEAGUES.includes(p.league));
}

/** Fraction of games missed (0–1). Players with 0 matches and 0 minutes are treated as 100% unavailable. */
export function missedPct(p: { totalMatches: number; minutes: number; gamesMissed?: number }): number {
  const missed = p.gamesMissed ?? 0;
  const total = p.totalMatches + missed;
  if (total === 0) return p.minutes === 0 ? 1 : 0;
  return missed / total;
}
