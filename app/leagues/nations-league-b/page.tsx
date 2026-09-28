import { createPageMetadata } from "@/lib/metadata";
import { COMPETITIONS } from "@/lib/uefa/types";
import { UefaPage } from "../_uefa/UefaPage";

// Request-rendered like the other Transfermarkt-backed league pages: the data
// layer underneath is unstable_cache'd, so a request render stays cheap, and a
// live competition must never be frozen into the build.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Nations League B Groups vs Value per Player",
  description:
    "All 16 Nations League B nations, ranked within their groups by position against market value per player — who is punching above their money, who is falling short, and which four the money sends up to League A.",
  path: "/leagues/nations-league-b",
  keywords: [
    "Nations League B table",
    "Nations League B groups",
    "Nations League B squad values",
    "Nations League B promotion",
    "Nations League B fixtures",
  ],
});

export default function NationsLeagueBPage() {
  return <UefaPage comp={COMPETITIONS.UNLB} />;
}
