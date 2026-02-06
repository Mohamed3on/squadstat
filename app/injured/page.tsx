import type { Metadata } from "next";
import { getInjuredPlayers } from "@/lib/injured";
import { InjuredUI } from "./InjuredUI";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Football Injury Tracker",
  description:
    "Track the highest-value injured football players across Europe's top 5 leagues. See which star players are sidelined in the Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.",
};

export default async function InjuredPage() {
  const data = await getInjuredPlayers();
  return <InjuredUI initialData={data} failedLeagues={data.failedLeagues} />;
}
