import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Scout | FormTracker",
  description: "Find underperforming players by market value across Europe's top leagues",
};

export default function PlayerFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
