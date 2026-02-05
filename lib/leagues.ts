export const LEAGUES = [
  { code: "GB1", name: "Premier League", slug: "premier-league" },
  { code: "ES1", name: "La Liga", slug: "laliga" },
  { code: "L1", name: "Bundesliga", slug: "bundesliga" },
  { code: "IT1", name: "Serie A", slug: "serie-a" },
  { code: "FR1", name: "Ligue 1", slug: "ligue-1" },
] as const;

export type League = (typeof LEAGUES)[number];

const leagueLogoMap: Record<string, string> = {};
for (const l of LEAGUES) {
  const url = `https://tmssl.akamaized.net//images/logo/header/${l.code.toLowerCase()}.png`;
  leagueLogoMap[l.name] = url;
  // Also map normalized key (lowercase, no spaces) for scraped names like "LaLiga"
  leagueLogoMap[l.name.toLowerCase().replace(/\s/g, "")] = url;
}

export function getLeagueLogoUrl(leagueName: string): string | undefined {
  return leagueLogoMap[leagueName] || leagueLogoMap[leagueName.toLowerCase().replace(/\s/g, "")];
}
