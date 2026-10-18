/** The tags on the on-demand scrapes (CONTEXT.md), one per club or nation, so the refresh of
 *  a club's or a nation's page (app/api/refresh) clears only its own. */
export const managerTag = (clubId: string) => `manager-${clubId}`;
export const nationalTeamTag = (teamId: string) => `national-team-${teamId}`;
