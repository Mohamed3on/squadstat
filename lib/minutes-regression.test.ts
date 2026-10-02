import { describe, it, expect } from "vitest";
import { analyzeMinutesRegressions, publishVerdict } from "./minutes-regression";
import type { MinutesValuePlayer } from "@/app/types";

const makePlayer = (
  playerId: string,
  name: string,
  club: string,
  minutes: number,
): MinutesValuePlayer =>
  ({
    playerId,
    name,
    club,
    minutes,
    marketValue: 1_000_000,
  }) as MinutesValuePlayer;

describe("analyzeMinutesRegressions", () => {
  it("returns no failures when nothing regressed", () => {
    const old = [makePlayer("1", "A", "X", 100)];
    const fresh = [makePlayer("1", "A", "X", 105)];
    const r = analyzeMinutesRegressions(old, fresh);
    expect(r.scattered).toHaveLength(0);
    expect(r.ignoredClubs).toHaveLength(0);
    expect(r.fail).toBe(false);
  });

  it("treats ≤5' drops as noise (within MINUTES_DROP_TOLERANCE)", () => {
    const old = [makePlayer("1", "A", "X", 100)];
    const fresh = [makePlayer("1", "A", "X", 96)];
    expect(analyzeMinutesRegressions(old, fresh).scattered).toHaveLength(0);
  });

  it("ignores whole-club corrections (≥3 players and ≥50% of club regressed)", () => {
    const old = [
      makePlayer("1", "A", "Hilal", 1000),
      makePlayer("2", "B", "Hilal", 1000),
      makePlayer("3", "C", "Hilal", 1000),
      makePlayer("4", "D", "Hilal", 1000),
      makePlayer("5", "E", "Other", 1000),
    ];
    const fresh = [
      makePlayer("1", "A", "Hilal", 910),
      makePlayer("2", "B", "Hilal", 910),
      makePlayer("3", "C", "Hilal", 910),
      makePlayer("4", "D", "Hilal", 1000),
      makePlayer("5", "E", "Other", 1000),
    ];
    const r = analyzeMinutesRegressions(old, fresh);
    expect(r.ignoredClubs).toEqual(["Hilal"]);
    expect(r.ignoredCount).toBe(3);
    expect(r.scattered).toHaveLength(0);
    expect(r.fail).toBe(false);
  });

  it("does NOT flag whole-club when only 2 of a large club regressed", () => {
    const all = Array.from({ length: 20 }, (_, i) =>
      makePlayer(String(i), `P${i}`, "BigClub", 1000),
    );
    const fresh = all.map((p, i) => (i < 2 ? { ...p, minutes: 910 } : p));
    const r = analyzeMinutesRegressions(all, fresh);
    expect(r.ignoredClubs).toHaveLength(0);
    expect(r.scattered).toHaveLength(2);
  });

  it("tolerates scattered drops up to max(10, 2% of dataset)", () => {
    const old = Array.from({ length: 500 }, (_, i) =>
      makePlayer(String(i), `P${i}`, `Club${i % 50}`, 1000),
    );
    const fresh = old.map((p, i) => (i < 10 ? { ...p, minutes: 910 } : p));
    const r = analyzeMinutesRegressions(old, fresh);
    expect(r.maxScattered).toBe(10);
    expect(r.scattered).toHaveLength(10);
    expect(r.fail).toBe(false);
  });

  it("fails when scattered drops exceed tolerance", () => {
    const old = Array.from({ length: 500 }, (_, i) =>
      makePlayer(String(i), `P${i}`, `Club${i % 50}`, 1000),
    );
    const fresh = old.map((p, i) => (i < 50 ? { ...p, minutes: 910 } : p));
    const r = analyzeMinutesRegressions(old, fresh);
    expect(r.fail).toBe(true);
    expect(r.scattered.length).toBeGreaterThan(r.maxScattered);
  });

  it("handles empty club strings gracefully", () => {
    const old = [makePlayer("1", "A", "", 1000), makePlayer("2", "B", "", 1000)];
    const fresh = [makePlayer("1", "A", "", 910), makePlayer("2", "B", "Other", 1000)];
    const r = analyzeMinutesRegressions(old, fresh);
    expect(r.fail).toBe(false);
    expect(r.scattered).toHaveLength(1);
  });

  it("ignores Al-Hilal whole-club regression from the real failed CI run", () => {
    // The real incident: TM voided an Al-Hilal match, so its players each lost ~90'.
    // Al-Hilal has few enough qualifying players that 5 regressing is >=50% of the club,
    // so the whole-club rule attributes it to a TM correction rather than a scrape failure.
    const alHilal = [
      makePlayer("339808", "Theo Hernández", "Al-Hilal", 1200),
      makePlayer("225161", "Rúben Neves", "Al-Hilal", 1100),
      makePlayer("266302", "Sergej Milinković-Savić", "Al-Hilal", 1300),
      makePlayer("668267", "Marcos Leonardo", "Al-Hilal", 900),
      makePlayer("323704", "Malcom", "Al-Hilal", 1000),
      makePlayer("357565", "Yassine Bounou", "Al-Hilal", 1400),
      makePlayer("232456", "Kalidou Koulibaly", "Al-Hilal", 1350),
      makePlayer("180066", "Aleksandar Mitrović", "Al-Hilal", 800),
    ];
    // A realistically-sized rest-of-dataset so maxScattered mirrors production.
    const others = Array.from({ length: 1200 }, (_, i) =>
      makePlayer(`o${i}`, `P${i}`, `Club${i % 80}`, 1000),
    );
    const old = [...alHilal, ...others];

    // Simulate the TM correction: 5 of the Al-Hilal players lose ~90'.
    const dropped: Record<string, number> = {
      "339808": 90,
      "225161": 90,
      "266302": 90,
      "668267": 79,
      "323704": 89,
    };
    const fresh = old.map((p) => {
      const drop = dropped[p.playerId];
      return drop ? { ...p, minutes: p.minutes - drop } : p;
    });

    const r = analyzeMinutesRegressions(old, fresh);
    expect(r.ignoredClubs).toContain("Al-Hilal");
    expect(r.ignoredCount).toBe(5);
    expect(r.scattered).toHaveLength(0);
    expect(r.fail).toBe(false);
  });
});

describe("publishVerdict", () => {
  // n fetched players, a goal and 900' each, spread over 20 clubs.
  const squad = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      ...makePlayer(String(i), `P${i}`, `Club${i % 20}`, 900),
      goals: 1,
      assists: 0,
      fetchedAt: 1,
    }));
  const base = { seasonChanged: false, skipMinutesRegression: false };

  it("judges the rows it writes, not the pool they were filtered from", () => {
    const pool = squad(200);
    const verdict = publishVerdict({
      ...base,
      committed: squad(200),
      rows: pool.slice(0, 150),
      pool,
    });
    expect(verdict.failures).toEqual([
      "Stats regressed: G+A 200 → 150 (75%).",
      "Player count regressed: 200 → 150 (75%).",
    ]);
  });

  it("skips old-vs-new checks with nothing committed or after a season flip, but not the value check", () => {
    const pool = squad(200).map((p, i) => (i < 30 ? { ...p, marketValue: 0 } : p));
    const rows = pool.slice(30);
    const unvalued = "30/200 players have no market value — scraping issue.";
    const first = publishVerdict({ ...base, committed: null, rows, pool });
    expect(first.failures).toEqual([unvalued]);
    expect(first.notes).toContain("No committed data yet — skipping old-vs-new regression checks.");
    const flipped = publishVerdict({
      ...base,
      seasonChanged: true,
      committed: squad(400),
      rows,
      pool,
    });
    expect(flipped.failures).toEqual([unvalued]);
  });

  it("lets SKIP_MINUTES_REGRESSION through the minutes wave and nothing else", () => {
    const committed = squad(200);
    const wave = squad(200).map((p, i) => (i < 50 ? { ...p, minutes: 800 } : p));
    const verdict = (rows: MinutesValuePlayer[], skipMinutesRegression: boolean) =>
      publishVerdict({ ...base, committed, rows, pool: rows, skipMinutesRegression });
    expect(verdict(wave, false).failures).toHaveLength(1);
    expect(verdict(wave, true).failures).toEqual([]);
    expect(verdict(wave, true).warnings[0]).toMatch(/^SKIP_MINUTES_REGRESSION=1 — tolerating: 50/);
    expect(verdict(wave.slice(0, 150), true).failures).toContain(
      "Player count regressed: 200 → 150 (75%).",
    );
  });
});
