import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { PlayersUI } from "./PlayersUI";

export const metadata: Metadata = {
  title: "Player Explorer",
  description:
    "Browse and filter 500+ elite players by value, minutes, games, and G+A across Europe's top leagues.",
};

const SPIELER_RE = /\/spieler\/(\d+)/;

export default async function PlayersPage() {
  const [players, injuredData] = await Promise.all([
    getMinutesValueData(),
    getInjuredPlayers(),
  ]);

  const injuryMap: Record<string, { injury: string; returnDate: string }> = {};
  for (const p of injuredData.players) {
    const m = p.profileUrl.match(SPIELER_RE);
    if (m) injuryMap[m[1]] = { injury: p.injury, returnDate: p.returnDate };
  }

  return (
    <>
      <PlayersUI initialData={players} injuryMap={injuryMap} />
      <DataLastUpdated />
    </>
  );
}
