import { readData } from "@/lib/data";

/** When the refresh that writes `file` (a data/*updated-at.txt stamp) last ran, or "" if it
 *  never has. Published with the data (lib/data.ts), so it moves without a deploy. */
export const dataStamp = (file: string): Promise<string> => readData<string>(file).catch(() => "");

/**
 * Cache-key version for anything computed from the published data/*.json files.
 * unstable_cache entries outlive a data refresh, so the previous data's computation would
 * keep being served until its TTL lapsed. Keying by the refresh timestamps makes each
 * refresh miss cleanly.
 */
export const getDataVersion = async (): Promise<string> =>
  `${await dataStamp("updated-at.txt")}|${await dataStamp("biggest-movers-updated-at.txt")}`;
