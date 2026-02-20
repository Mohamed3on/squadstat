import { Suspense } from "react";
import { getMinutesValueData, toPlayerStats, applyStatsToggles } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { findValueCandidates } from "@/lib/value-analysis";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { ValueAnalysisUI } from "./ValueAnalysisUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const metadata = createPageMetadata({
  title: "Over/Under",
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

export default async function ValueAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const includePen = params.pen === "1";
  const includeIntl = params.intl === "1";

  const [mvPlayers, injuredData] = await Promise.all([
    getMinutesValueData(),
    getInjuredPlayers(),
  ]);

  const injuryMap: Record<string, { injury: string; returnDate: string; injurySince: string }> = {};
  for (const p of injuredData.players) {
    const m = p.profileUrl.match(SPIELER_RE);
    if (m) injuryMap[m[1]] = { injury: p.injury, returnDate: p.returnDate, injurySince: p.injurySince };
  }

  const rawPlayerStats = mvPlayers.map(toPlayerStats);
  const allPlayerStats = applyStatsToggles(rawPlayerStats, { includePen, includeIntl });

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
          includePen={includePen}
          includeIntl={includeIntl}
        />
      </Suspense>
      <DiscoveryLinkGrid
        section="value-analysis"
        title="Over/Under Boards"
        description="Jump straight into overpriced, bargain, and low-minutes views."
        currentPath="/value-analysis"
        currentAliases={["/value-analysis?mode=ga"]}
      />
      <DataLastUpdated />
    </>
  );
}
