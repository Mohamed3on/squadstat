// Champions League types, shared by the scraper (lib/cl/fetch.ts), the pure
// model (lib/cl/model.ts) and the client components. Kept dependency-free so a
// client bundle importing them never reaches for cheerio.

/** A club in the league phase, as the participants page lists it. */
export type ClClub = {
  id: string; // Transfermarkt club id — the join key between both pages
  name: string; // full name ("Paris Saint-Germain")
  squad: number;
  avgAge: number;
  mv: number; // squad market value in millions, like lib/wc/model.ts
};

/** One row of the 36-club league-phase table. */
export type ClTableRow = {
  id: string;
  short: string; // TM's abbreviated name ("PSG") — the table never spells them out
  /** Transfermarkt's displayed rank, which *ties* while clubs are level
   *  (3, 3, 5, 6, 6, 6, 9…). The model densifies it — see buildClModel. */
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
export type ClFixture = Kick & {
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
export type ClRound = "PO" | "R16" | "QF" | "SF" | "F";

/** One leg of a knockout tie, straight off Transfermarkt. */
export type ClKoLeg = Kick & {
  round: ClRound;
  num: number; // TM's match number within the round (PO/R16 1..8, QF 1..4, SF 1..2, F 1)
  leg: 1 | 2; // the final is a single leg 1
  homeId: string | null; // null while TM still shows a placeholder
  awayId: string | null;
  hs: number | null;
  as: number | null;
  aet: boolean;
  pens: boolean; // shootout — the score shown is the shootout tally
};

/** Everything the schedule page yields in one fetch. */
export type ClSeason = {
  label: string; // "26/27"
  fetchedAt: number;
  table: ClTableRow[];
  fixtures: ClFixture[];
  ko: ClKoLeg[];
};
