import { getAnalysis } from "@/lib/form-analysis";
import { AnalyzerUI } from "@/app/components/AnalyzerUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Recent Form",
  description:
    "Who's hot and who's not across Europe's top 5 leagues. Compare form over 5, 10, 15, and 20 match windows.",
  path: "/form",
  keywords: [
    "football recent form",
    "best form teams europe",
    "worst form teams europe",
  ],
});

export default async function FormPage() {
  const data = await getAnalysis();
  if (data.analysis.length === 0) throw new Error("Empty form data");
  return (
    <>
      <AnalyzerUI initialData={data} />
      <DiscoveryLinkGrid
        title="Explore Supporting Boards"
        description="Move from team-form signals into player value and injury diagnostics."
        maxItems={6}
        currentPath="/form"
      />
    </>
  );
}
