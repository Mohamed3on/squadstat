export type DiscoverySection = "players" | "value-analysis" | "injured" | "team-form";

export interface DiscoveryPreset {
  slug: string;
  section: DiscoverySection;
  title: string;
  navLabel: string;
  description: string;
  sourcePath: "/players" | "/value-analysis" | "/injured" | "/team-form";
  query: Record<string, string>;
}

export const DISCOVERY_SECTION_LABELS: Record<DiscoverySection, string> = {
  players: "Player Explorer",
  "value-analysis": "Value Analysis",
  injured: "Injury Impact",
  "team-form": "Team Value vs Table",
};

export const DISCOVERY_SECTION_ORDER: DiscoverySection[] = [
  "players",
  "value-analysis",
  "injured",
  "team-form",
];

export const DISCOVERY_PRESETS: DiscoveryPreset[] = [
  {
    slug: "top-valued-loan-players",
    section: "players",
    title: "Top Valued Loan Players",
    navLabel: "Top valued loans",
    description:
      "Players on loan sorted by market value.",
    sourcePath: "/players",
    query: { signing: "loan", sort: "value" },
  },
  {
    slug: "highest-scoring-loan-players",
    section: "players",
    title: "Highest Scoring Loan Players",
    navLabel: "Highest scoring loans",
    description:
      "Players on loan sorted by goals plus assists (G+A).",
    sourcePath: "/players",
    query: { signing: "loan", sort: "ga" },
  },
  {
    slug: "top-valued-new-signings",
    section: "players",
    title: "Top Valued New Signings",
    navLabel: "Top valued signings",
    description:
      "New signings sorted by market value.",
    sourcePath: "/players",
    query: { signing: "transfer", sort: "value" },
  },
  {
    slug: "highest-scoring-new-signings",
    section: "players",
    title: "Highest Scoring New Signings",
    navLabel: "Highest scoring signings",
    description:
      "New signings sorted by goals plus assists (G+A).",
    sourcePath: "/players",
    query: { signing: "transfer", sort: "ga" },
  },
  {
    slug: "top-5-most-valuable-players",
    section: "players",
    title: "Top 5 League Most Valuable Players",
    navLabel: "Top 5 most valuable",
    description:
      "Most valuable players from the top 5 leagues.",
    sourcePath: "/players",
    query: { top5: "1", sort: "value" },
  },
  {
    slug: "top-5-most-productive-players",
    section: "players",
    title: "Top 5 League Most Productive Players",
    navLabel: "Top 5 by G+A",
    description:
      "Top 5 league players sorted by goals plus assists (G+A).",
    sourcePath: "/players",
    query: { top5: "1", sort: "ga" },
  },

  {
    slug: "most-overpriced-players",
    section: "value-analysis",
    title: "Most Overpriced Players",
    navLabel: "Overpriced players",
    description:
      "Players flagged as expensive relative to output.",
    sourcePath: "/value-analysis",
    query: { mode: "ga" },
  },
  {
    slug: "best-bargain-players",
    section: "value-analysis",
    title: "Best Bargain Players",
    navLabel: "Best bargains",
    description:
      "Lower-cost players outperforming higher-cost peers.",
    sourcePath: "/value-analysis",
    query: { mode: "ga", dTab: "bargains" },
  },
  {
    slug: "top-5-overpriced-players",
    section: "value-analysis",
    title: "Top 5 League Overpriced Players",
    navLabel: "Top 5 overpriced",
    description:
      "Overpriced players in the top 5 leagues.",
    sourcePath: "/value-analysis",
    query: { mode: "ga", dTop5: "1" },
  },
  {
    slug: "top-5-bargain-players",
    section: "value-analysis",
    title: "Top 5 League Bargain Players",
    navLabel: "Top 5 bargains",
    description:
      "Bargain players in the top 5 leagues.",
    sourcePath: "/value-analysis",
    query: { mode: "ga", dTab: "bargains", dTop5: "1" },
  },
  {
    slug: "expensive-players-with-fewest-minutes",
    section: "value-analysis",
    title: "Expensive Players With Fewest Minutes",
    navLabel: "Fewest minutes",
    description:
      "High-value players sorted by lowest minutes.",
    sourcePath: "/value-analysis",
    query: { mode: "mins" },
  },
  {
    slug: "expensive-players-fewest-minutes-no-injuries",
    section: "value-analysis",
    title: "Expensive Players With Fewest Minutes (Excluding Injuries)",
    navLabel: "Fewest minutes (fit)",
    description:
      "High-value players with few minutes, excluding injured players.",
    sourcePath: "/value-analysis",
    query: { mode: "mins", noInj: "1" },
  },

  {
    slug: "highest-value-injured-players",
    section: "injured",
    title: "Highest Value Injured Players",
    navLabel: "Highest value injuries",
    description:
      "Injured players sorted by market value.",
    sourcePath: "/injured",
    query: { tab: "players" },
  },
  {
    slug: "clubs-with-biggest-injury-losses",
    section: "injured",
    title: "Clubs With Biggest Injury Value Losses",
    navLabel: "Biggest club losses",
    description:
      "Teams ranked by total market value unavailable through injuries.",
    sourcePath: "/injured",
    query: { tab: "teams" },
  },
  {
    slug: "clubs-with-most-injuries",
    section: "injured",
    title: "Clubs With Most Injured Players",
    navLabel: "Most injuries by club",
    description:
      "Clubs sorted by number of injured players.",
    sourcePath: "/injured",
    query: { tab: "teams", tSort: "count" },
  },
  {
    slug: "most-expensive-injury-types",
    section: "injured",
    title: "Most Expensive Injury Types",
    navLabel: "Costliest injury types",
    description:
      "Injury categories ranked by total sidelined market value.",
    sourcePath: "/injured",
    query: { tab: "injuries" },
  },
  {
    slug: "most-common-injury-types",
    section: "injured",
    title: "Most Common Injury Types",
    navLabel: "Most common injury types",
    description:
      "Injury categories sorted by player count.",
    sourcePath: "/injured",
    query: { tab: "injuries", iSort: "count" },
  },

  {
    slug: "value-vs-table-all-leagues",
    section: "team-form",
    title: "Value vs Table (All Leagues)",
    navLabel: "All leagues",
    description:
      "Overperformers and underperformers across all tracked leagues.",
    sourcePath: "/team-form",
    query: {},
  },
  {
    slug: "value-vs-table-premier-league",
    section: "team-form",
    title: "Value vs Table (Premier League)",
    navLabel: "Premier League",
    description:
      "Premier League teams vs value-adjusted expectation.",
    sourcePath: "/team-form",
    query: { league: "Premier League" },
  },
  {
    slug: "value-vs-table-laliga",
    section: "team-form",
    title: "Value vs Table (La Liga)",
    navLabel: "La Liga",
    description:
      "La Liga teams vs value-adjusted expectation.",
    sourcePath: "/team-form",
    query: { league: "La Liga" },
  },
];

export function getDiscoveryPresetsBySection(section: DiscoverySection): DiscoveryPreset[] {
  return DISCOVERY_PRESETS.filter((preset) => preset.section === section);
}

export function toQueryString(query: Record<string, string>): string {
  const params = new URLSearchParams();
  const keys = Object.keys(query).sort();

  for (const key of keys) {
    const value = query[key];
    if (!value) continue;
    params.set(key, value);
  }

  return params.toString();
}

export function getPresetTargetHref(preset: DiscoveryPreset): string {
  const queryString = toQueryString(preset.query);
  return queryString ? `${preset.sourcePath}?${queryString}` : preset.sourcePath;
}
