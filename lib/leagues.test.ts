import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { TOP_5_LEAGUES } from "./filter-players";
import { canonicalLeagueName, LEAGUES } from "./leagues";
import { LEAGUE_NAMES } from "./player-aggregation";

describe("league names", () => {
  it("spells each tracked league once, wherever a table names it", () => {
    for (const league of LEAGUES) expect(LEAGUE_NAMES[league.code]).toBe(league.name);
    expect(TOP_5_LEAGUES).toEqual(LEAGUES.map((l) => l.name));
  });

  it("maps Transfermarkt's variants to that spelling and leaves other names alone", () => {
    expect(canonicalLeagueName("LaLiga")).toBe("La Liga");
    expect(canonicalLeagueName("laliga")).toBe("La Liga");
    expect(canonicalLeagueName("La Liga")).toBe("La Liga");
    expect(canonicalLeagueName("Premier League")).toBe("Premier League");
    for (const other of ["LaLiga2", "Eredivisie", "Série A", "all", "top5", ""]) {
      expect(canonicalLeagueName(other)).toBe(other);
    }
  });

  // The committed data is what every page compares against, so a scraper or table that
  // reintroduces a variant fails here rather than as an empty filter in production.
  it.each(["minutes-value.json", "squad-values.json"])("committed data/%s uses it", (file) => {
    const names = new Set<string>();
    JSON.parse(readFileSync(join(process.cwd(), "data", file), "utf-8"), (key, value) => {
      if ((key === "league" || key === "competitionName") && typeof value === "string") {
        names.add(value);
      }
      return value;
    });
    expect([...names].filter((name) => canonicalLeagueName(name) !== name)).toEqual([]);
  });
});
