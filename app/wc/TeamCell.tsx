import type { TeamLite } from "@/lib/wc/model";
import { NationLink } from "./NationLink";

// Shared team-name cell for the value tables: flag, name, and a link to the
// nation's page.
export function TeamCell({
  team,
  nationLinks,
}: {
  team: TeamLite;
  nationLinks: Record<string, string>;
}) {
  return (
    <td className="mv-team">
      <span className="flag">{team.flag}</span>
      {team.name}
      {nationLinks[team.name] && <NationLink href={nationLinks[team.name]} team={team.name} />}
    </td>
  );
}
