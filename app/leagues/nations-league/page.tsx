import { createPageMetadata } from "@/lib/metadata";
import { COMPETITIONS } from "@/lib/uefa/types";
import { UefaPage } from "../_uefa/UefaPage";

// Request-rendered like the other Transfermarkt-backed league pages: the data
// layer underneath is unstable_cache'd, so a request render stays cheap, and a
// live competition must never be frozen into the build.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Nations League Groups vs Value per Player",
  description:
    "All 16 Nations League A nations, ranked within their groups by position against market value per player — who is punching above their money and who is falling short, with the projected winner, every fixture and the knockout bracket.",
  path: "/leagues/nations-league",
  keywords: [
    "Nations League table",
    "Nations League groups",
    "Nations League A",
    "Nations League squad values",
    "Nations League bracket",
    "Nations League fixtures",
    "Nations League projected winner",
  ],
});

export default function NationsLeaguePage() {
  return <UefaPage comp={COMPETITIONS.UNLA} />;
}
