import { join } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    DATA_BUCKET?: CloudflareEnv["NEXT_INC_CACHE_R2_BUCKET"];
  }
}

/** How long a Worker isolate trusts its copy of a data file before asking R2 whether it
 *  changed: an ETag check that costs no download when it hasn't. */
const RECHECK_MS = 60_000;

interface Entry {
  value: Promise<unknown>;
  etag?: string;
  checkedAt: number;
}

const entries = new Map<string, Entry>();

const onWorkers = globalThis.navigator?.userAgent === "Cloudflare-Workers";

const parse = (file: string, text: string): unknown =>
  file.endsWith(".json") ? JSON.parse(text) : text.trim();

async function fromBucket(file: string, prev?: Entry): Promise<{ value: unknown; etag: string }> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DATA_BUCKET) throw new Error("[data] no DATA_BUCKET bound");
  const object = await env.DATA_BUCKET.get(
    file,
    prev?.etag ? { onlyIf: { etagDoesNotMatch: prev.etag } } : undefined,
  );
  if (!object) throw new Error(`[data] ${file} is missing from R2`);
  // An unchanged file answers the conditional get with its metadata and no body.
  if (!("body" in object)) {
    if (!prev) throw new Error(`[data] ${file} came back without a body`);
    return { value: await prev.value, etag: object.etag };
  }
  return { value: parse(file, await object.text()), etag: object.etag };
}

async function fromDisk(file: string): Promise<{ value: unknown; etag?: string }> {
  const { readFile } = await import("node:fs/promises");
  return { value: parse(file, await readFile(join(process.cwd(), "data", file), "utf-8")) };
}

/**
 * A data file a refresh publishes (scripts/outputs.ts), parsed: JSON, or a .txt's trimmed text.
 *
 * The data workflow uploads these to R2 rather than committing them, so fresh data reaches the
 * site without a deploy (each deploy cold-starts every isolate). A Worker keeps each file per
 * isolate and rechecks its ETag once a minute; a failed recheck keeps the copy it has. Node
 * (next dev and build, tests, scripts) reads the files in data/.
 */
export function readData<T>(file: string): Promise<T> {
  const prev = entries.get(file);
  if (prev && (!onWorkers || Date.now() - prev.checkedAt < RECHECK_MS))
    return prev.value as Promise<T>;

  const loaded = onWorkers ? fromBucket(file, prev) : fromDisk(file);
  const entry: Entry = {
    checkedAt: Date.now(),
    etag: prev?.etag,
    value: loaded.then(
      (r) => {
        entry.etag = r.etag;
        return r.value;
      },
      (error) => {
        if (!prev) {
          if (entries.get(file) === entry) entries.delete(file);
          throw error;
        }
        console.error(`[data] ${file} recheck failed, keeping the copy:`, error);
        return prev.value;
      },
    ),
  };
  entries.set(file, entry);
  return entry.value as Promise<T>;
}
