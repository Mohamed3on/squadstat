import { Suspense } from "react";
import { findRepeatLosers, findRepeatWinners } from "@/lib/biggest-movers";
import { BiggestMoversUI } from "./BiggestMoversUI";
import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { createPageMetadata } from "@/lib/metadata";

// Request-rendered: its data is published to R2 (lib/data.ts) without a deploy, so a
// build-time prerender would freeze whatever the build checked out.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Biggest Movers",
  description:
    "Track players whose market value keeps rising or falling across Europe's top 5 leagues. Spot career surges and freefalls with Transfermarkt value history.",
  path: "/biggest-movers",
  keywords: [
    "market value changes football",
    "biggest movers transfermarkt",
    "player value tracker",
    "rising soccer players",
    "falling market value players",
  ],
});

export default async function BiggestMoversPage() {
  const [losers, winners] = await Promise.all([findRepeatLosers(), findRepeatWinners()]);
  return (
    <>
      <Suspense>
        <BiggestMoversUI losers={losers} winners={winners} />
      </Suspense>
      <DataLastUpdated file="biggest-movers-updated-at.txt" />
    </>
  );
}
