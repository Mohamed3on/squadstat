import teams from "@/data/wc/teams.json";
import type { Team } from "./model";

/** The 48 World Cup teams with squad market values frozen at tournament end.
 *  data/wc/teams.json is written once by scripts/snapshot-wc.ts and bundled into
 *  the build. */
export const getWcTeams = async (): Promise<Team[]> => teams as Team[];
