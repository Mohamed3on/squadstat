import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { MinutesValueUI } from "./MinutesValueUI";

export const metadata: Metadata = {
  title: "Minutes vs Market Value",
  description:
    "Track high-value players with low minutes. Compare who is playing less than expected for their market value.",
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
