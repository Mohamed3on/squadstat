import type { Metadata } from "next";
import { InjuredUI } from "./InjuredUI";

export const metadata: Metadata = {
  title: "Injured Players | FormTracker",
  description: "Highest value injured players across Europe's top 5 leagues",
};

export default function InjuredPage() {
  return <InjuredUI />;
}
