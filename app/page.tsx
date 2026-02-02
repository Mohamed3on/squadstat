import type { Metadata } from "next";
import { AnalyzerUI } from "./components/AnalyzerUI";

export const metadata: Metadata = {
  title: "Team Form | FormTracker",
  description: "Analyze team form across Europe's top 5 leagues",
};

export default function Home() {
  return <AnalyzerUI />;
}
