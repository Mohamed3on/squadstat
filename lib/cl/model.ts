// Deterministic "the more valuable squad wins" Champions League model.
// Pure: buildClModel(clubs, season) turns a roster + market values + whatever
// Transfermarkt has published so far into the value-vs-table rows and a
// knockout bracket. No fetching, so the client can import it freely.

import type { ClClub, ClKoLeg, ClRound, ClSeason, ClTableRow } from "./types";

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

export type ClRow = {
  club: ClubLite;
  pos: number;
  pl: number;
  gd: number;
  gf: number;
  pts: number;
  valueRank: number;
  /** Points minus the points of whoever currently holds this club's value-seeded
   *  position. The league-phase measure: over eight games a place in a 36-club
   *  table turns on goal difference, so counting places exaggerates. */
  ptsDelta: number | null;
  /** valueRank − pos, which only means anything once the league phase has settled. */
  posDelta: number | null;
  zone: Zone;
  expZone: Zone;
  expStage: number;
  expLabel: string;
};

export type ClCard = {
  id: string; // `${round}-${num}`
  round: ClRound;
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

export type ClEdge = { d: string; club: string };

// ---- The bracket skeleton (UEFA Champions League regulations, Article 19 + Annex B) ----
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

const ROUNDS: { round: ClRound; count: number; label: string }[] = [
  { round: "PO", count: 8, label: "Play-off" },
  { round: "R16", count: 8, label: "Round of 16" },
  { round: "QF", count: 4, label: "Quarter-finals" },
  { round: "SF", count: 2, label: "Semi-finals" },
  { round: "F", count: 1, label: "Final" },
];

const clip = (name: string) => (name.length > 18 ? name.slice(0, 17).trimEnd() + "…" : name);

export type ClModel = ReturnType<typeof buildClModel>;

export function buildClModel(clubs: ClClub[], season: ClSeason) {
  // The participants page spells clubs out ("Paris Saint-Germain"); the table
  // abbreviates them ("PSG"). Bracket cards want the abbreviation, so prefer
  // Transfermarkt's own rather than blindly clipping the long name.
  const abbrev = new Map(season.table.map((r) => [r.id, r.short]));
  const lite = (c: ClClub): ClubLite => ({
    id: c.id,
    name: c.name,
    short: clip(abbrev.get(c.id) ?? c.name),
    mv: c.mv,
  });
  const byId = new Map(clubs.map((c) => [c.id, lite(c)]));
  const mvOf = (id: string | null) => (id && byId.get(id)?.mv) || 0;

  // ---- League phase: where each club sits vs what its squad is worth ----
  const valueRank = new Map<string, number>();
  [...clubs].sort((a, b) => b.mv - a.mv).forEach((c, i) => valueRank.set(c.id, i + 1));

  // Transfermarkt's displayed rank ties while clubs are level (3, 3, 5, 6, 6, 6, 9…),
  // which would leave holes in the 1-36 ladder the zones and the bracket seeding both
  // read. Densify it: points, then goal difference, then goals scored, then TM's own
  // row order — which already carries the official tie-breaks it has applied.
  const dense = new Map<string, number>();
  [...season.table]
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.order - b.order)
    .forEach((r, i) => dense.set(r.id, i + 1));

  // The table is the source of truth for position; clubs TM hasn't listed yet
  // (it publishes the table only once the draw is made) fall back to value order.
  const tableById = new Map(season.table.map((r) => [r.id, r]));
  const ptsAt = new Map<number, number>();
  for (const r of season.table) ptsAt.set(dense.get(r.id)!, r.pts);

  const rows: ClRow[] = clubs
    .map((c) => {
      const t: ClTableRow | undefined = tableById.get(c.id);
      const rank = valueRank.get(c.id)!;
      const pos = dense.get(c.id) ?? rank;
      const expStage = expectedStage(rank);
      const started = !!t && t.pl > 0;
      return {
        club: lite(c),
        pos,
        pl: t?.pl ?? 0,
        gd: t?.gd ?? 0,
        gf: t?.gf ?? 0,
        pts: t?.pts ?? 0,
        valueRank: rank,
        ptsDelta: started ? t.pts - (ptsAt.get(rank) ?? t.pts) : null,
        posDelta: started ? rank - pos : null,
        zone: zoneOf(pos),
        expZone: zoneOf(rank),
        expStage,
        expLabel: STAGE_LABEL[expStage],
      };
    })
    .sort((a, b) => a.pos - b.pos);

  const matchday = season.fixtures.reduce((m, f) => (f.played ? Math.max(m, f.matchday) : m), 0);
  const matchdays = Math.max(1, ...season.fixtures.map((f) => f.matchday));
  const leaguePhaseComplete = rows.length > 0 && rows.every((r) => r.pl >= matchdays);
  const finalTable = new Map(rows.map((r) => [r.pos, r.club]));

  // ---- Knockout bracket ----
  // Real legs where TM has them, the seeded projection where it doesn't. Sides are
  // resolved bottom-up, so a round only ever projects from the round below it.
  const legsOf = new Map<string, ClKoLeg[]>();
  for (const leg of season.ko) {
    const key = `${leg.round}-${leg.num}`;
    legsOf.set(key, [...(legsOf.get(key) ?? []), leg]);
  }

  // A club shown in a deeper round has advanced — the same signal lib/wc/live.ts
  // trusts first, because TM wires the next round's names in before it settles
  // aggregate scores.
  const depth: Record<ClRound, number> = { PO: 1, R16: 2, QF: 3, SF: 4, F: 5 };
  const atDepth = new Map<number, Set<string>>();
  for (const leg of season.ko) {
    const set = atDepth.get(depth[leg.round]) ?? new Set<string>();
    if (leg.homeId) set.add(leg.homeId);
    if (leg.awayId) set.add(leg.awayId);
    atDepth.set(depth[leg.round], set);
  }
  const appearsDeeper = (id: string, d: number) => {
    for (let n = d + 1; n <= 5; n++) if (atDepth.get(n)?.has(id)) return true;
    return false;
  };

  const cards = new Map<string, ClCard>();
  const resolve = (round: ClRound, num: number): ClCard => {
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

    const real = !!(first?.homeId && first?.awayId);
    const played = legs.length > 0 && legs.every((l) => l.hs !== null && l.as !== null);

    // Winner: TM showing a club a round deeper is decisive; otherwise the
    // aggregate; otherwise the more valuable squad.
    let winner: string | null = null;
    let decided = false;
    const advanced = [homeId, awayId].find((id) => id && appearsDeeper(id, depth[round]));
    if (advanced) {
      winner = advanced;
      decided = true;
    }

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
    if (!winner) winner = mvOf(homeId) >= mvOf(awayId) ? homeId : awayId;

    const col = ROUNDS.findIndex((r) => r.round === round);
    const card: ClCard = {
      id,
      round,
      num,
      home: homeId ? (byId.get(homeId) ?? null) : null,
      away: awayId ? (byId.get(awayId) ?? null) : null,
      homeSeed: first?.homeId ? null : homeSeed,
      awaySeed: first?.awayId ? null : awaySeed,
      winner,
      real,
      decided,
      score,
      pens,
      x: col * STEP,
      y: yOf(round, num),
    };
    cards.set(id, card);
    return card;
  };

  const allCards = ROUNDS.flatMap(({ round, count }) =>
    Array.from({ length: count }, (_, i) => resolve(round, i + 1)),
  );

  // Child → parent connectors. PO feeds the R16 slot of the same number; every
  // later round takes two.
  const edges: ClEdge[] = allCards
    .filter((c) => c.round !== "F")
    .map((c) => {
      const parent =
        c.round === "PO"
          ? cards.get(`R16-${c.num}`)!
          : cards.get(`${nextRound(c.round)}-${Math.ceil(c.num / 2)}`)!;
      const sx = c.x + CARD_W;
      const ex = parent.x;
      const mx = (sx + ex) / 2;
      return {
        d: `M${sx} ${c.y}L${mx} ${c.y}L${mx} ${parent.y}L${ex} ${parent.y}`,
        club: c.winner ?? "",
      };
    });

  const champion = cards.get("F-1")?.winner ?? null;

  return {
    label: season.label,
    fetchedAt: season.fetchedAt,
    rows,
    matchday,
    matchdays,
    leaguePhaseComplete,
    /** True once Transfermarkt has published any knockout tie. */
    koDrawn: season.ko.length > 0,
    bracket: {
      cards: allCards,
      edges,
      labels: ROUNDS.map((r, i) => ({ label: r.label, x: i * STEP })),
      width: ROUNDS.length * STEP - (STEP - CARD_W),
      height: TOP + 8 * ROW,
      cardW: CARD_W,
      cardH: CARD_H,
    },
    champion: champion ? (byId.get(champion) ?? null) : null,
    fixtures: season.fixtures,
    clubsById: Object.fromEntries(byId),
  };
}

const ORDER: ClRound[] = ["PO", "R16", "QF", "SF", "F"];
const prevRound = (r: ClRound) => ORDER[ORDER.indexOf(r) - 1];
const nextRound = (r: ClRound) => ORDER[ORDER.indexOf(r) + 1];

/** Play-off and last-16 sit on the same eight rows; each later round is the
 *  midpoint of the two ties feeding it. */
function yOf(round: ClRound, num: number): number {
  if (round === "PO" || round === "R16") return TOP + (num - 1) * ROW;
  const a = yOf(prevRound(round), num * 2 - 1);
  const b = yOf(prevRound(round), num * 2);
  return (a + b) / 2;
}
