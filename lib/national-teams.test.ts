import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { MinutesValuePlayer, NationalTeamValue } from "@/app/types";
import { nationalTeamSlug } from "./format";
import { nationPlayers, parseExtendedSquad, valueRanks, type SquadEntry } from "./national-teams";

// France's extended squad in the detailed view, captured 2026-10. Refresh the
// fixture when Transfermarkt changes its markup; the assertions survive a refresh.
const page = parseExtendedSquad(
  readFileSync(
    fileURLToPath(
      new URL("./transfermarkt/__fixtures__/extended-squad-france.html", import.meta.url),
    ),
    "utf8",
  ),
);
const named = (name: string) => page.players.find((p) => p.name === name)!;

describe("parseExtendedSquad — France", () => {
  it("lists the whole extended squad and singles out the call-up", () => {
    expect(page.players).toHaveLength(44);
    expect(page.players.filter((p) => p.calledUp)).toHaveLength(23);
  });

  it("reads caps, club, age, and the value with its latest change", () => {
    expect(named("Maxence Lacroix")).toMatchObject({
      playerId: "434224",
      position: "Centre-Back",
      age: 26,
      club: "Chelsea FC",
      caps: 9,
      goals: 0,
      marketValue: 50_000_000,
      previousValue: 40_000_000,
      calledUp: true,
    });
    // In a squad without playing still counts: Risser's last match is one he sat out.
    expect(named("Robin Risser")).toMatchObject({
      caps: 0,
      calledUp: false,
      lastMatch: "2026-07-18",
    });
  });

  it("reads injuries, with or without a return date, and the captain", () => {
    expect(named("Kylian Mbappé")).toMatchObject({
      captain: true,
      injury: { name: "Tendon irritation", returnDate: "06/10/2026" },
    });
    expect(named("Ibrahima Konaté").injury).toEqual({ name: "Ligament injury", returnDate: "" });
    expect(named("Michael Olise")).toMatchObject({ captain: false, injury: null });
  });

  it("reads the header's confederation and titles", () => {
    expect(page.confederation).toBe("UEFA");
    expect(page.titles[0]).toMatchObject({ name: "World Cup winner", count: 2 });
    expect(page.titles[0].imageUrl).toMatch(/\/erfolge\/header\/101\.png/);
  });
});

const nation = (id: string, averageValue: number, confederation = "UEFA", extended?: number) =>
  ({
    id,
    name: id,
    landId: Number(id),
    confederation,
    averageValue,
    extendedAverageValue: extended,
  }) as NationalTeamValue;

describe("valueRanks", () => {
  const teams = [
    nation("1", 60, "UEFA", 40),
    nation("2", 50, "UEFA", 45),
    nation("3", 50, "CAF"),
    nation("4", 40),
  ];

  it("places a call-up by value per player, ties sharing a place", () => {
    expect(valueRanks(teams, teams[1])).toMatchObject({ world: 2, confederation: 2 });
    expect(valueRanks(teams, teams[2])).toMatchObject({ world: 2, confederation: 1 });
    expect(valueRanks(teams, teams[3])).toMatchObject({ world: 4, confederation: 3 });
  });

  it("places an extended squad among the nations whose extended squad is valued", () => {
    expect(valueRanks(teams, teams[0]).extended).toEqual({ place: 2, of: 2 });
    expect(valueRanks(teams, teams[1]).extended).toEqual({ place: 1, of: 2 });
    expect(valueRanks(teams, teams[3]).extended).toBeNull();
  });

  it("has no confederation place for a nation without one", () => {
    expect(valueRanks(teams, nation("5", 10, "")).confederation).toBeNull();
  });
});

describe("nationPlayers", () => {
  const france = { id: "3377", landId: 50 };
  const flag = (landId: number) => `https://tmssl.akamaized.net/images/flagge/head/${landId}.png`;
  const player = (playerId: string, landId: number, extra: Partial<MinutesValuePlayer> = {}) =>
    ({
      playerId,
      name: playerId,
      nationality: `Land ${landId}`,
      nationalityFlagUrl: flag(landId),
      marketValue: 30_000_000,
      intlCareerCaps: 0,
      goals: 0,
      assists: 0,
      minutes: 900,
      ...extra,
    }) as MinutesValuePlayer;
  const entry = (playerId: string, calledUp: boolean, marketValue: number, lastMatch = "") =>
    ({
      playerId,
      profileUrl: `/x/profil/spieler/${playerId}`,
      calledUp,
      marketValue,
      lastMatch,
    }) as SquadEntry;
  const squad = [
    entry("called", true, 80_000_000),
    entry("cheap", true, 10_000_000),
    entry("recent", false, 50_000_000, "2026-03-26"),
  ];
  const outsiders = (pool: MinutesValuePlayer[]) =>
    nationPlayers(france, squad, pool).outsiders.map((p) => p.playerId);

  it("splits off the call-up, linking untracked players to Transfermarkt", () => {
    const { callUp } = nationPlayers(france, squad, [player("called", 50)]);
    expect(callUp.map((p) => [p.playerId, p.tracked])).toEqual([
      ["called", true],
      ["cheap", false],
    ]);
    expect(callUp[1].href).toBe("https://www.transfermarkt.com/x/profil/spieler/cheap");
  });

  it("lists everyone else the nation could pick in one list, by value", () => {
    const pool = [
      player("called", 50),
      player("uncapped", 50, { marketValue: 70_000_000 }),
      player("dropped", 50, { intlCareerCaps: 137, nationalTeamId: "3377" }),
      player("italian", 75),
    ];
    expect(outsiders(pool)).toEqual(["uncapped", "recent", "dropped"]);
  });

  it("places each outsider within the call-up, and says how lately he was picked", () => {
    const pool = [
      player("dropped", 50, { intlCareerCaps: 5, lastIntlGame: "2024-03-22" }),
      player("uncapped", 50),
    ];
    const [recent, dropped, uncapped] = nationPlayers(france, squad, pool).outsiders;
    expect(recent).toMatchObject({ status: "recent", callUpPlace: 2, lastCalledUp: "2026-03-26" });
    expect(dropped).toMatchObject({ status: "lapsed", callUpPlace: 2, lastCalledUp: "2024-03-22" });
    expect(uncapped).toMatchObject({ status: "uncapped", callUpPlace: 2, lastCalledUp: null });
  });

  it("adds uncapped dual nationals, marked with their first nationality", () => {
    const [dual] = nationPlayers(
      france,
      [],
      [player("dual", 136, { secondNationalityId: 50 })],
    ).outsiders;
    expect(dual.firstNationality).toEqual({ name: "Land 136", flagUrl: flag(136) });
  });

  it("leaves out anyone capped by another nation", () => {
    const pool = [
      player("switched", 50, { intlCareerCaps: 33, nationalTeamId: "3575" }),
      player("capped dual", 136, { secondNationalityId: 50, intlCareerCaps: 4 }),
    ];
    expect(outsiders(pool)).toEqual(["recent"]);
  });
});

describe("nationalTeamSlug", () => {
  it("spells Transfermarkt's names as plain URL segments", () => {
    expect(nationalTeamSlug("South Korea")).toBe("south-korea");
    expect(nationalTeamSlug("Curaçao")).toBe("curacao");
    expect(nationalTeamSlug("São Tomé and Príncipe")).toBe("sao-tome-and-principe");
    expect(nationalTeamSlug("Bosnia-Herzegovina")).toBe("bosnia-herzegovina");
  });
});
