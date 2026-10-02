import { getNationalTeamHref } from "@/lib/format";
import { getNationalTeamValues } from "@/lib/squad-values";

/**
 * Map of national team name -> its page, as each source spells the name. Matched
 * by Transfermarkt's country id, so a spelling of its own ("DR Congo") still
 * finds its nation.
 */
export async function nationLinks(
  teams: { name: string; landId: number }[],
): Promise<Record<string, string>> {
  const { teams: nations } = await getNationalTeamValues();
  const byLandId = new Map(nations.map((t) => [t.landId, getNationalTeamHref(t.name)]));
  const out: Record<string, string> = {};
  for (const t of teams) {
    const href = byLandId.get(t.landId);
    if (href) out[t.name] = href;
  }
  return out;
}
