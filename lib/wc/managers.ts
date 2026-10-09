import type { ManagerInfo } from "@/app/types";
import managers from "@/data/wc/managers.json";

/** Managers for the nations that finished off their value seeding, frozen at
 *  tournament end by scripts/snapshot-wc.ts. Replaces what used to be the
 *  repo's biggest prerender cost: ~2 live scrapes per comparable manager,
 *  ~140 requests per /wc-live build. */
export const getWcManagers = async (): Promise<Record<string, ManagerInfo>> =>
  managers as Record<string, ManagerInfo>;
