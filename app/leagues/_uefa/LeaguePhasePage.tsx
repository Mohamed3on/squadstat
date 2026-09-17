import { getCompClubs, getCompSeason } from "@/lib/cl/fetch";
import { buildClModel } from "@/lib/cl/model";
import type { Competition } from "@/lib/cl/types";
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
  const model = buildClModel(clubs, season);
  return (
    <div className="py-6 sm:py-10">
      <LinkedClubsProvider linked={clubs.map((c) => c.id).filter((id) => withPages.has(id))}>
        <LeaguePhase model={model} comp={comp} />
      </LinkedClubsProvider>
    </div>
  );
}
