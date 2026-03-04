import { getAnalysis } from "@/lib/form-analysis";
import { getTeamFormData } from "@/lib/team-form";
import { AnalyzerUI } from "@/app/components/AnalyzerUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const revalidate = 7200; // 2 hours — matches unstable_cache TTL

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
  if (data.analysis.length === 0) throw new Error("Empty form data");

  // Build clubId → deltaPts map from expected-position data
  const deltaMap: Record<string, number> = {};
  for (const t of [...teamForm.overperformers, ...teamForm.underperformers]) {
    deltaMap[t.clubId] = t.deltaPts;
  }

  return (
    <>
      <AnalyzerUI initialData={data} deltaMap={deltaMap} />
      <DiscoveryLinkGrid
        title="Explore Supporting Boards"
        description="Move from form signals into player value and injury diagnostics."
        maxItems={6}
        currentPath="/form"
      />
    </>
  );
}
