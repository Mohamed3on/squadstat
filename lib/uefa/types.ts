// Types for the UEFA competitions, shared by the scraper (fetch.ts), the pure
// models (model.ts, nations-league.ts) and the client components. Kept
// dependency-free so a client bundle importing them never reaches for cheerio.

type Base = {
  slug: string; // /leagues/<slug>
  tmSlug: string; // transfermarkt.com/<tmSlug>/…
  name: string; // "Champions League", "Nations League A"
  family: string; // pages that share one header crest and switch between each other in tabs
  tab?: string; // this page's label in those tabs
  rules: string; // what the table's places lead to, in a sentence
  keywords: readonly string[]; // extra ⌘K search terms
};

/** The Europa League copied the Champions League format wholesale — 36 clubs,
 *  eight league-phase games, the same 8/16/12 split and the same knockout
 *  seeding — so both run off one scraper and one model. */
export type LeaguePhaseComp = Base & { code: "CL" | "EL"; format: "league" };

/** The Nations League's top two tiers each play four groups of four. Only League
 *  A plays on for a trophy, through two-legged quarter-finals and then the
 *  Finals; League B's prize is going up. */
export type GroupsComp = Base & {
  code: "UNLA" | "UNLB";
  format: "groups";
  finals: boolean;
  /** The group places that carry something, top down, as stripes down the table. */
  bands: readonly { upTo: number; zone: string; label: string }[];
};

export type Competition = LeaguePhaseComp | GroupsComp;
export type CompCode = Competition["code"];

const LEAGUE_PHASE_RULES =
  "Top eight go straight to the last 16, ninth to 24th into the play-off round, the rest are out.";

/** Every UEFA page, and the one list its route, cache tags, header crest, tabs,
 *  sitemap entry and search entry all come from. */
export const COMPETITIONS = {
  CL: {
    code: "CL",
    format: "league",
    slug: "champions-league",
    tmSlug: "uefa-champions-league",
    name: "Champions League",
    family: "Champions League",
    rules: LEAGUE_PHASE_RULES,
    keywords: ["ucl", "uefa", "cl"],
  },
  EL: {
    code: "EL",
    format: "league",
    slug: "europa-league",
    tmSlug: "europa-league",
    name: "Europa League",
    family: "Europa League",
    rules: LEAGUE_PHASE_RULES,
    keywords: ["uel", "uefa", "el"],
  },
  UNLA: {
    code: "UNLA",
    format: "groups",
    finals: true,
    slug: "nations-league",
    tmSlug: "uefa-nations-league-a",
    name: "Nations League A",
    family: "Nations League",
    tab: "League A",
    rules:
      "The top two in each group go through to the quarter-finals; the rest fight to stay in League A.",
    bands: [{ upTo: 2, zone: "up", label: "Quarter-finals" }],
    keywords: ["nations league", "unl", "uefa", "national teams"],
  },
  UNLB: {
    code: "UNLB",
    format: "groups",
    finals: false,
    slug: "nations-league-b",
    tmSlug: "uefa-nations-league-b",
    name: "Nations League B",
    family: "Nations League",
    tab: "League B",
    rules:
      "Group winners go up to League A and runners-up into a promotion play-off; the rest fight to stay in League B.",
    bands: [
      { upTo: 1, zone: "up", label: "Promoted to League A" },
      { upTo: 2, zone: "po", label: "Promotion play-off" },
    ],
    keywords: ["nations league", "unl", "uefa", "national teams", "promotion"],
  },
} as const satisfies { [K in CompCode]: Competition & { code: K } };

export const COMPETITION_LIST: readonly Competition[] = Object.values(COMPETITIONS);

export const compHref = (c: Competition) => `/leagues/${c.slug}`;

/** The pages that share this one's header crest and tabs. */
export const familyOf = (c: Competition) =>
  COMPETITION_LIST.filter((other) => other.family === c.family);

/** Squad values drift daily, results land on matchday nights, so each page caches
 *  them apart — and the header refresh button busts exactly the page it sits on.
 *  The Nations League reads its values from the committed national-team data. */
export const cacheTag = (c: Competition, kind: "values" | "results") =>
  `${c.code.toLowerCase()}-${kind}`;
export const cacheTags = (c: Competition) =>
  c.format === "league"
    ? [cacheTag(c, "values"), cacheTag(c, "results")]
    : [cacheTag(c, "results")];

/** A club in the league phase, as the participants page lists it. */
export type Club = {
  id: string; // Transfermarkt club id — the join key between both pages
  name: string; // full name ("Paris Saint-Germain")
  squad: number;
  avgAge: number;
  mv: number; // market value per player (TM's ø) in millions — what the value rank runs on
};

/** One row of the 36-club league-phase table. */
export type TableRow = {
  id: string;
  short: string; // TM's abbreviated name ("PSG") — the table never spells them out
  /** Transfermarkt's displayed rank, which *ties* while clubs are level
   *  (3, 3, 5, 6, 6, 6, 9…). The model densifies it — see buildModel. */
  rank: number;
  order: number; // row order on the page, TM's own tie-break
  pl: number;
  gd: number;
  gf: number;
  pts: number;
};

export type Kick = {
  kickoff: number; // sortable YYYYMMDDHHMM, in Transfermarkt's displayed zone (CEST)
  dow: string; // "Tue"
  dayLabel: string; // "8 Sep"
  timeLabel: string; // "6:45 PM"
};

/** A league-phase fixture. All 144 are published up front, scores fill in. */
export type Fixture = Kick & {
  matchday: number; // 1-8
  homeId: string;
  awayId: string;
  home: string;
  away: string;
  hs: number | null;
  as: number | null;
  played: boolean;
};

/** PO = knockout phase play-off (TM labels it "IR"), then the bracket proper. */
export type Round = "PO" | "R16" | "QF" | "SF" | "F";

/** One leg of a knockout tie, straight off Transfermarkt. */
export type KoLeg = Kick & {
  round: Round;
  num: number; // TM's match number within the round (PO/R16 1..8, QF 1..4, SF 1..2, F 1)
  leg: 1 | 2; // a one-off tie is a single leg 1
  homeId: string | null; // null while TM still shows a placeholder
  awayId: string | null;
  hs: number | null;
  as: number | null;
  aet: boolean;
  pens: boolean; // shootout — the score shown is the shootout tally
};

/** Everything the schedule page yields in one fetch. */
export type Season = {
  label: string; // "26/27"
  table: TableRow[];
  fixtures: Fixture[];
  ko: KoLeg[];
};

/** A Nations League season: four group tables in one, and — League A only — the
 *  knockout legs, which Transfermarkt files under a competition of their own. */
export type NationsSeason = Omit<Season, "table" | "ko"> & {
  table: (TableRow & { group: number })[];
  ko: KoLeg[] | null; // null for a league with no knockout
};
