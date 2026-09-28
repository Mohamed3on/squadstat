// Deterministic "the more valuable squad wins" model for the Nations League's top
// two tiers: four groups of four, each nation measured against the place its value
// per player seeds it in its group. League A plays on — two-legged quarter-finals,
// then the Finals' one-off semis and final — through the same tie-settling as the
// Champions League bracket. Pure, like model.ts, so the client can import it freely.

import {
  ROUND_LABEL,
  advancement,
  edge,
  frame,
  knockedOut,
  liteClubs,
  mostValuable,
  place,
  progress,
  settle,
  valueGaps,
  type Card,
  type ClubLite,
  type Knockout,
  type StandingRow,
  type UefaView,
} from "./model";
import type { Club, GroupsComp, KoLeg, NationsSeason, Round } from "./types";

export type GroupRow = StandingRow & { group: number };

type Sides = [string | null, string | null];

export function buildNationsModel(
  nations: Club[],
  season: NationsSeason,
  bands: GroupsComp["bands"],
): UefaView {
  const byId = liteClubs(nations, season.table);
  const groups = [...new Set(season.table.map((r) => r.group))]
    .sort((a, b) => a - b)
    .map((group): GroupRow[] =>
      valueGaps(
        // Transfermarkt's row order: it has applied the head-to-head tie-breaks its
        // displayed rank leaves level (1, 1, 3, 3).
        season.table
          .filter((t) => t.group === group && byId.has(t.id))
          .sort((a, b) => a.order - b.order)
          .map((t) => ({ club: byId.get(t.id)!, group, pl: t.pl, gd: t.gd, pts: t.pts })),
      ).map((r) => ({ ...r, zone: bands.find((b) => r.pos <= b.upTo)?.zone ?? null })),
    );
  const rows = groups.flat();
  const { matchday, matchdays, complete } = progress(season.fixtures, rows);

  // Who can still finish in their group's top `k`: once it's over, whoever did;
  // until then anyone whose best case — every game left won — still reaches the
  // points the k-th placed side has today.
  const canFinish = (g: GroupRow[], r: GroupRow, k: number) =>
    g.every((x) => x.pl >= matchdays) ? r.pos <= k : r.pts + 3 * (matchdays - r.pl) >= g[k - 1].pts;
  const contenders = (g: GroupRow[], k: number) => g.filter((r) => canFinish(g, r, k));

  return {
    label: season.label,
    rows,
    tables: groups.map((g) => ({ title: `Group ${g[0].group}`, rows: g })),
    matchday,
    matchdays,
    complete,
    fixtures: season.fixtures,
    knockout:
      season.ko &&
      knockout(
        groups,
        season.ko,
        byId,
        groups.flatMap((g) => contenders(g, 2)),
      ),
    // A league with no knockout plays for promotion, so its prize is each group:
    // the most valuable nation still able to top it (the leader always can).
    leaders: season.ko
      ? null
      : groups.map((g) => ({
          group: g[0].group,
          club: mostValuable(contenders(g, 1).map((r) => r.club))!,
        })),
  };
}

// Real sides once Transfermarkt has published both, the projection until then.
const sidesOf = (legs: KoLeg[], proj: Sides): Sides =>
  legs[0]?.homeId && legs[0]?.awayId ? [legs[0].homeId, legs[0].awayId] : proj;

/** League A's knockout, from its quarter-finals to the final. `contenders` are the
 *  nations still able to make their group's top two. */
function knockout(
  groups: GroupRow[][],
  ko: KoLeg[],
  byId: Map<string, ClubLite>,
  contenders: GroupRow[],
): Knockout {
  const depth = { QF: 1, SF: 2, F: 3 } as const;
  const appearsDeeper = advancement(ko, depth);
  const legsOf = (round: Round, num?: number) =>
    ko
      .filter((l) => l.round === round && (num === undefined || l.num === num))
      .sort((a, b) => a.leg - b.leg);
  const card = (
    round: keyof typeof depth,
    num: number,
    row: number,
    [homeId, awayId]: Sides,
    legs: KoLeg[],
  ): Card => ({
    id: `${round}-${num}`,
    round,
    num,
    homeSeed: null,
    awaySeed: null,
    ...settle(legs, homeId, awayId, (id) => appearsDeeper(id, depth[round]), byId),
    ...place(depth[round] - 1, row),
  });

  const draw = projectDraw(groups);
  const qfSides = [1, 2, 3, 4].map((n) => sidesOf(legsOf("QF", n), draw[n - 1]));
  const qfOf = (id: string | null) => qfSides.findIndex((s) => !!id && s.includes(id)) + 1;

  // The semi-final pairings come out of an open draw, and Transfermarkt numbers its
  // semis by date rather than by bracket. So read the pairing off a semi once its
  // nations are known, by the quarter-finals they came through; until then, 1 v 2
  // and 3 v 4. Quarter-final 1 stays on top either way.
  const known = legsOf("SF")
    .map((l) => [qfOf(l.homeId), qfOf(l.awayId)].sort((a, b) => a - b))
    .find(([a]) => a > 0) ?? [1, 2];
  const pairs = [known, [1, 2, 3, 4].filter((n) => !known.includes(n))].sort((a, b) => a[0] - b[0]);

  const qf = pairs.flat().map((n, i) => card("QF", n, i + 1, qfSides[n - 1], legsOf("QF", n)));
  const sf = pairs.map((pair, i) => {
    const legs = legsOf("SF").filter(
      (l) => pair.includes(qfOf(l.homeId)) || pair.includes(qfOf(l.awayId)),
    );
    return card("SF", i + 1, i + 1, sidesOf(legs, [qf[2 * i].winner, qf[2 * i + 1].winner]), legs);
  });
  const finalLegs = legsOf("F", 1);
  const final = card("F", 1, 1, sidesOf(finalLegs, [sf[0].winner, sf[1].winner]), finalLegs);
  const cards = [...qf, ...sf, final];

  // Out: anyone who can no longer make their group's top two, and the loser of
  // every tie Transfermarkt has settled. The projected winner is the most valuable
  // nation left — what the bracket resolves to, as every open tie goes to value.
  const out = knockedOut(cards);
  const alive = contenders.filter((r) => !out.has(r.club.id));

  return {
    drawn: ko.length > 0,
    bracket: {
      cards,
      edges: [
        ...qf.map((c, i) => edge(c, sf[Math.floor(i / 2)])),
        ...sf.map((c) => edge(c, final)),
      ],
      ...frame(
        (["QF", "SF", "F"] as const).map((r) => ROUND_LABEL[r]),
        4,
      ),
    },
    projected: mostValuable(alive.map((r) => r.club)),
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
