import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { describe, it, expect } from "vitest";
import { __parsers } from "./fetch";
import { buildNationsModel } from "./nations-league";
import { COMPETITIONS, type Club, type NationsSeason } from "./types";

// League A 2024/25 finished — six matchdays, then the quarter-finals and the Finals,
// which Transfermarkt files as a competition of their own — and League B 2026/27 a
// matchday or two in, each captured from the "all fixtures & results" page (images
// stripped).
const load = (name: string) =>
  cheerio.load(
    readFileSync(fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)), "utf8"),
  );

const finals = load("unfi-2024-25.html");
const a = __parsers.parseNationsSeason(load("unla-2024-25.html"), finals);
const b = __parsers.parseNationsSeason(load("unlb-2026-27-partial.html"), null);

// The schedule pages never spell out squad values. League A's knockout is all real,
// so a placeholder ladder in Transfermarkt's table order keeps it honest; League B,
// mid-phase, is measured against the values per player of the day.
const clubsOf = (s: NationsSeason, mv: (short: string, i: number) => number): Club[] =>
  s.table.map((r, i) => ({ id: r.id, name: r.short, squad: 25, avgAge: 26, mv: mv(r.short, i) }));
const VALUE: Record<string, number> = {
  Sweden: 16.38,
  Switzerland: 12.27,
  Poland: 9.98,
  Georgia: 9.36,
  Austria: 8.95,
  Ukraine: 8.65,
  Ireland: 7.56,
  Hungary: 6.95,
  Slovenia: 6.73,
  Bosnia: 5.93,
  Scotland: 5.56,
  Kosovo: 5.53,
  "N. Ireland": 4.51,
  Israel: 3.88,
  Romania: 3.74,
  "North Macedonia": 1.41,
};
const ladder = clubsOf(a, (_, i) => 100 - i);
const valued = (s: NationsSeason) => clubsOf(s, (short) => VALUE[short]);

const model = buildNationsModel(ladder, a, COMPETITIONS.UNLA.bands);
const ko = model.knockout!;
const card = (id: string) => ko.bracket.cards.find((c) => c.id === id)!;
const nameOf = (id: string | null) =>
  ko.bracket.cards.flatMap((c) => [c.home, c.away]).find((n) => n?.id === id)?.name;
const league = buildNationsModel(valued(b), b, COMPETITIONS.UNLB.bands);
const row = (name: string) => league.rows.find((r) => r.club.name === name)!;

describe("parsing", () => {
  it("reads four groups of four, and 48 fixtures that pair off into six matchdays", () => {
    expect([a.label, b.label]).toEqual(["24/25", "26/27"]);
    for (const s of [a, b]) {
      expect(s.table).toHaveLength(16);
      expect([1, 2, 3, 4].map((g) => s.table.filter((r) => r.group === g).length)).toEqual([
        4, 4, 4, 4,
      ]);
      expect(s.fixtures).toHaveLength(48);
      for (let md = 1; md <= 6; md++) {
        const games = s.fixtures.filter((f) => f.matchday === md);
        expect(new Set(games.flatMap((f) => [f.homeId, f.awayId])).size).toBe(16);
      }
    }
  });

  it("reads the knockout off its own competition, without the third-place play-off", () => {
    const count = (round: string) => a.ko!.filter((l) => l.round === round).length;
    expect([count("QF"), count("SF"), count("F")]).toEqual([8, 2, 1]);
    expect(a.ko!.filter((l) => l.pens)).toHaveLength(3); // two quarter-finals and the final
    // One-off ties are a single first leg, whatever section they sit under.
    expect(a.ko!.filter((l) => l.round !== "QF").every((l) => l.leg === 1)).toBe(true);
  });

  it("ignores the knockout page while Transfermarkt serves another edition in its place", () => {
    // 2026/27's groups next to the 2024/25 knockout: what the page gets before the draw.
    const before = __parsers.parseNationsSeason(load("unlb-2026-27-partial.html"), finals);
    expect(before.ko).toEqual([]);
  });
});

describe("groups", () => {
  it("keeps Transfermarkt's row order where its displayed ranks tie", () => {
    // Northern Ireland and Ukraine both read "1", Georgia and Hungary both "3".
    expect(league.tables[1].rows.map((r) => [r.pos, r.club.name])).toEqual([
      [1, "N. Ireland"],
      [2, "Ukraine"],
      [3, "Georgia"],
      [4, "Hungary"],
    ]);
  });

  it("measures a nation against whoever holds its value-seeded place in the group", () => {
    for (const { rows } of league.tables) {
      for (const r of rows) {
        expect(r.ptsDelta).toBe(r.pts - rows[r.valueRank - 1].pts);
        expect(r.posDelta).toBe(r.valueRank - r.pos);
      }
    }
    // The group's cheapest squad top of it, and its dearest third.
    expect([row("N. Ireland").valueRank, row("N. Ireland").ptsDelta]).toEqual([4, 3]);
    expect([row("Georgia").valueRank, row("Georgia").ptsDelta]).toEqual([1, -3]);
    expect(league.complete).toBe(false);
  });

  it("stripes the places each tier plays for", () => {
    expect(model.tables[0].rows.map((r) => r.zone)).toEqual(["up", "up", null, null]);
    expect(league.tables[0].rows.map((r) => r.zone)).toEqual(["up", "po", null, null]);
  });

  it("leaves both gaps empty for a nation yet to kick off", () => {
    const fresh = buildNationsModel(
      valued(b),
      { ...b, table: b.table.map((r) => ({ ...r, pl: 0, pts: 0 })) },
      COMPETITIONS.UNLB.bands,
    );
    expect(fresh.rows.every((r) => r.ptsDelta === null && r.posDelta === null)).toBe(true);
  });

  it("projects each group's winner as its most valuable nation that can still top it", () => {
    expect(league.leaders!.map((l) => l.club.name)).toEqual([
      "Switzerland",
      "Georgia",
      "Austria",
      "Sweden",
    ]);
    // A game to go and seven points adrift: Georgia can no longer catch the leader.
    const pts: Record<string, number> = { "N. Ireland": 10, Ukraine: 9, Georgia: 3, Hungary: 3 };
    const late = buildNationsModel(
      valued(b),
      { ...b, table: b.table.map((r) => (r.group === 2 ? { ...r, pl: 5, pts: pts[r.short] } : r)) },
      COMPETITIONS.UNLB.bands,
    );
    expect(late.leaders![1].club.name).toBe("Ukraine");
  });

  it("plays no knockout in League B, and projects no group winners in League A", () => {
    expect(league.knockout).toBeNull();
    expect(model.leaders).toBeNull();
  });
});

describe("League A knockout, replayed against 2024/25", () => {
  it("rebuilds all seven ties from Transfermarkt, every one real and settled", () => {
    expect(model.complete).toBe(true);
    expect(ko.drawn).toBe(true);
    expect(ko.bracket.cards).toHaveLength(7);
    expect(ko.bracket.cards.every((c) => c.real && c.decided)).toBe(true);
  });

  it("aggregates two legs, a shootout included", () => {
    const qf = card("QF-1");
    expect([qf.home?.name, qf.away?.name]).toEqual(["Netherlands", "Spain"]);
    expect(qf.score).toBe("9:10"); // 2:2, then 7:8 counting the shootout
    expect(qf.pens).toBe(true);
    expect(nameOf(qf.winner)).toBe("Spain");
  });

  it("files each semi under the quarter-finals feeding it, whatever TM numbers it", () => {
    // Transfermarkt's "SF 1" is Germany v Portugal, the winners of quarter-finals
    // 3 and 4, numbered first only because it was played first.
    expect([card("SF-1").home?.name, card("SF-1").away?.name]).toEqual(["Spain", "France"]);
    expect([card("SF-2").home?.name, card("SF-2").away?.name]).toEqual(["Germany", "Portugal"]);
    for (const [sf, feeders] of [
      ["SF-1", ["QF-1", "QF-2"]],
      ["SF-2", ["QF-3", "QF-4"]],
    ] as const) {
      const sides = [card(sf).home?.id, card(sf).away?.id].sort();
      expect(sides).toEqual(feeders.map((id) => card(id).winner).sort());
    }
  });

  it("reads the final's shootout, and leaves one nation standing", () => {
    const final = card("F-1");
    expect([final.home?.name, final.away?.name]).toEqual(["Portugal", "Spain"]);
    expect(final.pens).toBe(true);
    expect(nameOf(final.winner)).toBe("Portugal");
    expect([ko.projected?.name, ko.alive]).toEqual(["Portugal", 1]);
  });
});

describe("League A knockout, projected before the draw", () => {
  // Same final tables, knockout withheld — the days between the last matchday and
  // the quarter-final draw.
  const projected = buildNationsModel(ladder, { ...a, ko: [] }, COMPETITIONS.UNLA.bands).knockout!;
  const standing = new Map(
    model.tables.flatMap(({ rows }, group) => rows.map((r) => [r.club.id, { group, pos: r.pos }])),
  );
  const quarters = projected.bracket.cards.filter((c) => c.round === "QF");

  it("fills every slot, with nothing real yet", () => {
    expect(projected.drawn).toBe(false);
    expect(projected.bracket.cards.every((c) => c.home && c.away && !c.real && !c.decided)).toBe(
      true,
    );
  });

  it("draws each group winner against a runner-up from another group", () => {
    for (const c of quarters) {
      const [home, away] = [standing.get(c.home!.id)!, standing.get(c.away!.id)!];
      expect([home.pos, away.pos]).toEqual([2, 1]); // the winner hosts the second leg
      expect(home.group).not.toBe(away.group);
    }
  });

  it("gives the most valuable winner the least valuable runner-up, and keeps the top two apart", () => {
    const winners = quarters.map((c) => c.away!).sort((x, y) => y.mv - x.mv);
    const top = quarters.find((c) => c.away!.id === winners[0].id)!;
    const allowed = quarters
      .map((c) => c.home!)
      .filter((r) => standing.get(r.id)!.group !== standing.get(top.away!.id)!.group);
    expect(top.home!.mv).toBe(Math.min(...allowed.map((r) => r.mv)));
    const half = (id: string) => (quarters.findIndex((c) => c.away!.id === id) < 2 ? 1 : 2);
    expect(half(winners[0].id)).not.toBe(half(winners[1].id));
  });

  it("counts only the eight quarter-finalists as still in it", () => {
    const eight = model.rows.filter((r) => r.pos <= 2);
    expect(projected.alive).toBe(8);
    expect(projected.projected?.mv).toBe(Math.max(...eight.map((r) => r.club.mv)));
  });
});
