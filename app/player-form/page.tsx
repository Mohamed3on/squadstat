import type { Metadata } from "next";
import { Suspense } from "react";
import { getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { PlayerFormUI } from "./PlayerFormUI";

export const metadata: Metadata = {
  title: "G+A vs Market Value",
  description:
    "Which expensive players are underdelivering on goals and assists? Search any player to benchmark their output against similarly valued peers.",
};

export default async function PlayerFormPage() {
  const initialAllPlayers = (await getMinutesValueData()).map(toPlayerStats);

  return (
    <>
      <Suspense>
        <PlayerFormUI initialAllPlayers={initialAllPlayers} />
      </Suspense>
      <DataLastUpdated />
    </>
  );
}
