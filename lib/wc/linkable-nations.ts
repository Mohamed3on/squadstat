import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getNationalityHref } from "@/lib/format";

// Build Transfermarkt landId -> current dataset nationality name from the players
// source (/players reads the same file). The landId is stable and also embedded in
// each player's flag URL, so matching by it sidesteps name-spelling differences.
// Memoised as a promise — static committed data, read once per server process
// even when several requests ask at once.
let byLandId: Promise<Map<number, string>> | null = null;
function nationByLandId(): Promise<Map<number, string>> {
  byLandId ??= readFile(join(process.cwd(), "data", "minutes-value.json"), "utf-8").then((raw) => {
    const players = JSON.parse(raw) as { nationality: string; nationalityFlagUrl: string }[];
    const map = new Map<number, string>();
    for (const p of players) {
      const id = Number(p.nationalityFlagUrl.match(/\/(\d+)\.png/)?.[1]);
      if (id && !map.has(id)) map.set(id, p.nationality);
    }
    return map;
  });
  return byLandId;
}

/**
 * Map of national team name -> /players href, for nations with players there.
 * Matched by stable TM landId, so dataset spelling differences don't matter.
 */
export async function playerLinks(
  teams: { name: string; landId: number }[],
): Promise<Record<string, string>> {
  const byId = await nationByLandId();
  const out: Record<string, string> = {};
  for (const t of teams) {
    const nat = byId.get(t.landId);
    if (nat) out[t.name] = getNationalityHref(nat);
  }
  return out;
}
