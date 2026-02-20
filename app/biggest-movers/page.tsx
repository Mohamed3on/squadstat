import { findRepeatLosers } from "@/lib/biggest-losers";
import { findRepeatWinners } from "@/lib/biggest-winners";
import { BiggestMoversUI } from "./BiggestMoversUI";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Biggest Movers",
  description:
    "Which players' careers are skyrocketing and whose are in freefall? Track the biggest market value risers and fallers every transfer window.",
  path: "/biggest-movers",
  keywords: [
    "market value change",
    "biggest movers transfermarkt",
    "player value tracker",
  ],
});

export default async function BiggestMoversPage() {
  const [losers, winners] = await Promise.all([
    findRepeatLosers(),
    findRepeatWinners(),
  ]);
  return <BiggestMoversUI losers={losers} winners={winners} />;
}
