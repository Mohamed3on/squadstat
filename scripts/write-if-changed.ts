import { readFile, writeFile } from "fs/promises";

/** Writes `content` unless the file already holds exactly it, and says whether it
 *  wrote. A refresh gates its updated-at stamp on this, so a run that found nothing
 *  new leaves ci-push nothing to commit: the stamp stays the time the data last
 *  changed, and the site isn't redeployed to say nothing new. */
export async function writeIfChanged(path: string, content: string): Promise<boolean> {
  if (content === (await readFile(path, "utf-8").catch(() => ""))) return false;
  await writeFile(path, content);
  return true;
}
