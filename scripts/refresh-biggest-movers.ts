import * as cheerio from "cheerio";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { parseMarketValue } from "@/lib/parse-market-value";
import type { MarketValueMover, MarketValueMoversResult } from "@/app/types";

const AJAX_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
  Accept: "*/*",
  "X-Requested-With": "XMLHttpRequest",
  "sec-ch-ua-platform": '"macOS"',
  "sec-ch-ua": '"Chromium";v="145", "Not:A-Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
};

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

type Direction = "losers" | "winners";

interface DirectionConfig {
  urlPath: string;
  sortParam: string;
  ageClass: string;
  label: string;
  outFile: string;
}

const DIRECTION_CONFIG: Record<Direction, DirectionConfig> = {
  losers: {
    urlPath: "marktwertverluste",
    sortParam: "aenderung",
    ageClass: "alle",
    label: "biggest-losers",
    outFile: "biggest-losers.json",
  },
  winners: {
    urlPath: "marktwertspruenge",
    sortParam: "aenderung.desc",
    ageClass: "o23",
    label: "biggest-winners",
    outFile: "biggest-winners.json",
  },
};

function buildUrl(date: string, cfg: DirectionConfig): string {
  return `https://www.transfermarkt.com/spieler-statistik/${cfg.urlPath}/marktwertetop/plus/ajax/yw1/datum/${date}/ausrichtung/alle/spielerposition_id//altersklasse/${cfg.ageClass}/land_id/0/yt0/Show/0//sort/${cfg.sortParam}?ajax=yw1`;
}

function buildReferer(date: string, cfg: DirectionConfig): string {
  return `https://www.transfermarkt.com/spieler-statistik/${cfg.urlPath}/marktwertetop/plus/0/galerie/0?datum=${date}&ausrichtung=alle&spielerposition_id=&altersklasse=${cfg.ageClass}&land_id=0&yt0=Show`;
}

async function fetchWithRetry(url: string, referer: string, label: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      headers: { ...AJAX_HEADERS, Referer: referer },
    });
    const html = await response.text();
    if (html.length > 500) return html;
    console.warn(`[${label}] Rate limited (${html.length}b), retry ${attempt + 1}/${MAX_RETRIES}`);
    if (attempt < MAX_RETRIES - 1) {
      const jitter = Math.random() * 500;
      await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** attempt + jitter));
    }
  }
  throw new Error(`[${label}] Failed after ${MAX_RETRIES} retries: ${url}`);
}

function parsePeriodMovers(html: string, date: string): MarketValueMover[] {
  const $ = cheerio.load(html);
  const players: MarketValueMover[] = [];

  $("table.items tbody tr").each((_, row) => {
    const $row = $(row);
    const cells = $row.children("td");
    if (cells.length < 8) return;

    const $inline = $row.find("table.inline-table");
    const $nameLink = $inline.find("td.hauptlink a").first();
    const name = $nameLink.text().trim();
    const href = $nameLink.attr("href") || "";
    const playerIdMatch = href.match(/\/spieler\/(\d+)/);
    const playerId = playerIdMatch ? playerIdMatch[1] : "";
    const position = $inline.find("tr").last().find("td").last().text().trim();

    const $img = $inline.find("img").first();
    const imageUrl = $img.attr("data-src") || $img.attr("src") || "";

    const $clubCell = cells.eq(2);
    const club = $clubCell.find("a").attr("title") || "";
    const clubLogoUrl = $clubCell.find("img").attr("data-src") || $clubCell.find("img").attr("src") || "";

    const nationality = cells.eq(3).find("img").first().attr("title") || "";
    const age = parseInt(cells.eq(4).text().trim(), 10) || 0;

    const $valueCell = cells.eq(5);
    const currentValueText = $valueCell.text().replace(/\u00a0/g, "").trim();
    const currentValue = parseMarketValue(currentValueText);
    const prevTitle = $valueCell.find("span").attr("title") || "";
    const prevMatch = prevTitle.match(/€[\d.]+[kmbn]*/i);
    const previousValue = prevMatch ? parseMarketValue(prevMatch[0]) : 0;

    const relText = cells.eq(6).text().trim();
    const relativeChange = Math.abs(parseFloat(relText.replace(/[^0-9.\-]/g, "")) || 0);

    const diffText = cells.eq(7).text().trim();
    const absoluteChange = Math.abs(parseMarketValue(diffText.replace(/[+-]/g, "")));

    if (name && playerId) {
      players.push({
        name, position, age, club, clubLogoUrl, nationality,
        currentValue, previousValue, absoluteChange, relativeChange,
        imageUrl, profileUrl: `https://www.transfermarkt.com${href}`,
        playerId, period: date, reason: "",
      });
    }
  });

  return players;
}

function selectPeriodMovers(players: MarketValueMover[], direction: Direction): MarketValueMover[] {
  if (players.length === 0) return [];
  const noun = direction === "losers" ? "loss" : "gain";

  const sorted = [...players].sort((a, b) => b.absoluteChange - a.absoluteChange);
  sorted[0].reason = `Biggest absolute ${noun} (${formatVal(sorted[0].absoluteChange)}). Relative: ${sorted[0].relativeChange.toFixed(1)}% → sets initial threshold.`;
  const selected: MarketValueMover[] = [sorted[0]];
  let highestRelPct = sorted[0].relativeChange;

  let i = 1;
  while (i < sorted.length) {
    const tierVal = sorted[i].absoluteChange;
    const tier: MarketValueMover[] = [];
    while (i < sorted.length && sorted[i].absoluteChange === tierVal) {
      tier.push(sorted[i]);
      i++;
    }
    const qualifying = tier.filter((p) => p.relativeChange > highestRelPct);
    if (qualifying.length === 0) break;

    for (const p of qualifying) {
      p.reason = `Tier ${formatVal(tierVal)} ${noun}: ${p.relativeChange.toFixed(1)}% relative > ${highestRelPct.toFixed(1)}% threshold.`;
    }
    selected.push(...qualifying);
    const maxRelInQualifying = Math.max(...qualifying.map((p) => p.relativeChange));
    highestRelPct = Math.max(highestRelPct, maxRelInQualifying);
  }

  return selected;
}

function formatVal(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v}`;
}

function getPeriodDates(): string[] {
  const dates: string[] = [];
  let year = 2026;
  let month = 1;
  for (let i = 0; i < 24; i++) {
    dates.push(`${year}-${String(month).padStart(2, "0")}-01`);
    month -= 6;
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
  }
  return dates;
}

async function fetchBatch(dates: string[], cfg: DirectionConfig): Promise<Map<string, MarketValueMover[]>> {
  const results = await Promise.allSettled(
    dates.map((d) =>
      fetchWithRetry(buildUrl(d, cfg), buildReferer(d, cfg), cfg.label).then((html) => parsePeriodMovers(html, d))
    )
  );
  const map = new Map<string, MarketValueMover[]>();
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 0) {
      map.set(dates[i], r.value);
    } else if (r.status === "rejected") {
      console.warn(`[${cfg.label}] Failed to fetch ${dates[i]}: ${r.reason}`);
    }
  });
  return map;
}

async function processDirection(direction: Direction): Promise<void> {
  const cfg = DIRECTION_CONFIG[direction];
  console.log(`[${cfg.label}] Starting...`);
  const allDates = getPeriodDates();
  const BATCH_SIZE = 6;
  const processedPeriods: { date: string; movers: MarketValueMover[] }[] = [];
  const moversByPlayer = new Map<string, MarketValueMover[]>();

  for (let batchStart = 0; batchStart < allDates.length; batchStart += BATCH_SIZE) {
    const batchDates = allDates.slice(batchStart, batchStart + BATCH_SIZE);
    console.log(`[${cfg.label}] Fetching batch: ${batchDates.join(", ")}`);
    const batchResults = await fetchBatch(batchDates, cfg);

    for (const date of batchDates) {
      const allPlayers = batchResults.get(date);
      if (!allPlayers) continue;
      const movers = selectPeriodMovers(allPlayers, direction);
      processedPeriods.push({ date, movers });
      console.log(`[${cfg.label}] ${date}: ${allPlayers.length} players → ${movers.length} selected`);

      for (const mover of movers) {
        const existing = moversByPlayer.get(mover.playerId) || [];
        existing.push(mover);
        moversByPlayer.set(mover.playerId, existing);
      }
    }

    const repeats = [...moversByPlayer.values()].filter((a) => a.length >= 2);
    if (repeats.length > 0) {
      console.log(`[${cfg.label}] Found ${repeats.length} repeat(s) after ${processedPeriods.length} periods`);
      await writeResult({ repeatMovers: repeats, periods: processedPeriods }, cfg);
      return;
    }
  }

  console.log(`[${cfg.label}] No repeats found across all periods`);
  await writeResult({ repeatMovers: [], periods: processedPeriods }, cfg);
}

async function writeResult(result: MarketValueMoversResult, cfg: DirectionConfig) {
  const outDir = join(process.cwd(), "data");
  const outPath = join(outDir, cfg.outFile);
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(result));
  console.log(`[${cfg.label}] Wrote ${outPath}`);
}

async function main() {
  await processDirection("losers");
  await processDirection("winners");
}

main().catch((err) => {
  console.error("[biggest-movers] Fatal error:", err);
  process.exit(1);
});
