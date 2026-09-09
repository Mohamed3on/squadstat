import { DataLastUpdated } from "@/app/components/DataLastUpdated";
import { createPageMetadata } from "@/lib/metadata";
import { SQUAD_VALUES_PATH, getSquadValues } from "@/lib/squad-values";
import { SquadValuesTable } from "./SquadValuesTable";

export const metadata = createPageMetadata({
  title: "Most Valuable Squads",
  description:
    "The 100 most valuable squads in world football, sortable by total market value, value per player, squad size, average age, and how much of the money sits in the first-choice eighteen.",
  path: SQUAD_VALUES_PATH,
  keywords: [
    "most valuable squads",
    "most valuable clubs football",
    "highest squad market value",
    "average market value per player",
    "club squad value ranking",
    "richest squads in football",
  ],
});

export default async function SquadValuesPage() {
  const { clubs } = await getSquadValues();

  return (
    <>
      <SquadValuesTable clubs={clubs} />
      <DataLastUpdated file="squad-values-updated-at.txt" />
    </>
  );
}
