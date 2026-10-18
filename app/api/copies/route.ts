import { NextResponse } from "next/server";
import { copyTakenAt } from "@/lib/copies";
import { SOURCES } from "@/lib/sources";

/** How old each source's copy is against its maximum age. The data workflow's check-copies
 *  job fails on one twice that old: the scheduled refresh can fail, or stop running, without
 *  anything else noticing. */
export async function GET() {
  const copies = await Promise.all(
    SOURCES.map(async (source) => {
      const takenAt = await copyTakenAt(source);
      return {
        source: source.key,
        takenAt: takenAt?.toISOString() ?? null,
        ageMinutes: takenAt ? Math.floor((Date.now() - takenAt.getTime()) / 60_000) : null,
        maxAgeMinutes: source.maxAge / 60,
      };
    }),
  );
  return NextResponse.json({ copies }, { headers: { "Cache-Control": "no-store" } });
}
