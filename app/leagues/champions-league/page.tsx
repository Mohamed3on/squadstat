import { createPageMetadata } from "@/lib/metadata";
import { getClClubs, getClSeason } from "@/lib/cl/fetch";
import { buildClModel } from "@/lib/cl/model";
import { getClubIdsWithPages } from "@/lib/team-detail";
import { ChampionsLeague, LinkedClubsProvider } from "./ChampionsLeague";

// Request-rendered like the other Transfermarkt-backed league pages: the data
// layer underneath is unstable_cache'd, so a request render stays cheap, and a
// live competition must never be frozen into the build.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Champions League Table vs Value per Player",
  description:
    "All 36 Champions League league-phase clubs, ranked by league position against market value per player — who is punching above their money and who is falling short, with every fixture and the knockout bracket.",
  path: "/leagues/champions-league",
  keywords: [
    "Champions League table",
    "Champions League league phase",
    "Champions League squad values",
    "Champions League bracket",
    "Champions League overperformers",
    "Champions League fixtures",
  ],
});

export default async function ChampionsLeaguePage() {
  const [clubs, season, withPages] = await Promise.all([
    getClClubs(),
    getClSeason(),
    getClubIdsWithPages(),
  ]);
  const model = buildClModel(clubs, season);
  return (
    <div className="py-6 sm:py-10">
      <LinkedClubsProvider linked={clubs.map((c) => c.id).filter((id) => withPages.has(id))}>
        <ChampionsLeague model={model} />
      </LinkedClubsProvider>
    </div>
  );
}
