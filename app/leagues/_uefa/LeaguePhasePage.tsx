import { getCompClubs, getCompSeason } from "@/lib/uefa/fetch";
import { buildModel } from "@/lib/uefa/model";
import type { Competition } from "@/lib/uefa/types";
import { getTeamDetailHref } from "@/lib/format";
import { getClubIdsWithPages } from "@/lib/team-detail";
import { LeaguePhase, LinkedClubsProvider } from "./LeaguePhase";

/** The whole page body for either 36-club competition — only the metadata in
 *  each route's page.tsx differs. */
export async function LeaguePhasePage({ comp }: { comp: Competition }) {
  const [clubs, season, withPages] = await Promise.all([
    getCompClubs(comp.code),
    getCompSeason(comp.code),
    getClubIdsWithPages(),
  ]);
  const model = buildModel(clubs, season);
  const links = Object.fromEntries(
    clubs.filter((c) => withPages.has(c.id)).map((c) => [c.id, getTeamDetailHref(c.id)]),
  );
  return (
    <div className="py-6 sm:py-10">
      <LinkedClubsProvider links={links}>
        <LeaguePhase model={model} comp={comp} />
      </LinkedClubsProvider>
    </div>
  );
}
