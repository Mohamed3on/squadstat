import type { Metadata } from "next";
import { Suspense } from "react";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { PlayerFormUI } from "./PlayerFormUI";

export const metadata: Metadata = {
  title: "Player Output vs Value",
  description:
    "Compare player scoring output against market value. Find overpriced flops and hidden gems across top European leagues.",
};

export default async function PlayerFormPage() {
  const initialAllPlayers = (await getMinutesValueData()).map(toPlayerStats);

  return (
    <Suspense>
      <PlayerFormUI initialAllPlayers={initialAllPlayers} />
    </Suspense>
  );
}
