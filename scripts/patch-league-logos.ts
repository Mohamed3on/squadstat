#!/usr/bin/env bun
/**
 * One-off: patch leagueLogoUrl into minutes-value.json by scraping
 * one player's profile page per unique league.
 */
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as cheerio from "cheerio";
import { fetchPage } from "../lib/fetch";
import { BASE_URL } from "../lib/constants";
import type { MinutesValuePlayer } from "../app/types";

async function main() {
  const dataPath = join(process.cwd(), "data", "minutes-value.json");
  const players: MinutesValuePlayer[] = JSON.parse(await readFile(dataPath, "utf-8"));
  console.log(`[patch] Loaded ${players.length} players`);

  // Group players by league, pick one representative per league
  const leagueReps = new Map<string, MinutesValuePlayer>();
  for (const p of players) {
    if (p.league && !leagueReps.has(p.league)) {
      leagueReps.set(p.league, p);
    }
  }
  console.log(`[patch] Found ${leagueReps.size} unique leagues: ${[...leagueReps.keys()].join(", ")}`);

  // Fetch one profile page per league to get the league logo
  const leagueLogos = new Map<string, string>();
  const entries = [...leagueReps.entries()];
  const results = await Promise.allSettled(
    entries.map(async ([league, player]) => {
      const html = await fetchPage(`${BASE_URL}/x/leistungsdaten/spieler/${player.playerId}`);
      const $ = cheerio.load(html);
      const img = $(".data-header__league-link img").first();
      const src = (img.attr("src") || "").replace(/\/(verytiny|tiny)\//, "/header/");
      if (src) leagueLogos.set(league, src);
      console.log(`  ${league}: ${src || "NOT FOUND"} (via ${player.name})`);
    })
  );

  for (const r of results) {
    if (r.status === "rejected") console.warn("  Failed:", r.reason?.message);
  }

  console.log(`[patch] Got logos for ${leagueLogos.size}/${leagueReps.size} leagues`);

  // Patch all players
  let patched = 0;
  for (const p of players) {
    const logo = leagueLogos.get(p.league);
    if (logo) {
      p.leagueLogoUrl = logo;
      patched++;
    }
  }

  console.log(`[patch] Patched ${patched}/${players.length} players`);
  await writeFile(dataPath, JSON.stringify(players));
  console.log("[patch] Done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
