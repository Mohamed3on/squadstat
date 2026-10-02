import { getAnalysis } from "@/lib/form-analysis";
import { getTeamFormData } from "@/lib/team-form";
import { splitPerformers } from "@/lib/performers";
import { FormAnalysisUI } from "@/app/components/FormAnalysisUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Recent Form",
  description:
    "Who's hot and who's not in the Premier League, La Liga, Bundesliga, Serie A, and Ligue 1. Teams ranked by points, goals, and defense across 5 to 20-match windows.",
  path: "/form",
  keywords: [
    "football recent form",
    "soccer team form",
    "best form teams europe",
    "worst form teams europe",
    "premier league form table",
  ],
});

export default async function FormPage() {
  const [data, teamForm] = await Promise.all([getAnalysis(), getTeamFormData()]);

  // Only show points gap badge for top 20 over/underperformers
  const { overperformers, underperformers } = splitPerformers(teamForm.allTeams, 20);
  const deltaMap: Record<string, number> = {};
  for (const t of overperformers) deltaMap[t.clubId] = t.deltaPts;
  for (const t of underperformers) deltaMap[t.clubId] = t.deltaPts;

  return (
    <>
      <FormAnalysisUI initialData={data} deltaMap={deltaMap} />
      <DiscoveryLinkGrid
        title="Quick views"
        description="Move from form signals into player value and injury diagnostics."
        maxItems={6}
        currentPath="/form"
      />
    </>
  );
}
