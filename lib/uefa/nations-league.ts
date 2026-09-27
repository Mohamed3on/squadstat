// Deterministic "the more valuable squad wins" model for the Nations League's top
// two tiers: four groups of four, each nation measured against the place its value
// per player seeds it in its group. League A plays on — two-legged quarter-finals,
// then the Finals' one-off semis and final — through the same tie-settling as the
// Champions League bracket. Pure, like model.ts, so the client can import it freely.

import {
  advancement,
  edge,
  frame,
  liteClubs,
  place,
  settle,
  type Card,
  type ClubLite,
} from "./model";
import type { Club, KoLeg, NationsSeason, Round } from "./types";

export type GroupRow = {
  club: ClubLite;
  group: number;
  /** Place in the group, in Transfermarkt's row order: it has already applied the
   *  head-to-head tie-breaks its displayed rank leaves level (1, 1, 3, 3). */
  pos: number;
  pl: number;
  gd: number;
  pts: number;
  valueRank: number; // place in the group by value per player
  /** Points minus the points of whoever holds this nation's value-seeded place. */
  ptsDelta: number | null;
  /** valueRank − pos, which only means anything once the group is over. */
  posDelta: number | null;
};

type Sides = [string | null, string | null];

export type NationsModel = ReturnType<typeof buildNationsModel>;

export function buildNationsModel(nations: Club[], season: NationsSeason) {
  const byId = liteClubs(nations, season.table);
  const matchday = season.fixtures.reduce((m, f) => (f.played ? Math.max(m, f.matchday) : m), 0);
  const matchdays = Math.max(1, ...season.fixtures.map((f) => f.matchday));

  const groups = [...new Set(season.table.map((r) => r.group))]
    .sort((a, b) => a - b)
    .map((group) => {
      const table = season.table
        .filter((r) => r.group === group && byId.has(r.id))
        .sort((a, b) => a.order - b.order);
      const byValue = [...table].sort((a, b) => byId.get(b.id)!.mv - byId.get(a.id)!.mv);
      return table.map((t, i): GroupRow => {
        const valueRank = byValue.indexOf(t) + 1;
        const started = t.pl > 0;
        return {
          club: byId.get(t.id)!,
          group,
          pos: i + 1,
          pl: t.pl,
          gd: t.gd,
          pts: t.pts,
          valueRank,
          ptsDelta: started ? t.pts - table[valueRank - 1].pts : null,
          posDelta: started ? valueRank - (i + 1) : null,
        };
      });
    });
  const rows = groups.flat();
  const over = (g: GroupRow[]) => g.every((r) => r.pl >= matchdays);

  // Who can still finish in their group's top `k`: once it's over, whoever did;
  // until then anyone whose best case — every game left won — still reaches the
  // points the k-th placed side has today.
  const canFinish = (g: GroupRow[], r: GroupRow, k: number) =>
    over(g) ? r.pos <= k : r.pts + 3 * (matchdays - r.pl) >= g[k - 1].pts;

  return {
    label: season.label,
    fetchedAt: season.fetchedAt,
    groups,
    rows,
    matchday,
    matchdays,
    complete: rows.length > 0 && over(rows),
    /** Each group's projected winner: the most valuable nation that can still top
     *  it, or the one that did. League B's prize, since its winners go up. */
    leaders: groups.map((g) => ({
      group: g[0].group,
      club: mostValuable(g.filter((r) => canFinish(g, r, 1))),
      decided: over(g),
    })),
    fixtures: season.fixtures,
    knockout: season.ko && knockout(groups, season.ko, byId, (g, r) => canFinish(g, r, 2)),
  };
}

const mostValuable = (rows: GroupRow[]) =>
  rows.reduce((a, b) => (b.club.mv > a.club.mv ? b : a)).club;

// Real sides once Transfermarkt has published both, the projection until then.
const sidesOf = (legs: KoLeg[], proj: Sides): Sides =>
  legs[0]?.homeId && legs[0]?.awayId ? [legs[0].homeId, legs[0].awayId] : proj;

/** League A's knockout, from its quarter-finals to the final, and who can still win it. */
function knockout(
  groups: GroupRow[][],
  ko: KoLeg[],
  byId: Map<string, ClubLite>,
  through: (g: GroupRow[], r: GroupRow) => boolean,
) {
  const mvOf = (id: string | null) => (id && byId.get(id)?.mv) || 0;
  const depth: Partial<Record<Round, number>> = { QF: 1, SF: 2, F: 3 };
  const appearsDeeper = advancement(ko, depth);
  const legsOf = (round: Round, num?: number) =>
    ko
      .filter((l) => l.round === round && (num === undefined || l.num === num))
      .sort((a, b) => a.leg - b.leg);

  const cards: Card[] = [];
  const card = (round: Round, num: number, row: number, sides: Sides, legs: KoLeg[]) => {
    const [homeId, awayId] = sides;
    const c: Card = {
      id: `${round}-${num}`,
      round,
      num,
      home: homeId ? (byId.get(homeId) ?? null) : null,
      away: awayId ? (byId.get(awayId) ?? null) : null,
      homeSeed: null,
      awaySeed: null,
      ...settle(legs, homeId, awayId, (id) => appearsDeeper(id, depth[round]!), mvOf),
      ...place(depth[round]! - 1, row),
    };
    cards.push(c);
    return c;
  };

  const draw = projectDraw(groups);
  const qfSides = [1, 2, 3, 4].map((n) => sidesOf(legsOf("QF", n), draw[n - 1]));
  const qfOf = (id: string | null) => qfSides.findIndex((s) => !!id && s.includes(id)) + 1;

  // The semi-final pairings come out of an open draw, and Transfermarkt numbers its
  // semis by date rather than by bracket. So read the pairing off a semi once its
  // nations are known, by the quarter-finals they came through; until then, 1 v 2
  // and 3 v 4. Quarter-final 1 stays on top either way.
  const known = legsOf("SF")
    .map((l) => [qfOf(l.homeId), qfOf(l.awayId)].sort((a, b) => a - b))
    .find(([a]) => a > 0);
  const other = [1, 2, 3, 4].filter((n) => !known?.includes(n));
  const pairs = !known
    ? [other.slice(0, 2), other.slice(2)]
    : known[0] === 1
      ? [known, other]
      : [other, known];

  const qf = pairs.flat().map((n, i) => card("QF", n, i + 1, qfSides[n - 1], legsOf("QF", n)));
  const sf = pairs.map((pair, i) => {
    const legs = legsOf("SF").filter(
      (l) => pair.includes(qfOf(l.homeId)) || pair.includes(qfOf(l.awayId)),
    );
    const [a, b] = pair.map((n) => qf.find((c) => c.num === n)!.winner);
    return card("SF", i + 1, i + 1, sidesOf(legs, [a, b]), legs);
  });
  const finalLegs = legsOf("F", 1);
  const final = card("F", 1, 1, sidesOf(finalLegs, [sf[0].winner, sf[1].winner]), finalLegs);

  const edges = [
    ...qf.map((c) => edge(c, sf[pairs.findIndex((p) => p.includes(c.num))])),
    ...sf.map((c) => edge(c, final)),
  ];

  // Out: anyone who can no longer make their group's top two, and the loser of
  // every tie Transfermarkt has settled. The projected winner is the most valuable
  // nation left — what the bracket resolves to, as every open tie goes to value.
  const out = new Set<string>();
  for (const g of groups) for (const r of g) if (!through(g, r)) out.add(r.club.id);
  for (const c of cards) {
    if (!c.decided) continue;
    for (const side of [c.home, c.away]) if (side && side.id !== c.winner) out.add(side.id);
  }
  const alive = groups.flat().filter((r) => !out.has(r.club.id));

  return {
    /** True once Transfermarkt has published any knockout tie. */
    drawn: ko.length > 0,
    bracket: { cards, edges, ...frame(["Quarter-finals", "Semi-finals", "Final"], 4) },
    projected: alive.length ? mostValuable(alive) : null,
    alive: alive.length,
  };
}

/** Before the draw. Each group winner meets a runner-up from another group, with
 *  no seeding beyond that, so take the textbook best-v-weakest reading: the most
 *  valuable winner draws the least valuable runner-up it may meet, and so on
 *  down. The two most valuable winners go in opposite halves. Sides are
 *  [runner-up, winner], as the winner hosts the second leg. */
function projectDraw(groups: GroupRow[][]): Sides[] {
  const winners = groups.map((g) => g[0]).sort((a, b) => b.club.mv - a.club.mv);
  const runners = groups.map((g) => g[1]).sort((a, b) => a.club.mv - b.club.mv);
  const pick = (i: number, left: GroupRow[]): GroupRow[] | null => {
    if (i === winners.length) return [];
    for (const r of left) {
      if (r.group === winners[i].group) continue;
      const rest = pick(
        i + 1,
        left.filter((x) => x !== r),
      );
      if (rest) return [r, ...rest];
    }
    return null;
  };
  const opponents = pick(0, runners) ?? [];
  const ties = winners.map((w, i): Sides => [opponents[i]?.club.id ?? null, w.club.id]);
  return [0, 3, 1, 2].map((i) => ties[i] ?? [null, null]);
}
