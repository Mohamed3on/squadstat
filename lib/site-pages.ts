import { LEAGUES, getLeagueLogoUrl } from "@/lib/leagues";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

// Every page a visitor can land on by name, for the ⌘K search. The player and
// team indexes come from data; this is the static complement, so a page that
// exists but is missing here is simply unfindable — add it when you add a route.
//
// `kind` decides the row's badge and its rank among ties: competitions
// (domestic leagues, the Champions League, the World Cup) sit above plain
// pages. `keywords` are extra search terms that never appear in the name
// (abbreviations, the nav label when it differs from the page title).
export interface SitePage {
  href: string;
  name: string;
  kind: "competition" | "page";
  keywords?: readonly string[];
  logoUrl?: string;
}

const WORLD_CUP_KEYWORDS = ["world cup", "wc", "wc 2026", "fifa"] as const;

export const SITE_PAGES: readonly SitePage[] = [
  ...LEAGUES.map(
    (l): SitePage => ({
      href: `/leagues/${l.slug}`,
      name: l.name,
      kind: "competition",
      logoUrl: getLeagueLogoUrl(l.name),
    }),
  ),
  {
    href: "/leagues/champions-league",
    name: "Champions League",
    kind: "competition",
    keywords: ["ucl", "uefa", "cl"],
    logoUrl: leagueLogoUrl("CL"),
  },
  {
    href: "/wc",
    name: "World Cup 2026 Simulation",
    kind: "competition",
    keywords: [...WORLD_CUP_KEYWORDS, "bracket", "market value simulation"],
  },
  {
    href: "/wc-live",
    name: "World Cup 2026 Results",
    kind: "competition",
    keywords: [...WORLD_CUP_KEYWORDS, "live", "results vs expectations", "scorers"],
  },
  {
    href: "/wc-schedule",
    name: "World Cup 2026 Schedule",
    kind: "competition",
    keywords: [...WORLD_CUP_KEYWORDS, "fixtures", "matches"],
  },
  { href: "/", name: "Home", kind: "page" },
  { href: "/discover", name: "Quick Views", kind: "page", keywords: ["discover"] },
  { href: "/form", name: "Recent Form", kind: "page", keywords: ["form"] },
  { href: "/squad-values", name: "Squad Values", kind: "page", keywords: ["most valuable squads"] },
  {
    href: "/expected-position",
    name: "Value vs Table",
    kind: "page",
    keywords: ["expected position", "overperformers", "underperformers"],
  },
  { href: "/players", name: "Player Explorer", kind: "page", keywords: ["players"] },
  {
    href: "/value-analysis",
    name: "Over/Under",
    kind: "page",
    keywords: ["value analysis", "overrated", "underrated"],
  },
  { href: "/injured", name: "Injury Impact", kind: "page", keywords: ["injured", "injuries"] },
  {
    href: "/biggest-movers",
    name: "Biggest Movers",
    kind: "page",
    keywords: ["market value changes"],
  },
  {
    href: "/fee-vs-value",
    name: "Fee vs Value",
    kind: "page",
    keywords: ["transfers", "transfer fees"],
  },
  {
    href: "/club-transfers",
    name: "Club Transfers",
    kind: "page",
    keywords: ["transfers", "transfer balance"],
  },
  {
    href: "/how-it-works",
    name: "How It Works",
    kind: "page",
    keywords: ["help", "about", "methodology"],
  },
];
