import type { Metadata } from "next";
import { getAnalysis } from "@/lib/form-analysis";
import { AnalyzerUI } from "@/app/components/AnalyzerUI";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recent Form",
  description:
    "Who's hot and who's not across Europe's top 5 leagues. Compare form over 5, 10, 15, and 20 match windows.",
};

export default async function FormPage() {
  const data = await getAnalysis();
  return <AnalyzerUI initialData={data} />;
}
