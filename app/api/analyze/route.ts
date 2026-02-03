import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import type { TeamStats, PeriodAnalysis, AnalysisResult } from "@/app/types";
import { BASE_URL } from "@/lib/constants";
import { fetchPage } from "@/lib/fetch";

const PERIODS = [20, 15, 10, 5];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTeamRow($: cheerio.CheerioAPI, row: any): TeamStats | null {
  const cells = $(row).find("> td");
  if (cells.length < 11) return null;

  const nameCell = $(cells[1]);
  const clubLink = nameCell.find(".inline-table a").first();
  const name = clubLink.attr("title") || nameCell.find(".hauptlink a").first().text().trim();
  const league = nameCell.find("table tr:last-child a").text().trim();
  const leaguePosition = parseInt($(cells[2]).text().trim()) || 0;
  const country = $(cells[3]).find("img").attr("title") || "";

  // Extract logo URL and club URL
  const logoImg = nameCell.find(".inline-table img").first();
  const logoUrl = (logoImg.attr("src") || "").replace("/verysmall/", "/head/");
  const clubUrl = clubLink.attr("href") || "";
  const clubIdMatch = clubUrl.match(/\/verein\/(\d+)/);
  const clubId = clubIdMatch ? clubIdMatch[1] : "";

  const wins = parseInt($(cells[5]).text().trim()) || 0;
  const draws = parseInt($(cells[6]).text().trim()) || 0;
  const losses = parseInt($(cells[7]).text().trim()) || 0;

  const goalsText = $(cells[8]).text().trim();
  const [scored, conceded] = goalsText.split(":").map((n) => parseInt(n) || 0);

  const goalDiff = parseInt($(cells[9]).text().trim()) || 0;
  const points = parseInt($(cells[10]).text().trim()) || 0;

  if (!name) return null;
  return { name, league, country, leaguePosition, wins, draws, losses, goalsScored: scored, goalsConceded: conceded, goalDiff, points, logoUrl, clubUrl, clubId };
}

async function fetchAllTeams(period: number): Promise<TeamStats[]> {
  const teams: TeamStats[] = [];
  const url = `${BASE_URL}/verein-statistik/formtabelle/statistik/stat/ajax/yw1/sortierung/best/letzte/${period}/selectedOptionKey/6/plus/1/sort/punkte.desc`;

  // Fetch all pages in parallel for speed
  const pageUrls = Array.from({ length: 4 }, (_, i) => {
    const page = i + 1;
    return page === 1 ? url : `${url}/page/${page}`;
  });

  const results = await Promise.allSettled(pageUrls.map(fetchPage));

  for (const result of results) {
    if (result.status === "fulfilled") {
      const $ = cheerio.load(result.value);
      $("table.items > tbody > tr").each((_, row) => {
        const team = parseTeamRow($, row);
        if (team?.name) teams.push(team);
      });
    }
  }
  return teams;
}

function getLeaders(teams: TeamStats[]) {
  const maxPoints = Math.max(...teams.map((t) => t.points));
  const maxGoalDiff = Math.max(...teams.map((t) => t.goalDiff));
  const maxGoalsScored = Math.max(...teams.map((t) => t.goalsScored));
  const minGoalsConceded = Math.min(...teams.map((t) => t.goalsConceded));
  const minPoints = Math.min(...teams.map((t) => t.points));
  const minGoalDiff = Math.min(...teams.map((t) => t.goalDiff));
  const minGoalsScored = Math.min(...teams.map((t) => t.goalsScored));
  const maxGoalsConceded = Math.max(...teams.map((t) => t.goalsConceded));

  return {
    top: {
      points: { value: maxPoints, teams: teams.filter((t) => t.points === maxPoints).map((t) => t.name) },
      goalDiff: { value: maxGoalDiff, teams: teams.filter((t) => t.goalDiff === maxGoalDiff).map((t) => t.name) },
      goalsScored: { value: maxGoalsScored, teams: teams.filter((t) => t.goalsScored === maxGoalsScored).map((t) => t.name) },
      goalsConceded: { value: minGoalsConceded, teams: teams.filter((t) => t.goalsConceded === minGoalsConceded).map((t) => t.name) },
    },
    bottom: {
      points: { value: minPoints, teams: teams.filter((t) => t.points === minPoints).map((t) => t.name) },
      goalDiff: { value: minGoalDiff, teams: teams.filter((t) => t.goalDiff === minGoalDiff).map((t) => t.name) },
      goalsScored: { value: minGoalsScored, teams: teams.filter((t) => t.goalsScored === minGoalsScored).map((t) => t.name) },
      goalsConceded: { value: maxGoalsConceded, teams: teams.filter((t) => t.goalsConceded === maxGoalsConceded).map((t) => t.name) },
    },
  };
}

function findQualifiedTeams(teams: TeamStats[], type: "top" | "bottom") {
  const leaders = getLeaders(teams);
  const data = leaders[type];
  const results: { team: TeamStats; criteria: string[] }[] = [];

  for (const team of teams) {
    const criteria: string[] = [];
    if (type === "top") {
      if (data.points.teams.includes(team.name)) criteria.push("Most Points");
      if (data.goalDiff.teams.includes(team.name)) criteria.push("Best GD");
      if (data.goalsScored.teams.includes(team.name)) criteria.push("Most Goals");
      if (data.goalsConceded.teams.includes(team.name)) criteria.push("Best Defense");
    } else {
      if (data.points.teams.includes(team.name)) criteria.push("Least Points");
      if (data.goalDiff.teams.includes(team.name)) criteria.push("Worst GD");
      if (data.goalsScored.teams.includes(team.name)) criteria.push("Least Goals");
      if (data.goalsConceded.teams.includes(team.name)) criteria.push("Worst Defense");
    }
    if (criteria.length >= 2) results.push({ team, criteria });
  }
  return results;
}

const getAnalysis = unstable_cache(
  async (): Promise<AnalysisResult> => {
    // Fetch all periods in parallel
    const allTeamsPerPeriod = await Promise.all(PERIODS.map(fetchAllTeams));

    const analysis: PeriodAnalysis[] = [];
    let matchedPeriod: number | null = null;

    for (let i = 0; i < PERIODS.length; i++) {
      const period = PERIODS[i];
      const teams = allTeamsPerPeriod[i];
      if (teams.length === 0) continue;

      const leaders = getLeaders(teams);
      const topTeams = findQualifiedTeams(teams, "top");
      const bottomTeams = findQualifiedTeams(teams, "bottom");

      const periodData: PeriodAnalysis = {
        period,
        teamsAnalyzed: teams.length,
        leaders,
        topTeams: topTeams.map(({ team, criteria }) => ({
          name: team.name,
          league: team.league,
          country: team.country,
          leaguePosition: team.leaguePosition,
          criteria,
          stats: { points: team.points, goalDiff: team.goalDiff, goalsScored: team.goalsScored, goalsConceded: team.goalsConceded },
          logoUrl: team.logoUrl,
          clubUrl: team.clubUrl,
          clubId: team.clubId,
        })),
        bottomTeams: bottomTeams.map(({ team, criteria }) => ({
          name: team.name,
          league: team.league,
          country: team.country,
          leaguePosition: team.leaguePosition,
          criteria,
          stats: { points: team.points, goalDiff: team.goalDiff, goalsScored: team.goalsScored, goalsConceded: team.goalsConceded },
          logoUrl: team.logoUrl,
          clubUrl: team.clubUrl,
          clubId: team.clubId,
        })),
        hasMatch: topTeams.length > 0 && bottomTeams.length > 0,
      };

      analysis.push(periodData);

      if (periodData.hasMatch && !matchedPeriod) {
        matchedPeriod = period;
      }
    }

    if (matchedPeriod) {
      return { success: true, matchedPeriod, analysis };
    }
    return { success: false, matchedPeriod: null, analysis };
  },
  ["form-analysis"],
  { revalidate: 43200, tags: ["form-analysis"] }
);

export async function GET() {
  try {
    const result = await getAnalysis();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing form:", error);
    return NextResponse.json({ error: "Failed to analyze form data" }, { status: 500 });
  }
}
