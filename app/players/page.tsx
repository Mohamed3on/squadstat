import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { getInjuredPlayers } from "@/lib/injured";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { PlayersUI } from "./PlayersUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const metadata = createPageMetadata({
  title: "Player Explorer",
  description:
    "Browse and filter 500+ elite players by value, minutes, games, and G+A across Europe's top leagues.",
  path: "/players",
  keywords: [
    "top valued loan players",
    "highest scoring new signings",
    "football player explorer",
  ],
});

const SPIELER_RE = /\/spieler\/(\d+)/;

export default async function PlayersPage() {
  const [players, injuredData] = await Promise.all([
    getMinutesValueData(),
    getInjuredPlayers(),
  ]);

  const injuryMap: Record<string, { injury: string; returnDate: string; injurySince: string }> = {};
  for (const p of injuredData.players) {
    const m = p.profileUrl.match(SPIELER_RE);
    if (m) injuryMap[m[1]] = { injury: p.injury, returnDate: p.returnDate, injurySince: p.injurySince };
  }

  return (
    <>
      <PlayersUI initialData={players} injuryMap={injuryMap} />
      <DiscoveryLinkGrid
        section="players"
        title="Player Scouting Boards"
        description="Use purpose-built boards for loans, new signings, and top-5 output leaders."
        currentPath="/players"
      />
      <DataLastUpdated />
    </>
  );
}
