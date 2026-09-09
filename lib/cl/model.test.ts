import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { describe, it, expect } from "vitest";
import { __parsers } from "./fetch";
import { buildClModel, expectedStage, poUnseeded, zoneOf } from "./model";
import type { ClClub, ClSeason } from "./types";

// The finished 2025/26 league phase, play-off, and bracket through to the final,
// captured from Transfermarkt's "all fixtures & results" page (images stripped).
// A completed season is the only way to check the bracket end to end: it has a
// settled 36-club table *and* a real draw to compare the seeding rules against.
const $ = cheerio.load(
  readFileSync(
    fileURLToPath(new URL("./__fixtures__/schedule-2025-26.html", import.meta.url)),
    "utf8",
  ),
);

const season: ClSeason = {
  label: "25/26",
  fetchedAt: 0,
  table: __parsers.parseTable($),
  fixtures: __parsers.parseFixtures($),
  ko: __parsers.parseKo($),
};

// The fixture is the schedule page, which never spells out squad values. Market
// value only decides *projections*, and every 25/26 tie has a real result, so a
// placeholder ladder keeps the real-results assertions honest.
const clubs: ClClub[] = season.table.map((r) => ({
  id: r.id,
  name: r.short,
  squad: 25,
  avgAge: 26,
  mv: 1000 - r.order * 10,
}));

const model = buildClModel(clubs, season);
const posOf = new Map(model.rows.map((r) => [r.club.id, r.pos]));
const cardsIn = (round: string) => model.bracket.cards.filter((c) => c.round === round);

describe("parsing", () => {
  it("reads the 36-club league table", () => {
    expect(season.table).toHaveLength(36);
    expect(season.table.every((r) => r.pl === 8)).toBe(true);
  });

  it("reads all 144 league-phase fixtures, 18 to a matchday", () => {
    expect(season.fixtures).toHaveLength(144);
    for (let md = 1; md <= 8; md++) {
      expect(season.fixtures.filter((f) => f.matchday === md)).toHaveLength(18);
    }
    expect(season.fixtures.every((f) => f.played)).toBe(true);
  });

  it("reads every knockout leg, including extra time and shootouts", () => {
    const count = (round: string, leg: number) =>
      season.ko.filter((k) => k.round === round && k.leg === leg).length;
    expect([count("PO", 1), count("PO", 2)]).toEqual([8, 8]);
    expect([count("R16", 1), count("R16", 2)]).toEqual([8, 8]);
    expect([count("QF", 1), count("QF", 2)]).toEqual([4, 4]);
    expect([count("SF", 1), count("SF", 2)]).toEqual([2, 2]);
    expect(count("F", 1)).toBe(1);
    expect(season.ko.some((k) => k.aet)).toBe(true);
    expect(season.ko.filter((k) => k.pens)).toHaveLength(1); // the final
  });
});

describe("league phase", () => {
  it("densifies Transfermarkt's tied ranks into a 1-36 ladder", () => {
    expect(model.rows.map((r) => r.pos)).toEqual([...Array(36)].map((_, i) => i + 1));
    expect(model.rows.slice(0, 8).map((r) => r.club.name)).toEqual([
      "Arsenal",
      "Bayern Munich",
      "Liverpool",
      "Tottenham",
      "Barcelona",
      "Chelsea",
      "Sporting",
      "Man City",
    ]);
    expect(model.leaguePhaseComplete).toBe(true);
  });

  it("splits the table into the three qualification bands", () => {
    expect([zoneOf(1), zoneOf(8), zoneOf(9), zoneOf(24), zoneOf(25), zoneOf(36)]).toEqual([
      "r16",
      "r16",
      "po",
      "po",
      "out",
      "out",
    ]);
  });

  it("seeds expectations off squad-value rank, halving like the bracket", () => {
    expect([1, 2, 3, 4, 5, 8, 9, 16, 17, 24, 25, 36].map(expectedStage)).toEqual([
      6, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0,
    ]);
  });

  it("measures a club against where its value seeds it, in places and in points", () => {
    const row = model.rows.find((r) => r.club.name === "Sporting")!;
    expect(row.posDelta).toBe(row.valueRank - row.pos);
    // Points are measured against whoever actually holds the club's value-seeded
    // place — the league-phase unit, since a place turns on goal difference.
    const holder = model.rows.find((r) => r.pos === row.valueRank)!;
    expect(row.ptsDelta).toBe(row.pts - holder.pts);
  });

  it("leaves both gaps null for a club that has not kicked off", () => {
    const notStarted = buildClModel(clubs, { ...season, table: [], fixtures: [] });
    expect(notStarted.rows.every((r) => r.ptsDelta === null && r.posDelta === null)).toBe(true);
  });
});

describe("bracket, replayed against the real 2025/26 draw", () => {
  it("rebuilds all 23 ties from Transfermarkt, every one real and settled", () => {
    expect(model.bracket.cards).toHaveLength(23);
    expect(model.bracket.cards.every((c) => c.real && c.decided)).toBe(true);
    expect(model.koDrawn).toBe(true);
  });

  it("aggregates two legs, and reads the final's shootout", () => {
    const r16 = model.bracket.cards.find((c) => c.id === "R16-4")!;
    expect(r16.home?.name).toBe("Atalanta");
    expect(r16.away?.name).toBe("Bayern Munich");
    expect(r16.score).toBe("2:10"); // 1:6 away, then 1:4
    expect(r16.winner).toBe(r16.away?.id);

    const final = model.bracket.cards.at(-1)!;
    expect([final.home?.name, final.away?.name]).toEqual(["PSG", "Arsenal"]);
    expect(final.pens).toBe(true);
    expect(model.champion?.name).toBe("PSG");
  });

  it("keeps the real bracket a binary tree from the last 16 up", () => {
    for (const parent of [...cardsIn("QF"), ...cardsIn("SF"), ...cardsIn("F")]) {
      const round = parent.round === "QF" ? "R16" : parent.round === "SF" ? "QF" : "SF";
      const kids = [parent.num * 2 - 1, parent.num * 2].map(
        (n) => model.bracket.cards.find((c) => c.id === `${round}-${n}`)!,
      );
      expect([parent.home?.id, parent.away?.id]).toEqual(kids.map((k) => k.winner));
    }
  });

  it("pairs each seeded club with the play-off family the regulations give it", () => {
    // Article 19: clubs 1/2 meet a 15/16 v 17/18 winner, 3/4 meet 13/14 v 19/20,
    // 5/6 meet 11/12 v 21/22, 7/8 meet 9/10 v 23/24 — i.e. the seeded pair index
    // ceil(seed/2) equals the play-off family index ceil((17 − poSeed)/2).
    const poSeedOf = new Map(
      cardsIn("PO").map((c) => {
        const sides = [c.home!.id, c.away!.id].map((id) => posOf.get(id)!);
        return [c.winner!, Math.min(...sides)] as const; // the seeded club is 9-16
      }),
    );
    for (const tie of cardsIn("R16")) {
      const sides = [tie.home!, tie.away!];
      const seed = posOf.get(sides.find((s) => posOf.get(s.id)! <= 8)!.id)!;
      const poSeed = poSeedOf.get(sides.find((s) => posOf.get(s.id)! > 8)!.id)!;
      expect(Math.ceil((17 - poSeed) / 2)).toBe(Math.ceil(seed / 2));
    }
  });
});

describe("bracket, projected before the draw", () => {
  // Same finished table, knockout data withheld — what the page shows in the days
  // between the last matchday and the play-off draw.
  const projected = buildClModel(clubs, { ...season, ko: [] });
  const pos = new Map(projected.rows.map((r) => [r.club.id, r.pos]));
  const at = (id: string) => projected.bracket.cards.find((c) => c.id === id)!;

  it("has no real ties, but fills every slot", () => {
    expect(projected.koDrawn).toBe(false);
    expect(projected.bracket.cards).toHaveLength(23);
    expect(projected.bracket.cards.every((c) => c.home && c.away)).toBe(true);
    expect(projected.bracket.cards.every((c) => !c.real && !c.decided)).toBe(true);
  });

  it("pairs each play-off tie p against 33 − p", () => {
    for (const c of projected.bracket.cards.filter((x) => x.round === "PO")) {
      const [a, b] = [pos.get(c.home!.id)!, pos.get(c.away!.id)!];
      expect(a + b).toBe(33);
      expect(poUnseeded(Math.min(a, b))).toBe(Math.max(a, b));
      expect(a).toBeGreaterThan(b); // the unseeded club hosts the first leg
    }
  });

  it("gives the last 16 the eight seeds, best against weakest", () => {
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => pos.get(at(`R16-${n}`).away!.id));
    expect(seeds).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    // Each seed meets the play-off its pair is regulated to meet: 1/2 ← 15/16 v 17/18,
    // 3/4 ← 13/14 v 19/20, 5/6 ← 11/12 v 21/22, 7/8 ← 9/10 v 23/24.
    for (let n = 1; n <= 8; n++) {
      const seed = pos.get(at(`R16-${n}`).away!.id)!;
      const poSeed = Math.min(pos.get(at(`PO-${n}`).home!.id)!, pos.get(at(`PO-${n}`).away!.id)!);
      expect(Math.ceil((17 - poSeed) / 2)).toBe(Math.ceil(seed / 2));
    }
  });

  it("keeps clubs of a seeded pair apart until the final", () => {
    // Halves are SF-1 = R16 1-4 and SF-2 = R16 5-8.
    const halfOf = (seed: number) => ([1, 8, 4, 5].includes(seed) ? 1 : 2);
    for (const [a, b] of [
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
    ]) {
      expect(halfOf(a)).not.toBe(halfOf(b));
    }
    // The two most valuable squads left standing meet in the final, nowhere earlier.
    const final = at("F-1");
    expect([final.home?.id, final.away?.id]).toEqual([at("SF-1").winner, at("SF-2").winner]);
  });
});
