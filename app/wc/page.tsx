import { createPageMetadata } from "@/lib/metadata";
import { buildModel } from "@/lib/wc/model";
import { getWcTeams } from "@/lib/wc/teams";
import { nationLinks } from "@/lib/national-teams";
import { WcBracket } from "./WcBracket";

export const metadata = createPageMetadata({
  title: "World Cup 2026 — Market Value Simulation",
  description:
    "A deterministic World Cup 2026 where the higher squad market value wins every match. Full bracket, group tables, and where each team finishes vs its value rank.",
  path: "/wc",
});

export default async function WcPage() {
  const teams = await getWcTeams();
  const model = buildModel(teams);
  const links = await nationLinks(teams);
  return (
    <div className="py-6 sm:py-10">
      <WcBracket model={model} nationLinks={links} />
    </div>
  );
}
