import results from "@/data/wc/results.json";
import type { Round } from "./model";

export type GroupStanding = {
  name: string;
  rank: number;
  played: number;
  gd: number;
  goals: string;
  pts: number;
};
export type GroupData = { rows: GroupStanding[]; complete: boolean; anyPlayed: boolean };
export type KoMatch = {
  round: Round;
  num: number;
  home: string | null; // normalized real team name, or null while it's a placeholder
  away: string | null;
  hs: number | null; // scores once played
  as: number | null;
  pens: boolean; // tie decided by a penalty shootout (score shown is the shootout tally)
};
export type WcResults = {
  started: boolean;
  fetchedAt: number;
  groups: Record<string, GroupData>;
  ko: KoMatch[];
};

/** Final 2026 World Cup results, frozen by scripts/snapshot-wc.ts. */
export const getWcResults = async (): Promise<WcResults> => results as WcResults;
