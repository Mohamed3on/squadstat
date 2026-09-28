// Deterministic "the more valuable squad wins" model for the UEFA 36-club league
// phase, shared by the Champions League and the Europa League (see COMPETITIONS).
// Pure: buildModel(clubs, season) turns a roster + market values + whatever
// Transfermarkt has published so far into the value-vs-table rows and a
// knockout bracket. No fetching, so the client can import it freely. The
// measures, tie-settling and bracket drawing below are nations-league.ts's too,
// and both hand the page the same UefaView.

import type { Club, Fixture, KoLeg, Round, Season } from "./types";

export type ClubLite = { id: string; name: string; short: string; mv: number };

/** Rounds a club can reach, deepest last. Index doubles as the stage number. */
export const STAGE_LABEL = [
  "League phase", // 0 — out after the eight games
  "Play-off",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
  "Winner",
];

/** Squad-value rank → the round that value seeds a club into. The tiers halve
 *  the way the bracket does: 1 winner, 1 beaten finalist, 2 semi-finalists,
 *  4 quarter-finalists, 8 more in the last 16, 8 more through the play-off,
 *  and the bottom 12 out after the league phase. */
export const expectedStage = (rank: number) =>
  rank === 1
    ? 6
    : rank === 2
      ? 5
      : rank <= 4
        ? 4
        : rank <= 8
          ? 3
          : rank <= 16
            ? 2
            : rank <= 24
              ? 1
              : 0;

/** The three bands the 36-club league phase splits into. */
export type Zone = "r16" | "po" | "out";
export const zoneOf = (pos: number): Zone => (pos <= 8 ? "r16" : pos <= 24 ? "po" : "out");
export const ZONE_LABEL: Record<Zone, string> = {
  r16: "Straight to the last 16",
  po: "Play-off round",
  out: "Out after the league phase",
};

/** A side in a table, against the place its value per player seeds it. */
export type StandingRow = {
  club: ClubLite;
  pos: number;
  pl: number;
  gd: number;
  pts: number;
  valueRank: number;
  /** Points minus the points of whoever holds this side's value-seeded place.
   *  The measure while a table runs: over a handful of games a place turns on
   *  goal difference, so counting places exaggerates. */
  ptsDelta: number | null;
  /** valueRank − pos, which only means anything once the table has settled. */
  posDelta: number | null;
  zone: string | null; // the stripe down the table: straight through, a play-off, out
};

export type PhaseRow = StandingRow & {
  gf: number;
  zone: Zone;
  expZone: Zone;
  expStage: number;
  expLabel: string;
};

export type Card = {
  id: string; // `${round}-${num}`
  round: Round;
  num: number;
  home: ClubLite | null;
  away: ClubLite | null;
  /** League-phase position feeding each side, while the side is still a projection. */
  homeSeed: number | null;
  awaySeed: number | null;
  winner: string | null; // club id
  real: boolean; // both sides published by Transfermarkt
  decided: boolean; // a real tie whose winner is settled
  score: string | null; // aggregate over both legs, or the final's single score
  pens: boolean;
  x: number;
  y: number;
};

export type Edge = { d: string; club: string };

/** A knockout and who can still win it. */
export type Knockout = {
  drawn: boolean; // Transfermarkt has published a tie
  bracket: { cards: Card[]; edges: Edge[] } & ReturnType<typeof frame>;
  /** The most valuable side not yet out — shown from matchday one, when it is
   *  still just "the best squad in the draw". */
  projected: ClubLite | null;
  alive: number; // how many can still win it
};

/** Everything a UEFA page draws, whichever format it plays. */
export type UefaView = {
  label: string; // "26/27"
  rows: StandingRow[]; // every side, for the biggest gaps either way
  tables: { title: string | null; rows: StandingRow[] }[];
  matchday: number; // the latest with a result in
  matchdays: number;
  complete: boolean; // every side has played all its games
  fixtures: Fixture[];
  knockout: Knockout | null;
  /** Each group's projected winner, for a league that plays for promotion. */
  leaders: { group: number; club: ClubLite }[] | null;
};

// ---- The bracket skeleton (UEFA competition regulations, Article 19 + Annex B) ----
//
// Fixed by the regulations, not by the draw:
//   · play-off ties pair 9/10 v 23/24, 11/12 v 21/22, 13/14 v 19/20, 15/16 v 17/18
//   · each seeded pair meets one specific play-off family — 1/2 ← 15/16 v 17/18,
//     3/4 ← 13/14 v 19/20, 5/6 ← 11/12 v 21/22, 7/8 ← 9/10 v 23/24
//   · the two clubs of a seeded pair go to opposite halves, so they can only meet in the final
//   · R16 → QF → SF is a plain binary tree
//
// What the draw decides — which club of each pair takes which slot — has no
// deterministic answer, so the projection uses the textbook reading of the rules
// above: best faces weakest. Play-off tie for seeded position p is p v (33 − p);
// the eight R16 slots below give quarter-finals 1-8, 4-5, 2-7, 3-6 and a 1 v 2 final.
const R16_SEED = [1, 8, 4, 5, 2, 7, 3, 6];
const R16_PO_SEED = [16, 9, 13, 12, 15, 10, 14, 11];
/** Play-off tie n pairs its seeded club with the club 33 places below it. */
export const poUnseeded = (seededPos: number) => 33 - seededPos;

// Bracket geometry: play-off and last-16 share eight rows, then each round halves.
// Cards carry a crest, a name, a seeding position and a squad value, so they run
// wider than the World Cup's.
const ROW = 82,
  CARD_W = 196,
  CARD_H = 54,
  STEP = 226,
  // Clear of the round labels, which .tourney .rlabel pins 46px from the top.
  TOP = 98;

const ROUNDS: { round: Round; count: number; label: string }[] = [
  { round: "PO", count: 8, label: "Play-off" },
  { round: "R16", count: 8, label: "Round of 16" },
  { round: "QF", count: 4, label: "Quarter-finals" },
  { round: "SF", count: 2, label: "Semi-finals" },
  { round: "F", count: 1, label: "Final" },
];
export const ROUND_LABEL = Object.fromEntries(ROUNDS.map((r) => [r.round, r.label])) as Record<
  Round,
  string
>;

const clip = (name: string) => (name.length > 18 ? name.slice(0, 17).trimEnd() + "…" : name);

/** The participants page spells clubs out ("Paris Saint-Germain"); the table
 *  abbreviates them ("PSG"). Bracket cards want the abbreviation, so prefer
 *  Transfermarkt's own rather than blindly clipping the long name. */
export function liteClubs(clubs: Club[], table: { id: string; short: string }[]) {
  const abbrev = new Map(table.map((r) => [r.id, r.short]));
  return new Map(
    clubs.map((c): [string, ClubLite] => [
      c.id,
      { id: c.id, name: c.name, short: clip(abbrev.get(c.id) ?? c.name), mv: c.mv },
    ]),
  );
}

export const mostValuable = (clubs: ClubLite[]) =>
  clubs.reduce<ClubLite | null>((a, b) => (!a || b.mv > a.mv ? b : a), null);

/** Rows in finishing order, each measured against the place its value per player
 *  seeds it: points against whoever holds that place and, once it has settled,
 *  places. A side yet to play has no gap either way. */
export function valueGaps<R extends { club: ClubLite; pl: number; pts: number }>(rows: R[]) {
  const byValue = [...rows].sort((a, b) => b.club.mv - a.club.mv);
  return rows.map((r, i) => {
    const valueRank = byValue.indexOf(r) + 1;
    const started = r.pl > 0;
    return {
      ...r,
      pos: i + 1,
      valueRank,
      ptsDelta: started ? r.pts - rows[valueRank - 1].pts : null,
      posDelta: started ? valueRank - (i + 1) : null,
    };
  });
}

/** How far the fixtures have got. */
export function progress(fixtures: Fixture[], rows: { pl: number }[]) {
  const matchdays = Math.max(1, ...fixtures.map((f) => f.matchday));
  return {
    matchday: fixtures.reduce((m, f) => (f.played ? Math.max(m, f.matchday) : m), 0),
    matchdays,
    complete: rows.length > 0 && rows.every((r) => r.pl >= matchdays),
  };
}

/** A club shown in a deeper round has advanced — the same signal lib/wc/live.ts
 *  trusts first, because TM wires the next round's names in before it settles
 *  aggregate scores. `depth` numbers the rounds from the shallowest. */
export function advancement(ko: KoLeg[], depth: Partial<Record<Round, number>>) {
  const deepest = new Map<string, number>();
  for (const leg of ko) {
    const d = depth[leg.round] ?? 0;
    for (const id of [leg.homeId, leg.awayId]) {
      if (id) deepest.set(id, Math.max(deepest.get(id) ?? 0, d));
    }
  }
  return (id: string, d: number) => (deepest.get(id) ?? 0) > d;
}

/** Where a tie stands. Winner: TM showing a side a round deeper is decisive;
 *  otherwise the aggregate; otherwise the more valuable squad. */
export function settle(
  legs: KoLeg[],
  homeId: string | null,
  awayId: string | null,
  advanced: (id: string) => boolean,
  byId: Map<string, ClubLite>,
) {
  const home = (homeId && byId.get(homeId)) || null;
  const away = (awayId && byId.get(awayId)) || null;
  const first = legs[0];
  const real = !!(first?.homeId && first?.awayId);
  const played = legs.length > 0 && legs.every((l) => l.hs !== null && l.as !== null);

  let winner = [homeId, awayId].find((id) => id && advanced(id)) ?? null;
  let decided = !!winner;

  let score: string | null = null;
  let pens = false;
  if (played && homeId && awayId) {
    // Leg two swaps the sides, and a shootout tally replaces that leg's score.
    let h = 0;
    let a = 0;
    for (const l of legs) {
      const flip = l.homeId ? l.homeId !== homeId : l.leg === 2;
      h += (flip ? l.as : l.hs) ?? 0;
      a += (flip ? l.hs : l.as) ?? 0;
      pens ||= l.pens;
    }
    score = `${h}:${a}`;
    if (!decided && h !== a) {
      winner = h > a ? homeId : awayId;
      decided = real;
    }
  }
  if (!winner) winner = (home?.mv ?? 0) >= (away?.mv ?? 0) ? homeId : awayId;
  return { home, away, real, winner, decided, score, pens };
}

/** The loser of every tie Transfermarkt has settled. */
export function knockedOut(cards: Card[]) {
  const out = new Set<string>();
  for (const c of cards) {
    if (!c.decided) continue;
    for (const side of [c.home, c.away]) if (side && side.id !== c.winner) out.add(side.id);
  }
  return out;
}

/** The connector from a tie to the one its winner goes on to. */
export function edge(c: Card, parent: Card): Edge {
  const sx = c.x + CARD_W;
  const ex = parent.x;
  const mx = (sx + ex) / 2;
  return {
    d: `M${sx} ${c.y}L${mx} ${c.y}L${mx} ${parent.y}L${ex} ${parent.y}`,
    club: c.winner ?? "",
  };
}

/** Where a tie sits: its round's column, at the midpoint of the two ties feeding
 *  it — `depth` halvings above the first round's rows, which `row` counts from 1. */
export const place = (col: number, row: number, depth = col) => ({
  x: col * STEP,
  y: TOP + ((row - 0.5) * 2 ** depth - 0.5) * ROW,
});

/** The canvas a bracket draws on: a column per round, `rows` ties tall. */
export const frame = (labels: string[], rows: number) => ({
  labels: labels.map((label, i) => ({ label, x: i * STEP })),
  width: labels.length * STEP - (STEP - CARD_W),
  height: TOP + rows * ROW,
  cardW: CARD_W,
  cardH: CARD_H,
});

export function buildModel(clubs: Club[], season: Season): UefaView {
  const byId = liteClubs(clubs, season.table);

  // ---- League phase: where each club sits vs what its squad is worth ----
  // Transfermarkt's displayed rank ties while clubs are level (3, 3, 5, 6, 6, 6, 9…),
  // which would leave holes in the 1-36 ladder the zones and the bracket seeding both
  // read. Densify it: points, then goal difference, then goals scored, then TM's own
  // row order — which already carries the official tie-breaks it has applied. Clubs
  // TM hasn't listed yet (it publishes the table only once the draw is made) follow
  // in value order.
  const tableById = new Map(season.table.map((r) => [r.id, r]));
  const order = (id: string) => tableById.get(id)?.order ?? Infinity;
  const rows: PhaseRow[] = valueGaps(
    clubs
      .map((c) => {
        const t = tableById.get(c.id);
        return {
          club: byId.get(c.id)!,
          pl: t?.pl ?? 0,
          gd: t?.gd ?? 0,
          gf: t?.gf ?? 0,
          pts: t?.pts ?? 0,
        };
      })
      .sort(
        (a, b) =>
          b.pts - a.pts ||
          b.gd - a.gd ||
          b.gf - a.gf ||
          order(a.club.id) - order(b.club.id) ||
          b.club.mv - a.club.mv,
      ),
  ).map((r) => {
    const expStage = expectedStage(r.valueRank);
    return {
      ...r,
      zone: zoneOf(r.pos),
      expZone: zoneOf(r.valueRank),
      expStage,
      expLabel: STAGE_LABEL[expStage],
    };
  });

  const { matchday, matchdays, complete } = progress(season.fixtures, rows);
  const finalTable = new Map(rows.map((r) => [r.pos, r.club]));

  // ---- Knockout bracket ----
  // Real legs where TM has them, the seeded projection where it doesn't. Sides are
  // resolved bottom-up, so a round only ever projects from the round below it.
  const legsOf = new Map<string, KoLeg[]>();
  for (const leg of season.ko) {
    const key = `${leg.round}-${leg.num}`;
    legsOf.set(key, [...(legsOf.get(key) ?? []), leg]);
  }

  const depth: Record<Round, number> = { PO: 1, R16: 2, QF: 3, SF: 4, F: 5 };
  const appearsDeeper = advancement(season.ko, depth);

  const cards = new Map<string, Card>();
  const resolve = (round: Round, num: number): Card => {
    const id = `${round}-${num}`;
    const cached = cards.get(id);
    if (cached) return cached;

    const legs = (legsOf.get(id) ?? []).sort((a, b) => a.leg - b.leg);
    const first = legs[0];
    let homeId = first?.homeId ?? null;
    let awayId = first?.awayId ?? null;
    let homeSeed: number | null = null;
    let awaySeed: number | null = null;

    // Project whichever side TM has not published yet.
    if (round === "PO") {
      homeSeed = poUnseeded(R16_PO_SEED[num - 1]); // the unseeded club hosts the first leg
      awaySeed = R16_PO_SEED[num - 1];
    } else if (round === "R16") {
      awaySeed = R16_SEED[num - 1];
    }
    if (!homeId && round === "R16") homeId = resolve("PO", num).winner;
    if (!homeId && round !== "PO" && round !== "R16")
      homeId = resolve(prevRound(round), num * 2 - 1).winner;
    if (!awayId && round !== "PO" && round !== "R16")
      awayId = resolve(prevRound(round), num * 2).winner;
    if (!homeId && homeSeed) homeId = finalTable.get(homeSeed)?.id ?? null;
    if (!awayId && awaySeed) awayId = finalTable.get(awaySeed)?.id ?? null;

    const col = ROUNDS.findIndex((r) => r.round === round);
    const card: Card = {
      id,
      round,
      num,
      homeSeed: first?.homeId ? null : homeSeed,
      awaySeed: first?.awayId ? null : awaySeed,
      ...settle(legs, homeId, awayId, (id) => appearsDeeper(id, depth[round]), byId),
      // Play-off and last 16 share the first eight rows; each later round halves.
      ...place(col, num, Math.max(0, col - 1)),
    };
    cards.set(id, card);
    return card;
  };

  const allCards = ROUNDS.flatMap(({ round, count }) =>
    Array.from({ length: count }, (_, i) => resolve(round, i + 1)),
  );

  // Child → parent connectors. PO feeds the R16 slot of the same number; every
  // later round takes two.
  const edges: Edge[] = allCards
    .filter((c) => c.round !== "F")
    .map((c) =>
      edge(
        c,
        c.round === "PO"
          ? cards.get(`R16-${c.num}`)!
          : cards.get(`${nextRound(c.round)}-${Math.ceil(c.num / 2)}`)!,
      ),
    );

  // ---- Who can still win it ----
  // Out: the bottom twelve, once the league phase is actually over, plus the
  // loser of every tie Transfermarkt has already settled. Everyone else is still
  // in, so the projected winner is simply the most valuable squad left — which is
  // also what the bracket above resolves to, since every undecided tie there goes
  // to the higher value per player.
  const out = knockedOut(allCards);
  if (complete) for (const r of rows) if (r.zone === "out") out.add(r.club.id);
  const alive = rows.filter((r) => !out.has(r.club.id));

  return {
    label: season.label,
    rows,
    tables: [{ title: null, rows }],
    matchday,
    matchdays,
    complete,
    fixtures: season.fixtures,
    knockout: {
      drawn: season.ko.length > 0,
      bracket: {
        cards: allCards,
        edges,
        ...frame(
          ROUNDS.map((r) => r.label),
          8,
        ),
      },
      projected: mostValuable(alive.map((r) => r.club)),
      alive: alive.length,
    },
    leaders: null,
  };
}

const ORDER: Round[] = ["PO", "R16", "QF", "SF", "F"];
const prevRound = (r: Round) => ORDER[ORDER.indexOf(r) - 1];
const nextRound = (r: Round) => ORDER[ORDER.indexOf(r) + 1];
