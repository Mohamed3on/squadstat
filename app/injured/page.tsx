import type { Metadata } from "next";
import { getInjuredPlayers } from "@/app/api/injured/route";
import { InjuredUI } from "./InjuredUI";

export const metadata: Metadata = {
  title: "Injured Players | FormTracker",
  description: "Highest value injured players across Europe's top 5 leagues",
};

export default async function InjuredPage() {
  const data = await getInjuredPlayers();
  return <InjuredUI initialData={data} />;
}
