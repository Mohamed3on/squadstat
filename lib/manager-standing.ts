import type { ManagerInfo } from "@/app/types";

/** Where the PPG ranks among managers since 1992 with as many games, or null when it isn't
 *  ranked. Derived from the record rather than stored on it, so the frozen World Cup
 *  snapshot (data/wc/managers.json) reads the same way; and kept out of server-only
 *  fetch-manager, so the home page's server-rendered badges share it with the client's. */
export function ppgStanding(manager: ManagerInfo) {
  if (
    manager.ppg === null ||
    manager.ppgRank === undefined ||
    manager.totalComparableManagers === undefined
  )
    return null;

  const isOnly = manager.totalComparableManagers === 1;
  const isBest = manager.ppgRank === 1 && !isOnly;
  const isWorst = manager.ppgRank === manager.totalComparableManagers && !isBest && !isOnly;
  return { isOnly, isBest, isWorst };
}
