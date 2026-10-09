/** data/*updated-at.txt, inlined by next.config.ts at build: a Worker has no filesystem
 *  to read data/ from at runtime. */
const STAMPS: Record<string, string> = JSON.parse(process.env.DATA_STAMPS ?? "{}");

/** When the refresh that writes `file` last ran, or "" if it never has. */
export const dataStamp = (file: string): string => STAMPS[file] ?? "";

/**
 * Cache-key version for anything computed from the committed data/*.json files.
 * unstable_cache entries survive deployments, so after a data-refresh deploy the
 * previous deploy's computation would keep being served until its TTL lapsed.
 * Keying by the refresh timestamps makes each data deploy miss cleanly.
 */
export const getDataVersion = async (): Promise<string> =>
  `${dataStamp("updated-at.txt")}|${dataStamp("biggest-movers-updated-at.txt")}`;
