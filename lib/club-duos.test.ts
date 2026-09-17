import { describe, expect, it } from "vitest";
import type { MinutesValuePlayer } from "@/app/types";
import { rankClubDuos } from "./club-duos";

const player = (
  name: string,
  clubId: string,
  stats?: { goals?: number; assists?: number; penaltyGoals?: number; minutes?: number },
  club = `Club ${clubId}`,
): MinutesValuePlayer =>
  ({
    playerId: name,
    name,
    club,
    league: "Premier League",
    clubLogoUrl: `https://tmssl.akamaized.net/images/wappen/head/${clubId}.png`,
    goals: 0,
    assists: 0,
    currentClubStats: stats && {
      goals: 0,
      assists: 0,
      penaltyGoals: 0,
      minutes: 900,
      ...stats,
    },
  }) as MinutesValuePlayer;

const names = (players: MinutesValuePlayer[], size: 2 | 3, includePenalties = false) =>
  rankClubDuos(players, size, { includePenalties }).map((d) => d.members.map((m) => m.player.name));

describe("rankClubDuos", () => {
  const squads = [
    player("A1", "1", { goals: 9 }),
    player("A2", "1", { goals: 5 }),
    player("A3", "1", { goals: 4 }),
    player("A4", "1", { goals: 1 }),
    player("B1", "2", { goals: 8 }),
    player("B2", "2", { goals: 8 }),
    player("B3", "2", { goals: 1 }),
    player("B4", "2", { goals: 1 }),
    player("C1", "3", { goals: 3 }),
    player("C2", "3", { goals: 3 }),
    player("C3", "3", { goals: 3 }),
    player("C4", "3", { goals: 2 }),
  ];

  it("takes each club's top two or three, best club first", () => {
    expect(names(squads, 2)).toEqual([
      ["B1", "B2"],
      ["A1", "A2"],
      ["C1", "C2"],
    ]);
    expect(names(squads, 3)).toEqual([
      ["A1", "A2", "A3"],
      ["B1", "B2", "B3"],
      ["C1", "C2", "C3"],
    ]);
    expect(rankClubDuos(squads, 3)[0]).toMatchObject({ clubId: "1", club: "Club 1", total: 18 });
  });

  it("ignores players without current-club stats or a club id", () => {
    const noStats = { ...player("Transfer", "1"), goals: 20, assists: 10 };
    const noClub = { ...player("Nowhere", "1", { goals: 20 }), clubLogoUrl: "" };
    expect(names([player("A", "1", { goals: 1 }), noStats, noClub], 2)).toEqual([]);
    expect(rankClubDuos([noStats], 2)).toEqual([]);
  });

  it("drops penalty goals unless penalties are included", () => {
    const players = [
      player("Taker", "1", { goals: 5, penaltyGoals: 3 }),
      player("Mate", "1", { goals: 1 }),
      player("X", "2", { goals: 3 }),
      player("Y", "2", { goals: 1 }),
    ];
    expect(rankClubDuos(players, 2).map((d) => d.total)).toEqual([4, 3]);
    expect(rankClubDuos(players, 2, { includePenalties: true }).map((d) => d.total)).toEqual([
      6, 4,
    ]);
  });

  it("needs a goal or assist from every member", () => {
    const players = [
      player("A", "1", { goals: 2 }),
      player("B", "1", { assists: 1 }),
      player("Blank", "1", { minutes: 1200 }),
    ];
    expect(names(players, 2)).toEqual([["A", "B"]]);
    expect(names(players, 3)).toEqual([]);
  });

  it("breaks ties on fewer club minutes, then name", () => {
    const withinClub = [
      player("A", "1", { goals: 5 }),
      player("Slow", "1", { goals: 3, minutes: 1000 }),
      player("Quick", "1", { goals: 3, minutes: 400 }),
    ];
    expect(names(withinClub, 2)).toEqual([["A", "Quick"]]);

    const acrossClubs = [
      player("Z1", "1", { goals: 2, minutes: 900 }, "Zulu"),
      player("Z2", "1", { goals: 2, minutes: 900 }, "Zulu"),
      player("A1", "2", { goals: 2, minutes: 900 }, "Alpha"),
      player("A2", "2", { goals: 2, minutes: 900 }, "Alpha"),
      player("F1", "3", { goals: 2, minutes: 100 }, "Fast"),
      player("F2", "3", { goals: 2, minutes: 100 }, "Fast"),
    ];
    expect(rankClubDuos(acrossClubs, 2).map((d) => d.club)).toEqual(["Fast", "Alpha", "Zulu"]);
  });

  it("keeps clubs with the same name apart by id", () => {
    const players = [
      player("A", "1", { goals: 2 }, "United"),
      player("B", "1", { goals: 1 }, "United"),
      player("C", "2", { goals: 2 }, "United"),
      player("D", "2", { goals: 1 }, "United"),
    ];
    expect(rankClubDuos(players, 2).map((d) => d.clubId)).toEqual(["1", "2"]);
  });
});
