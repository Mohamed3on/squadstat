import { NextRequest, NextResponse } from "next/server";
import { refreshIfDue } from "@/lib/copies";
import { SOURCES } from "@/lib/sources";

/** The scheduled refresh, run hourly by custom-worker.ts: re-scrapes each source whose copy
 *  has reached its maximum age. */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcomes = await Promise.all(
    SOURCES.map(async (source) => [source.key, await refreshIfDue(source)] as const),
  );
  return NextResponse.json(Object.fromEntries(outcomes));
}
