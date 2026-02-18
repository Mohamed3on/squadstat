import { Suspense } from "react";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { findValueCandidates } from "@/lib/value-analysis";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { ValueAnalysisUI } from "./ValueAnalysisUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const metadata = createPageMetadata({
  title: "Value Analysis",
  description:
    "Find overpriced players who underdeliver and bargain players who outperform their price tag. Two lenses - G+A output and minutes played.",
  path: "/value-analysis",
  keywords: [
    "overpriced football players",
    "bargain football players",
    "minutes value analysis",
  ],
});

const SPIELER_RE = /\/spieler\/(\d+)/;

export default async function ValueAnalysisPage() {
  const [mvPlayers, injuredData] = await Promise.all([
    getMinutesValueData(),
    getInjuredPlayers(),
  ]);

  const injuryMap: Record<string, { injury: string; returnDate: string; injurySince: string }> = {};
  for (const p of injuredData.players) {
    const m = p.profileUrl.match(SPIELER_RE);
    if (m) injuryMap[m[1]] = { injury: p.injury, returnDate: p.returnDate, injurySince: p.injurySince };
  }

  const allPlayerStats = mvPlayers.map(toPlayerStats);

  const MIN_DISCOVERY_MINUTES = 260;
  const underperformers = findValueCandidates(allPlayerStats, { candidateOutperforms: false, minMinutes: MIN_DISCOVERY_MINUTES, sortAsc: false })
    .map(({ count, ...p }) => ({ ...p, outperformedByCount: count }));
  const overperformers = findValueCandidates(allPlayerStats, { candidateOutperforms: true, sortAsc: true })
    .map(({ count, ...p }) => ({ ...p, outperformsCount: count }));

  return (
    <>
      <Suspense>
        <ValueAnalysisUI
          initialAllPlayers={allPlayerStats}
          initialData={mvPlayers}
          injuryMap={injuryMap}
          initialUnderperformers={underperformers}
          initialOverperformers={overperformers}
        />
      </Suspense>
      <DiscoveryLinkGrid
        section="value-analysis"
        title="Value Analysis Boards"
        description="Jump straight into overpriced, bargain, and low-minutes views."
        currentPath="/value-analysis"
        currentAliases={["/value-analysis?mode=ga"]}
      />
      <DataLastUpdated />
    </>
  );
}
