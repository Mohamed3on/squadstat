import type { Metadata } from "next";
import { getInjuredPlayers } from "@/lib/injured";
import { InjuredUI } from "./InjuredUI";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Injury Impact Tracker",
  description:
    "Track where injury absences carry the highest market value impact across Europe's top 5 leagues.",
};

export default async function InjuredPage() {
  const data = await getInjuredPlayers();
  return <InjuredUI initialData={data} failedLeagues={data.failedLeagues} />;
}
