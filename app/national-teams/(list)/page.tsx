import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { createPageMetadata } from "@/lib/metadata";
import { getNationalTeamValues } from "@/lib/squad-values";
import { NationalTeamsTable } from "../NationalTeamsTable";

// Request-rendered: its data is published to R2 (lib/data.ts) without a deploy, so a
// build-time prerender would freeze whatever the build checked out.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Most Valuable National Teams",
  description:
    "Every national team in world football by market value, searchable by country, filterable by confederation, and sortable by squad value, value per player, squad size and average age.",
  path: "/national-teams",
  keywords: [
    "most valuable national teams",
    "national team market value",
    "national team squad value ranking",
    "average market value per player",
    "richest national teams football",
  ],
});

export default async function NationalTeamsPage() {
  const { teams } = await getNationalTeamValues();

  return (
    <>
      <NationalTeamsTable teams={teams} />
      <DataLastUpdated file="national-team-values-updated-at.txt" />
    </>
  );
}
