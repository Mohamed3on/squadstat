import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { MinutesValueUI } from "./MinutesValueUI";

export const metadata: Metadata = {
  title: "Minutes vs Market Value",
  description:
    "Browse and filter 500+ elite players by value, minutes, games, and G+A. Search any player to see who's playing less or more for the same price.",
};

const SPIELER_RE = /\/spieler\/(\d+)/;

export default async function MinutesValuePage() {
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
      <MinutesValueUI initialData={players} injuryMap={injuryMap} />
      <DataLastUpdated />
    </>
  );
}
