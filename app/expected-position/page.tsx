import { getTeamFormData } from "@/lib/team-form";
import { TeamFormUI } from "./TeamFormUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Expected Position vs Actual",
  description:
    "Compare each team's actual league position with expected position from squad market value rank. Spot clubs overperforming or underperforming their spending level.",
  path: "/expected-position",
  keywords: [
    "expected position football",
    "overperforming football teams",
    "underperforming football teams",
    "team value vs table",
  ],
});

export default async function ExpectedPositionPage() {
  const data = await getTeamFormData();
  return (
    <>
      <TeamFormUI initialData={data} />
      <DiscoveryLinkGrid
        section="expected-position"
        title="Team Performance Boards"
        description="League-level and global boards for overperformers and underperformers."
        currentPath="/expected-position"
      />
    </>
  );
}
