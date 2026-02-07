import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const ALL_TAGS = [
  "form-analysis",
  "manager",
  "team-form",
  "injured",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const tags: string[] =
      Array.isArray(body?.tags) && body.tags.length > 0 ? body.tags : ALL_TAGS;

    for (const tag of tags) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      success: true,
      revalidated: tags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error revalidating cache:", error);
    return NextResponse.json({ success: false, error: "Failed to revalidate" }, { status: 500 });
  }
}
