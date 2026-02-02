import type { Metadata } from "next";
import { PlayerFormUI } from "./PlayerFormUI";

export const metadata: Metadata = {
  title: "Player Underperformers | FormTracker",
  description: "Find expensive players underdelivering on goal contributions across Europe's top leagues",
};

export default function PlayerFormPage() {
  return <PlayerFormUI />;
}
