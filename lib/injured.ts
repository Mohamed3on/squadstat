import { parsePlayerTable } from "@/lib/transfermarkt";
import type { InjuredPlayer } from "@/app/types";
import { BASE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copies";
import { LEAGUES } from "@/lib/leagues";
import { fetchPage } from "@/lib/fetch";
import { parseMarketValue } from "@/lib/parse-market-value";

function parseInjuredPlayers(html: string, leagueName: string): InjuredPlayer[] {
  return parsePlayerTable(html, (player, row) => {
    const marketValue = row.text(7);
    const marketValueNum = parseMarketValue(marketValue);
    if (!player.name || marketValueNum <= 0) return null;
    return {
      name: player.name,
      position: player.position,
      club: row.link(1).title,
      clubLogoUrl: row.image(1),
      injury: row.text(4),
      returnDate: row.text(6),
      injurySince: row.text(5),
      age: parseInt(row.text(2), 10) || undefined,
      marketValue,
      marketValueNum,
      imageUrl: player.imageUrl,
      profileUrl: player.profileUrl ? `${BASE_URL}${player.profileUrl}` : "",
      league: leagueName,
    };
  });
}

async function scrapeInjuredPlayers(): Promise<{
  success: boolean;
  players: InjuredPlayer[];
  totalPlayers: number;
  leagues: string[];
}> {
  const MAX_ATTEMPTS = 3;
  const allPlayers: InjuredPlayer[] = [];
  const leagueSet = new Set<string>();
  let pending = [...LEAGUES];

  // Retry leagues that fail, and throw if any still does: a copy has to have all five,
  // so the old one stays until they answer. (Mirrors team-form.)
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && pending.length > 0; attempt++) {
    const results = await Promise.allSettled(
      pending.map(async (league) => {
        const url = `${BASE_URL}/${league.slug}/verletztespieler/wettbewerb/${league.code}/plus/1`;
        return parseInjuredPlayers(await fetchPage(url), league.name);
      }),
    );

    const nextPending: typeof pending = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allPlayers.push(...result.value);
        leagueSet.add(pending[i].name);
      } else {
        nextPending.push(pending[i]);
      }
    });
    pending = nextPending;

    if (pending.length > 0 && attempt < MAX_ATTEMPTS) {
      console.warn(
        `injured attempt ${attempt}/${MAX_ATTEMPTS}: retrying ${pending.map((l) => l.name).join(", ")}`,
      );
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (pending.length > 0) {
    throw new Error(
      `[injured] no answer for ${pending.map((l) => l.name).join(", ")} after ${MAX_ATTEMPTS} attempts`,
    );
  }

  allPlayers.sort((a, b) => b.marketValueNum - a.marketValueNum);

  return {
    success: true,
    players: allPlayers,
    totalPlayers: allPlayers.length,
    leagues: [...leagueSet],
  };
}

export const injuredSource = {
  key: "injured",
  label: "injury list",
  maxAge: 7200,
  scrape: scrapeInjuredPlayers,
};

export const getInjuredPlayers = () => getCopy(injuredSource);
