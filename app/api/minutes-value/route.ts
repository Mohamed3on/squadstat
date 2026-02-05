import { NextResponse } from "next/server";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";

export async function GET() {
  try {
    const players = await getMinutesValueData();
    return NextResponse.json({ players });
  } catch (error) {
    console.error("Error fetching minutes-value data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
