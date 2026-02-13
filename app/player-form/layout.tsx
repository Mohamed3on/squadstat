import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "G+A vs Market Value",
  description: "Which expensive players are underdelivering on goals and assists? Benchmark any player against similarly valued peers.",
};

export default function PlayerFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
