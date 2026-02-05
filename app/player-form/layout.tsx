import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Flops | FormTracker",
  description: "Expensive players underdelivering on goals & assists across Europe's top leagues",
};

export default function PlayerFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
