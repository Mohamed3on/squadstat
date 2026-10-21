import { revalidateTag } from "next/cache";
import { after, NextRequest, NextResponse } from "next/server";
import { managerTag, nationalTeamTag } from "@/lib/cache-tags";
import { refreshSource, type Source } from "@/lib/copies";
import { startDataWorkflow } from "@/lib/data-workflow";
import { formAnalysisSource } from "@/lib/form-analysis";
import { injuredSource } from "@/lib/injured";
import { getNationalTeams } from "@/lib/national-teams";
import { squadProfitSource } from "@/lib/squad-profit";
import { teamFormSource } from "@/lib/team-form";
import { topTransfersSource } from "@/lib/top-transfers";
import { compSources } from "@/lib/uefa/fetch";
import { COMPETITION_LIST, compHref } from "@/lib/uefa/types";

/** A page's refresh plan (CONTEXT.md): the sources the header's refresh button re-scrapes
 *  there, whose on-demand scrapes it clears (those of the club or nation the page is about),
 *  and whether it also starts the data workflow, for pages showing committed data. */
type Plan = { sources?: Source<unknown>[]; own?: "club" | "nation"; workflow?: boolean };

const TABLES = [teamFormSource, formAnalysisSource];
const LEAGUE_PHASE = COMPETITION_LIST.filter((c) => c.format === "league").flatMap(compSources);
const NATIONS_LEAGUE = COMPETITION_LIST.filter((c) => c.format === "groups").flatMap(compSources);

/** Every page, keyed by route with its dynamic segment written [id]. A page missing here
 *  only re-renders, and its refresh logs a warning. */
const PAGES: Record<string, Plan> = {
  "/": { sources: [...TABLES, injuredSource], workflow: true },
  "/leagues/[id]": { sources: [...TABLES, injuredSource], workflow: true },
  "/form": { sources: TABLES },
  "/expected-position": { sources: TABLES },
  "/injured": { sources: [injuredSource] },
  "/players": { sources: [injuredSource], workflow: true },
  "/value-analysis": { sources: [injuredSource], workflow: true },
  // Both price each deal at today's value, from the committed player data.
  "/fee-vs-value": { sources: [topTransfersSource], workflow: true },
  "/club-transfers": { sources: [topTransfersSource], workflow: true },
  "/squad-profit": { sources: [squadProfitSource] },
  "/biggest-movers": { workflow: true },
  "/squad-values": { workflow: true },
  "/national-teams": { workflow: true },
  // A Nations League page takes its values from the national-team data, as /national-teams
  // does, so its refresh also starts that data's workflow.
  ...Object.fromEntries(
    COMPETITION_LIST.map((c) => [
      compHref(c),
      { sources: compSources(c), workflow: c.format === "groups" },
    ]),
  ),
  // A nation's page carries its Nations League badge; a club's page carries its competition
  // badge, which reads both league-phase competitions.
  "/national-teams/[id]": { sources: NATIONS_LEAGUE, own: "nation", workflow: true },
  "/teams/[id]": {
    sources: [...TABLES, injuredSource, topTransfersSource, ...LEAGUE_PHASE],
    own: "club",
    workflow: true,
  },
  "/players/[id]": { sources: [injuredSource, topTransfersSource], workflow: true },
  // The World Cup pages show a frozen tournament snapshot; the other two are static.
  "/wc": {},
  "/wc-live": {},
  "/wc-schedule": {},
  "/discover": {},
  "/how-it-works": {},
};

/** A refresh expires its page's on-demand scrapes at once, so the next render re-scrapes them
 *  ("max" would serve the old scrape once more while re-scraping behind it). */
const EXPIRE_NOW = { expire: 0 };

/** How long the button waits on its scrapes. A slower one still lands, after the response. */
const BUDGET_MS = 20_000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const path: string = typeof body?.path === "string" ? body.path : "";
  const id = path.slice(path.lastIndexOf("/") + 1);
  const plan = PAGES[path] ?? PAGES[path.replace(/[^/]+$/, "[id]")];
  if (!plan) {
    console.warn(`[refresh] no refresh plan for "${path}", so it only re-renders`);
    return NextResponse.json({ stale: [] });
  }

  if (plan.own === "club") revalidateTag(managerTag(id), EXPIRE_NOW);
  if (plan.own === "nation") {
    const nation = (await getNationalTeams()).bySlug.get(id);
    if (nation) {
      revalidateTag(nationalTeamTag(nation.id), EXPIRE_NOW);
      revalidateTag(managerTag(nation.id), EXPIRE_NOW);
    }
  }

  const sources = plan.sources ?? [];
  const refreshes = sources.map(refreshSource);
  const workflow =
    plan.workflow &&
    startDataWorkflow().catch((error) =>
      console.error("[refresh] data workflow not started:", error),
    );
  after(Promise.all([...refreshes, workflow]));

  const budget = new Promise<"pending">((resolve) => setTimeout(resolve, BUDGET_MS, "pending"));
  const outcomes = await Promise.all(refreshes.map((r) => Promise.race([r, budget])));
  const stale = sources
    .filter((_, i) => outcomes[i] === "failed" || outcomes[i] === "pending")
    .map((s) => s.label);
  return NextResponse.json({ stale });
}
