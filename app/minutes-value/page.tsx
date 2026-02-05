import type { Metadata } from "next";
import { MinutesValueUI } from "./MinutesValueUI";

export const metadata: Metadata = {
  title: "Minutes vs Value",
  description:
    "Find football players earning more but playing less. Compare market values and minutes played across top European leagues.",
};

export default function MinutesValuePage() {
  return <MinutesValueUI />;
}
