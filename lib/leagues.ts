export const LEAGUES = [
  { code: "GB1", name: "Premier League", slug: "premier-league" },
  { code: "ES1", name: "La Liga", slug: "laliga" },
  { code: "L1", name: "Bundesliga", slug: "bundesliga" },
  { code: "IT1", name: "Serie A", slug: "serie-a" },
  { code: "FR1", name: "Ligue 1", slug: "ligue-1" },
] as const;

export type League = (typeof LEAGUES)[number];
