/** The tag on each cached source, so the header's refresh button can clear it. The plan
 *  of which page reads which lives in app/api/revalidate/route.ts, which clears all of
 *  these, and the tags declared beside their scrapers (NATIONAL_TEAM_TAG, the UEFA
 *  cacheTags), on a page it doesn't list.
 *
 *  Import-free on purpose: lib/team-form.ts reaches a client bundle (TeamFormUI imports
 *  splitPerformers), so the plan, which needs lib/national-teams.ts, can't live here. */
export const CACHE_TAG = {
  formAnalysis: "form-analysis",
  teamForm: "team-form",
  injured: "injured",
  topTransfers: "top-transfers",
  manager: "manager",
  playerDetail: "player-detail",
} as const;
