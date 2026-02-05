import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { MinutesValueUI } from "./MinutesValueUI";

export const metadata: Metadata = {
  title: "Benched Stars | FormTracker",
  description:
    "High-value football players getting the fewest minutes across Europe's top leagues.",
};

export default async function MinutesValuePage() {
  const players = await getMinutesValueData();
  return <MinutesValueUI initialData={players} />;
}
