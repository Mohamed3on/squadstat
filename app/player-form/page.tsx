import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayerFormUI } from "./PlayerFormUI";

export const metadata: Metadata = {
  title: "Player Output vs Market Value",
  description:
    "Find expensive players with weaker goal contribution output. Compare market value against goals + assists while controlling for minutes played.",
};

export default function PlayerFormPage() {
  return (
    <Suspense>
      <PlayerFormUI />
    </Suspense>
  );
}
