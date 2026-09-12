import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { describe, expect, it } from "vitest";
import type { Matchday } from "@/app/types";
import { latestMatchday, parseMatchdays } from "./team-form";

// The Premier League competition page, captured 2026-09-12 with matchday 4 part-played.
const html = readFileSync(
  fileURLToPath(
    new URL("./transfermarkt/__fixtures__/startseite-premier-league.html", import.meta.url),
  ),
  "utf8",
);
const rounds = parseMatchdays(cheerio.load(html));

describe("parseMatchdays — Premier League competition page", () => {
  it("reads the last, current and next matchday, ten games each", () => {
    expect(rounds.map((r) => r.number)).toEqual([3, 4, 5]);
    expect(rounds.map((r) => r.games.length)).toEqual([10, 10, 10]);
  });

  it("carries each date down to the games TM prints it once for", () => {
    expect(rounds[1].games.map((g) => g.date)).toEqual([
      ...Array(7).fill("2026-09-12"),
      "2026-09-13",
      "2026-09-13",
      "2026-09-14",
    ]);
  });

  it("tells a result from a kickoff time", () => {
    expect(rounds[1].games[0]).toEqual({
      date: "2026-09-12",
      home: { id: "989", name: "Bournemouth" },
      away: { id: "1148", name: "Brentford" },
      status: "finished",
      result: "2:2",
    });
    expect(rounds[1].games[9]).toMatchObject({ status: "scheduled", result: "9:00 PM" });
  });

  it("reads a game in play off TM's live result", () => {
    const $ = cheerio.load(html);
    $("#spieltagtabs-2 .matchresult").first().attr("class", "matchresult liveresult");
    expect(parseMatchdays($)[1].games[0]).toMatchObject({ status: "live", result: "2:2" });
  });
});

describe("latestMatchday", () => {
  const unplayed = (r: Matchday): Matchday => ({
    ...r,
    games: r.games.map((g) => ({ ...g, status: "scheduled" })),
  });

  it("shows the current round once it has a result in", () => {
    expect(latestMatchday(rounds)?.number).toBe(4);
  });

  it("stays on the last round until the current one has a result", () => {
    expect(latestMatchday([rounds[0], unplayed(rounds[1]), rounds[2]])?.number).toBe(3);
  });

  it("isn't pulled ahead by a game brought forward from a later round", () => {
    // La Liga, Sep 2026: matchday 6's Real Sociedad–Celta was played on Sep 3.
    const [first, ...rest] = rounds[2].games;
    const early = { ...first, date: "2026-09-03", status: "finished" as const, result: "0:0" };
    expect(
      latestMatchday([rounds[0], rounds[1], { ...rounds[2], games: [early, ...rest] }])?.number,
    ).toBe(4);
  });

  it("shows the first fixtures before any game is played", () => {
    expect(latestMatchday(rounds.map(unplayed))?.number).toBe(3);
  });
});
