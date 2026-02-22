import { getTeamFormData } from "@/lib/team-form";
import { TeamFormUI } from "./TeamFormUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Value vs Table Performance",
  description:
    "Compare each team's actual points with expected points from squad market value rank. Quickly spot clubs overperforming or underperforming their spending level.",
  path: "/team-form",
  keywords: [
    "overperforming football teams",
    "underperforming football teams",
    "team value vs table",
  ],
});

export default async function TeamFormPage() {
  const data = await getTeamFormData();
  return (
    <>
      <TeamFormUI initialData={data} />
      <DiscoveryLinkGrid
        section="team-form"
        title="Team Performance Boards"
        description="League-level and global boards for overperformers and underperformers."
        currentPath="/team-form"
      />
    </>
  );
}
