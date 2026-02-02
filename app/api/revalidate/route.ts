import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Revalidate all API routes
    revalidatePath("/api/analyze", "page");
    revalidatePath("/api/manager/[clubId]", "page");
    revalidatePath("/api/player-form", "page");
    revalidatePath("/api/player-minutes/[playerId]", "page");

    // Revalidate caches (uses unstable_cache with tags)
    revalidateTag("underperformers");
    revalidateTag("injured");
    revalidateTag("team-form");

    return NextResponse.json({
      success: true,
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error revalidating cache:", error);
    return NextResponse.json({ success: false, error: "Failed to revalidate" }, { status: 500 });
  }
}
