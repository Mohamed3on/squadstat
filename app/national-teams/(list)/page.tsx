import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { createPageMetadata } from "@/lib/metadata";
import { getNationalTeamValues } from "@/lib/squad-values";
import { playerLinks } from "@/lib/wc/linkable-nations";
import { NationalTeamsTable } from "./NationalTeamsTable";

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
      <NationalTeamsTable teams={teams} playerLinks={await playerLinks(teams)} />
      <DataLastUpdated file="national-team-values-updated-at.txt" />
    </>
  );
}
