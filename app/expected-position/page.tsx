import { getTeamFormData } from "@/lib/team-form";
import { getAnalysis } from "@/lib/form-analysis";
import { TeamFormUI } from "./TeamFormUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const revalidate = 7200; // 2 hours — matches unstable_cache TTL

export const metadata = createPageMetadata({
  title: "Expected Position vs Actual",
  description:
    "Compare actual league standings with squad value rankings across Europe's top 5 leagues. Spot the biggest overperformers and underperformers relative to spending.",
  path: "/expected-position",
  keywords: [
    "expected position football",
    "overperforming football teams",
    "underperforming football teams",
    "team value vs table position",
    "soccer overachievers",
  ],
});

export default async function ExpectedPositionPage() {
  const [data, formData] = await Promise.all([getTeamFormData(), getAnalysis()]);

  // Build clubId → form leader info from form analysis
  const formLeaders: Record<string, { type: "top" | "bottom"; count: number }> = {};
  for (const t of formData.aggregatedTop) formLeaders[t.clubId] = { type: "top", count: t.count };
  for (const t of formData.aggregatedBottom) formLeaders[t.clubId] = { type: "bottom", count: t.count };

  return (
    <>
      <TeamFormUI initialData={data} formLeaders={formLeaders} />
      <DiscoveryLinkGrid
        section="expected-position"
        title="Team Performance Boards"
        description="League-level and global boards for overperformers and underperformers."
        currentPath="/expected-position"
      />
    </>
  );
}
