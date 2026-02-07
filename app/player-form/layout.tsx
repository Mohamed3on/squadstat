import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Player Output vs Market Value",
  description: "Compare player market value against goal output and minutes across Europe's top leagues",
};

export default function PlayerFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
