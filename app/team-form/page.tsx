import type { Metadata } from "next";
import { getTeamFormData } from "@/lib/team-form";
import { TeamFormUI } from "./TeamFormUI";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Value vs Table Performance",
  description:
    "Compare each team's actual points with expected points from squad market value rank. Quickly spot clubs overperforming or underperforming their spending level.",
};

export default async function TeamFormPage() {
  const data = await getTeamFormData();
  return <TeamFormUI initialData={data} />;
}
