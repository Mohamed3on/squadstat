import { NextResponse } from "next/server";
import { getManagerInfo } from "@/lib/fetch-manager";

export async function GET(request: Request, { params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  // ?official=1 restates PPG on competitive games alone, as national teams want.
  const officialOnly = new URL(request.url).searchParams.get("official") === "1";
  try {
    const manager = await getManagerInfo(clubId, officialOnly);
    return NextResponse.json(
      { clubId, manager },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error(`[manager] Failed to fetch manager for club ${clubId}:`, error);
    return NextResponse.json({ clubId, manager: null }, { status: 500 });
  }
}
