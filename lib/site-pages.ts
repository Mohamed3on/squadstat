import { LEAGUES, getLeagueLogoUrl } from "@/lib/leagues";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";
import { COMPETITION_LIST, compHref } from "@/lib/uefa/types";

// Every page a visitor can land on by name, and the one list the header menus, the
// ⌘K search, the sitemap, the 404 page and the warm-cache cron all read. The player
// and team indexes come from data; this is the static complement, so a page that
// exists but is missing here is simply unfindable — add it when you add a route.
// Client components read it, so it stays clear of data and fs imports.
//
// `kind` decides the row's badge and its rank among ties: competitions
// (domestic leagues, the Champions League, the World Cup) sit above plain
// pages. `keywords` are extra search terms that appear in neither the name nor
// the nav label (abbreviations, other names for the page).
export interface SitePage {
  href: string;
  name: string;
  kind: "competition" | "page";
  keywords?: readonly string[];
  logoUrl?: string;
  /** The header menu it sits in, in this list's order. The 404 page offers the same pages. */
  nav?: (typeof NAV)[number];
  /** Its label in that menu, where shorter than its name. */
  navLabel?: string;
  /** Rendered by the daily warm-cache cron, so the Transfermarkt scrapes behind it are
   *  cached before the morning's first visitor. */
  warm?: boolean;
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
  ...COMPETITION_LIST.map(
    (c): SitePage => ({
      href: compHref(c),
      name: c.name,
      kind: "competition",
      keywords: c.keywords,
      logoUrl: leagueLogoUrl(c.code),
      warm: true,
    }),
  ),
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
  { href: "/", name: "Home", kind: "page", warm: true },
  { href: "/discover", name: "Quick Views", kind: "page", keywords: ["discover"] },
  {
    href: "/form",
    name: "Recent Form",
    kind: "page",
    keywords: ["form"],
    nav: "Teams",
    warm: true,
  },
  {
    href: "/expected-position",
    name: "Value vs Table",
    kind: "page",
    keywords: ["expected position", "overperformers", "underperformers"],
    nav: "Teams",
    warm: true,
  },
  {
    href: "/squad-values",
    name: "Squad Values",
    kind: "page",
    keywords: ["most valuable squads"],
    nav: "Teams",
  },
  {
    href: "/national-teams",
    name: "National Teams",
    kind: "page",
    keywords: ["most valuable national teams", "countries"],
    nav: "Teams",
  },
  {
    href: "/injured",
    name: "Injury Impact",
    kind: "page",
    keywords: ["injured", "injuries"],
    nav: "Teams",
    warm: true,
  },
  {
    href: "/players",
    name: "Player Explorer",
    kind: "page",
    keywords: ["players"],
    nav: "Players",
    navLabel: "All Players",
    warm: true,
  },
  {
    href: "/value-analysis",
    name: "Over/Under",
    kind: "page",
    keywords: ["value analysis", "overrated", "underrated"],
    nav: "Players",
    warm: true,
  },
  {
    href: "/biggest-movers",
    name: "Biggest Movers",
    kind: "page",
    keywords: ["market value changes"],
    nav: "Players",
  },
  {
    href: "/fee-vs-value",
    name: "Fee vs Value",
    kind: "page",
    keywords: ["transfers", "transfer fees"],
    nav: "Transfers",
    warm: true,
  },
  {
    href: "/club-transfers",
    name: "Club Transfers",
    kind: "page",
    keywords: ["transfers", "transfer balance"],
    nav: "Transfers",
    navLabel: "By Club",
    warm: true,
  },
  {
    href: "/how-it-works",
    name: "How It Works",
    kind: "page",
    keywords: ["help", "about", "methodology"],
  },
];

// Three groups instead of eight top-level words. Each group is what the page is
// *about*, so the bar reads at a glance and every page is one hover away.
// A group is a label only, never a page: the mobile sheet renders it as a heading.
const NAV = ["Teams", "Players", "Transfers"] as const;

export const NAV_GROUPS = NAV.map((label) => ({
  label,
  items: SITE_PAGES.filter((p) => p.nav === label).map((p) => ({
    href: p.href,
    label: p.navLabel ?? p.name,
  })),
}));
