import { getInjuredPlayers } from "@/lib/injured";
import { InjuredUI } from "./InjuredUI";
import { createPageMetadata } from "@/lib/metadata";
import { DiscoveryLinkGrid } from "@/app/components/DiscoveryLinkGrid";

export const revalidate = 60;

export const metadata = createPageMetadata({
  title: "Injury Impact Tracker",
  description:
    "Track where injury absences carry the highest market value impact across Europe's top 5 leagues.",
  path: "/injured",
  keywords: [
    "highest value injured players",
    "injury value loss by club",
    "football injury tracker",
  ],
});

export default async function InjuredPage() {
  const data = await getInjuredPlayers();
  if (data.players.length === 0) throw new Error("Empty injured data");
  return (
    <>
      <InjuredUI initialData={data} failedLeagues={data.failedLeagues} />
      <DiscoveryLinkGrid
        section="injured"
        title="Injury Tracking Boards"
        description="Track injury cost by player, team, and injury type from dedicated board pages."
        currentPath="/injured"
        currentAliases={["/injured?tab=players"]}
      />
    </>
  );
}
