import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { CACHE_TAG } from "@/lib/cache-tags";
import { NATIONAL_TEAM_TAG } from "@/lib/national-teams";
import { COMPETITION_LIST, cacheTags, compHref } from "@/lib/uefa/types";

const { formAnalysis, teamForm, injured, topTransfers, manager } = CACHE_TAG;

/** What the header's refresh button renews on a page: the tags of every cached source it
 *  reads, on the server or through /api/manager, and, with `workflow`, the committed
 *  data/*.json it shows, which only the data workflow can refresh. */
type Plan = { tags?: readonly string[]; workflow?: boolean };

const PAGES: Record<string, Plan> = {
  "/form": { tags: [formAnalysis, teamForm, manager] },
  "/expected-position": { tags: [teamForm, formAnalysis, manager] },
  "/injured": { tags: [injured] },
  "/players": { tags: [injured], workflow: true },
  "/value-analysis": { tags: [injured], workflow: true },
  "/biggest-movers": { workflow: true },
  "/squad-values": { workflow: true },
  "/national-teams": { tags: [manager], workflow: true },
  // Both price each deal at today's value, from the committed player data.
  "/fee-vs-value": { tags: [topTransfers], workflow: true },
  "/club-transfers": { tags: [topTransfers], workflow: true },
  // A UEFA page names the managers of its over- and under-performers, so its refresh
  // clears theirs too. A Nations League page takes its values from the national-team
  // data, as /national-teams does, so its refresh also queues that data's workflow.
  ...Object.fromEntries(
    COMPETITION_LIST.map((c) => [
      compHref(c),
      { tags: [...cacheTags(c), manager], workflow: c.format === "groups" },
    ]),
  ),
};

/** Every nation's page: its squad scrape, its manager and its Nations League badge,
 *  over values from the national-team data, so it queues that data's workflow too. */
const NATION_PAGE: Plan = {
  tags: [
    NATIONAL_TEAM_TAG,
    manager,
    ...COMPETITION_LIST.filter((c) => c.format === "groups").flatMap(cacheTags),
  ],
  workflow: true,
};

/** Any page not listed (home, a league, a club, a player) renews everything. */
const EVERYTHING: Plan = {
  tags: [...Object.values(CACHE_TAG), NATIONAL_TEAM_TAG, ...COMPETITION_LIST.flatMap(cacheTags)],
  workflow: true,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path : null;
    const plan: Plan =
      (path && PAGES[path]) ?? (path?.startsWith("/national-teams/") ? NATION_PAGE : EVERYTHING);
    const tags = plan.tags ?? [];

    for (const tag of tags) {
      revalidateTag(tag);
    }
    if (path) {
      revalidatePath(path);
    }

    return NextResponse.json({
      success: true,
      revalidated: tags,
      path,
      workflow: !!plan.workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error revalidating cache:", error);
    return NextResponse.json({ success: false, error: "Failed to revalidate" }, { status: 500 });
  }
}
