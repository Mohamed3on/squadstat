import type { TransferBalanceClub, TransferBalanceResult } from "@/app/types";
import transferBalance from "@/data/transfer-balance.json";
import { MEASURES, RANKED_DEPTH, type Measure } from "@/lib/transfer-balance-measures";

/** Bundled into the build. data/transfer-balance.json only changes via a data-refresh
 *  deploy, so an unstable_cache could only serve it stale. */
export const getTransferBalance = async (): Promise<TransferBalanceResult> =>
  transferBalance as unknown as TransferBalanceResult;

/** A place this club is entitled to claim on one measure. */
export interface ClubPlace {
  measure: Measure;
  place: number;
}

/** One club's row in one window, with the places it can claim. */
export interface ClubBalanceWindow {
  seasons: number;
  /** `26/27`, or `24/25 – 26/27` for a multi-season window. */
  label: string;
  club: TransferBalanceClub;
  places: ClubPlace[];
}

/**
 * A club's transfer money, window by window, newest span first.
 *
 * Empty for a club that tops none of the four measures in any window, which is
 * every club outside the world's biggest two dozen buyers and sellers — the
 * dataset only reaches that far. Ties share a place.
 */
export async function getClubTransferBalance(clubId: string): Promise<ClubBalanceWindow[]> {
  const { windows } = await getTransferBalance();

  return windows.flatMap(({ seasons, label, clubs }) => {
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return [];

    const places = MEASURES.flatMap((measure) => {
      const mine = measure.of(club);
      if (mine === null) return [];
      const place = clubs.filter((c) => (measure.of(c) ?? -Infinity) > mine).length + 1;
      return place <= RANKED_DEPTH ? [{ measure, place }] : [];
    });

    return [{ seasons, label, club, places }];
  });
}
