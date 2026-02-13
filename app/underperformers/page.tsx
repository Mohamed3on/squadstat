import type { Metadata } from "next";
import { Suspense } from "react";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { UnderperformersUI } from "./UnderperformersUI";

export const metadata: Metadata = {
  title: "Underperformers",
  description:
    "Which expensive players are underdelivering? Two lenses — G+A output and minutes played — to spot who's not earning their price tag.",
};

const SPIELER_RE = /\/spieler\/(\d+)/;

export default async function UnderperformersPage() {
  const [mvPlayers, injuredData] = await Promise.all([
    getMinutesValueData(),
    getInjuredPlayers(),
  ]);

  const injuryMap: Record<string, { injury: string; returnDate: string }> = {};
  for (const p of injuredData.players) {
    const m = p.profileUrl.match(SPIELER_RE);
    if (m) injuryMap[m[1]] = { injury: p.injury, returnDate: p.returnDate };
  }

  const allPlayerStats = mvPlayers.map(toPlayerStats);

  return (
    <>
      <Suspense>
        <UnderperformersUI
          initialAllPlayers={allPlayerStats}
          initialData={mvPlayers}
          injuryMap={injuryMap}
        />
      </Suspense>
      <DataLastUpdated />
    </>
  );
}
