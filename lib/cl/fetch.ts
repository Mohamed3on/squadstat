// Champions League scraper. Two Transfermarkt pages, cached separately because
// they move at different speeds: squad values drift daily, results land on
// matchday nights. Both go through fetchPage, so relay routing, the concurrency
// limiter and the retry ladder are already handled.

import { unstable_cache } from "next/cache";
import * as cheerio from "cheerio";
import { fetchPage } from "@/lib/fetch";
import { parseMarketValue } from "@/lib/parse-market-value";
import { tmCurrentSeasonId } from "@/lib/player-aggregation";
import type { ClClub, ClFixture, ClKoLeg, ClRound, ClSeason, ClTableRow, Kick } from "./types";

const BASE = "https://www.transfermarkt.com/uefa-champions-league";
const participantsUrl = () => `${BASE}/teilnehmer/pokalwettbewerb/CL/saison_id/${season()}`;
const scheduleUrl = () => `${BASE}/gesamtspielplan/pokalwettbewerb/CL/saison_id/${season()}`;

// The CL season starts in September, so TM's Aug 1 rollover always names the
// right one — no coverage-based season selection needed (see lib/season-selection.ts,
// which exists because the *domestic* pool straddles the flip).
const season = () => tmCurrentSeasonId();

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "Tue 08/09/2026 6:45 PM" — the header row that precedes each kickoff group.
const DT = /([A-Za-z]{3})\s+(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s?(AM|PM)/i;

function parseKick(text: string): Kick | null {
  const m = text.match(DT);
  if (!m) return null;
  let h = parseInt(m[5], 10);
  if (/PM/i.test(m[7]) && h !== 12) h += 12;
  if (/AM/i.test(m[7]) && h === 12) h = 0;
  return {
    kickoff: +`${m[4]}${m[3]}${m[2]}${String(h).padStart(2, "0")}${m[6]}`,
    dow: m[1],
    dayLabel: `${parseInt(m[2], 10)} ${MONTH[parseInt(m[3], 10) - 1]}`,
    timeLabel: `${m[5]}:${m[6]} ${m[7].toUpperCase()}`,
  };
}

/** TM club id from the first `/verein/` link in a cell — the join key between
 *  the two pages, which spell the same club differently ("PSG" vs "Paris Saint-Germain"). */
function clubIn(cell: cheerio.Cheerio<any>): { id: string; name: string } | null {
  const link = cell.find("a[href*='/verein/']").first();
  const id = link.attr("href")?.match(/\/verein\/(\d+)/)?.[1];
  return id ? { id, name: link.text().trim() } : null;
}

const cellsOf = ($: cheerio.CheerioAPI, tr: any): string[] =>
  $(tr)
    .find("td")
    .map((_, c) => $(c).text().trim().replace(/\s+/g, " "))
    .get();

// --- participants: the 36 clubs and what their squads are worth ---

async function fetchClubs(): Promise<ClClub[]> {
  const $ = cheerio.load(await fetchPage(participantsUrl(), 86400));
  const clubs: ClClub[] = [];
  $("table.items")
    .first()
    .find("tbody > tr")
    .each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 6) return;
      const club = clubIn(tds.eq(1));
      const euros = parseMarketValue(tds.eq(4).text().trim());
      if (!club || euros <= 0) return;
      clubs.push({
        id: club.id,
        name: club.name,
        squad: parseInt(tds.eq(2).text().trim(), 10) || 0,
        avgAge: parseFloat(tds.eq(3).text().trim()) || 0,
        mv: euros / 1_000_000,
      });
    });
  if (clubs.length < 30) {
    throw new Error(`[cl] participants parse found only ${clubs.length} clubs`);
  }
  return clubs;
}

// --- schedule page: league table + all 144 fixtures + the knockout bracket ---

function parseTable($: cheerio.CheerioAPI): ClTableRow[] {
  const box = $(".content-box-headline")
    .filter((_, el) => /^Group\b/.test($(el).text().trim()))
    .closest(".box");
  const rows: ClTableRow[] = [];
  box.find("table.items tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 7) return;
    const club = clubIn(tds.eq(2));
    if (!club) return; // header row
    const c = cellsOf($, tr);
    const goals = c[5]?.match(/^(\d+):(\d+)$/);
    rows.push({
      id: club.id,
      short: club.name,
      rank: parseInt(c[0], 10) || 0,
      order: rows.length,
      pl: parseInt(c[3], 10) || 0,
      gd: parseInt(c[4], 10) || 0,
      gf: goals ? parseInt(goals[1], 10) : 0,
      pts: parseInt(c[6], 10) || 0,
    });
  });
  return rows;
}

function parseFixtures($: cheerio.CheerioAPI): ClFixture[] {
  const table = $("td.hauptlink")
    .filter((_, el) => $(el).text().trim() === "Schedule")
    .first()
    .closest("table");
  const out: Omit<ClFixture, "matchday">[] = [];
  let cur: Kick | null = null;

  table.find("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    const c = cellsOf($, tr);
    if (tds.length === 1) {
      const k = parseKick(c[0]);
      if (k) cur = k;
      return;
    }
    if (tds.length !== 6 || !cur) return;
    const score = c[3]?.match(/^(\d+):(\d+)$/);
    if (!score && c[3] !== "-:-") return; // not a fixture row
    const home = clubIn(tds.eq(1));
    const away = clubIn(tds.eq(5));
    if (!home || !away) return;
    out.push({
      homeId: home.id,
      awayId: away.id,
      home: home.name,
      away: away.name,
      hs: score ? parseInt(score[1], 10) : null,
      as: score ? parseInt(score[2], 10) : null,
      played: !!score,
      ...cur,
    });
  });

  // TM lists fixtures chronologically without matchday labels. Each of the eight
  // matchdays is 18 games over one or two dates, so walk date-blocks and start a
  // new matchday once the current one is full — which never splits a date.
  out.sort((a, b) => a.kickoff - b.kickoff);
  const perMatchday = Math.max(1, Math.round(out.length / 8));
  const fixtures: ClFixture[] = [];
  let matchday = 1;
  let count = 0;
  let day = "";
  for (const f of out) {
    if (f.dayLabel !== day) {
      day = f.dayLabel;
      if (count >= perMatchday) {
        matchday++;
        count = 0;
      }
    }
    fixtures.push({ ...f, matchday });
    count++;
  }
  return fixtures;
}

// TM labels knockout ties "IR 1"…"Ro16 8"/"QF 1"/"SF 1"/"FI".
function parseKoLabel(label: string): { round: ClRound; num: number } | null {
  const m = label.trim().match(/^(IR|Ro16|QF|SF|FI)\s*(\d+)?$/i);
  if (!m) return null;
  const tag = m[1].toUpperCase();
  const num = m[2] ? parseInt(m[2], 10) : 1;
  if (tag === "IR") return { round: "PO", num };
  if (tag === "RO16") return { round: "R16", num };
  if (tag === "FI") return { round: "F", num: 1 };
  return { round: tag as "QF" | "SF", num };
}

function parseKo($: cheerio.CheerioAPI): ClKoLeg[] {
  const box = $(".content-box-headline")
    .filter((_, el) => /knockout/i.test($(el).text().trim()))
    .closest(".box");
  const out: ClKoLeg[] = [];
  let cur: Kick | null = null;
  let leg: 1 | 2 = 1;

  box.find("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    const c = cellsOf($, tr);
    if (tds.length === 1) {
      const k = parseKick(c[0]);
      if (k) cur = k;
      else if (/2nd leg/i.test(c[0])) leg = 2;
      else if (/1st leg/i.test(c[0]) || /^final$/i.test(c[0].trim())) leg = 1;
      return;
    }
    if (tds.length < 8) return;
    const info = parseKoLabel(c[2]);
    if (!info) return;
    const home = clubIn(tds.eq(3));
    const away = clubIn(tds.eq(7));
    const score = c[5]?.match(/^(\d+):(\d+)/);
    out.push({
      ...info,
      leg,
      homeId: home?.id ?? null,
      awayId: away?.id ?? null,
      hs: score ? parseInt(score[1], 10) : null,
      as: score ? parseInt(score[2], 10) : null,
      aet: /a\.?e\.?t/i.test(c[5] ?? ""),
      pens: /pen/i.test(c[5] ?? ""),
      ...(cur ?? { kickoff: 0, dow: "", dayLabel: "", timeLabel: "" }),
    });
  });
  return out;
}

async function fetchSeason(): Promise<ClSeason> {
  const html = await fetchPage(scheduleUrl(), 21600);
  const $ = cheerio.load(html);
  const label =
    $(".content-box-headline")
      .first()
      .text()
      .match(/(\d{2}\/\d{2})/)?.[1] ?? "";
  const table = parseTable($);
  const fixtures = parseFixtures($);
  if (table.length < 30 || fixtures.length < 100) {
    throw new Error(`[cl] schedule parse: ${table.length} table rows, ${fixtures.length} fixtures`);
  }
  return { label, fetchedAt: Date.now(), table, fixtures, ko: parseKo($) };
}

// Squad values drift daily; results want to land the same evening a matchday is
// played. Separate tags so the header refresh button can bust either.
export const getClClubs = unstable_cache(fetchClubs, ["cl-clubs"], {
  revalidate: 86400,
  tags: ["cl-values"],
});

export const getClSeason = unstable_cache(fetchSeason, ["cl-season"], {
  revalidate: 21600,
  tags: ["cl-results"],
});

/** Parsers exposed for the fixture-backed tests in lib/cl/model.test.ts. */
export const __parsers = { parseTable, parseFixtures, parseKo };
