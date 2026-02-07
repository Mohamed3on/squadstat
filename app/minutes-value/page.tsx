import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { MinutesValueUI } from "./MinutesValueUI";

export const metadata: Metadata = {
  title: "Minutes vs Market Value",
  description:
    "Track high-value players with low minutes. Compare who is playing less than expected for their market value.",
};

export default async function MinutesValuePage() {
  const players = await getMinutesValueData();
  return <MinutesValueUI initialData={players} />;
}
