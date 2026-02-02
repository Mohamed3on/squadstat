import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Injured Players | FormTracker",
  description: "Highest value injured players across Europe's top 5 leagues",
};

export default function InjuredLayout({ children }: { children: React.ReactNode }) {
  return children;
}
