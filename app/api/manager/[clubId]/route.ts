import { NextResponse } from "next/server";
import { getManagerInfo } from "@/lib/fetch-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const manager = await getManagerInfo(clubId);
  return NextResponse.json({ clubId, manager });
}
