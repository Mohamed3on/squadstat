import { NextRequest, NextResponse } from "next/server";

const PAGES_TO_WARM = [
  "/",
  "/form",
  "/expected-position",
  "/injured",
  "/players",
  "/value-analysis",
  "/biggest-movers",
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://squadstat.com";
  const results: { page: string; status: number; ms: number }[] = [];

  // Warm pages sequentially to avoid overwhelming Transfermarkt
  for (const page of PAGES_TO_WARM) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${page}`, {
        headers: { "x-warm-cache": "1" },
      });
      results.push({ page, status: res.status, ms: Date.now() - start });
    } catch (e) {
      results.push({ page, status: 0, ms: Date.now() - start });
      console.error(`[warm-cache] Failed to warm ${page}:`, e);
    }
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
}
