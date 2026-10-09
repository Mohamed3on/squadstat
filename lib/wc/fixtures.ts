import fixtures from "@/data/wc/fixtures.json";
import knockoutSchedule from "@/data/wc/knockout-schedule.json";

export type GroupFixture = {
  group: string;
  matchday: number; // 1-3
  home: string; // roster name
  away: string;
  hs: number | null; // score once played
  as: number | null;
  played: boolean;
  kickoff: number; // sortable YYYYMMDDHHMM, in Transfermarkt's displayed zone (CEST)
  dow: string; // "Tue"
  dayLabel: string; // "16 Jun"
  timeLabel: string; // "9:00 PM"
};

export type Kick = { kickoff: number; dow: string; dayLabel: string; timeLabel: string };

/** Group-stage fixtures with final scores, frozen by scripts/snapshot-wc.ts. */
export const getWcFixtures = async (): Promise<GroupFixture[]> => fixtures as GroupFixture[];

/** Official knockout kickoff dates keyed by bracket card (`${round}-${num}`, plus "3RD"). */
export const getWcKnockoutSchedule = async (): Promise<Record<string, Kick>> =>
  knockoutSchedule as Record<string, Kick>;
