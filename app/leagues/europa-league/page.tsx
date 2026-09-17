import { createPageMetadata } from "@/lib/metadata";
import { COMPETITIONS } from "@/lib/cl/types";
import { LeaguePhasePage } from "../_uefa/LeaguePhasePage";

// Request-rendered like the other Transfermarkt-backed league pages: the data
// layer underneath is unstable_cache'd, so a request render stays cheap, and a
// live competition must never be frozen into the build.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Europa League Table vs Value per Player",
  description:
    "All 36 Europa League league-phase clubs, ranked by league position against market value per player — who is punching above their money and who is falling short, with the projected winner, every fixture and the knockout bracket.",
  path: "/leagues/europa-league",
  keywords: [
    "Europa League table",
    "Europa League league phase",
    "Europa League squad values",
    "Europa League bracket",
    "Europa League overperformers",
    "Europa League fixtures",
    "Europa League projected winner",
  ],
});

export default function EuropaLeaguePage() {
  return <LeaguePhasePage comp={COMPETITIONS.EL} />;
}
