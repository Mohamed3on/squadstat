import type { Metadata } from "next";
import { TeamFormUI } from "./TeamFormUI";

export const metadata: Metadata = {
  title: "Team Δ Pts | FormTracker",
  description: "Teams over/underperforming their expected position based on squad market value",
};

export default function TeamFormPage() {
  return <TeamFormUI />;
}
