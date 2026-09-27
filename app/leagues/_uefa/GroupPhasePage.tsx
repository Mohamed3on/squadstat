import { flagUrl } from "@/lib/transfermarkt/image";
import { getNations, getNationsSeason } from "@/lib/uefa/fetch";
import { buildNationsModel } from "@/lib/uefa/nations-league";
import type { NationsLeague } from "@/lib/uefa/types";
import { playerLinks } from "@/lib/wc/linkable-nations";
import { GroupPhase } from "./GroupPhase";
import { LinkedClubsProvider } from "./LeaguePhase";

/** The whole page body for either Nations League tier — only the metadata in
 *  each route's page.tsx differs. */
export async function GroupPhasePage({ nl }: { nl: NationsLeague }) {
  const [nations, season] = await Promise.all([getNations(nl.code), getNationsSeason(nl.code)]);
  const players = await playerLinks(
    nations.map((n) => ({ name: n.name, landId: Number(n.landId) })),
  );
  // A nation links to its players on the site, and wears its flag.
  const links = Object.fromEntries(
    nations.filter((n) => players[n.name]).map((n) => [n.id, players[n.name]]),
  );
  const badges = Object.fromEntries(
    nations.flatMap((n) => (n.landId ? [[n.id, flagUrl(n.landId)]] : [])),
  );
  return (
    <div className="py-6 sm:py-10">
      <LinkedClubsProvider links={links} badges={badges}>
        <GroupPhase model={buildNationsModel(nations, season)} nl={nl} />
      </LinkedClubsProvider>
    </div>
  );
}
