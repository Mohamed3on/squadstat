export const BASE_URL = "https://www.transfermarkt.com";

/** How many of the season's transfers the fee-vs-value pages read.
 *
 *  It lives here rather than beside the scrape because the copy quotes it: a
 *  badge on a player's page and a note on a club's both name the figure, and
 *  importing it from `fetch-top-transfers` would pull cheerio into any client
 *  component that wanted to say the number out loud. See that module for what
 *  the limit costs to fetch — at 25 rows a page, this is 16 requests.
 *
 *  TM ranks a move that cost nothing by the player's value, not its fee, so the
 *  season's notable free transfers sit well down the table: John Stones' free
 *  move to Inter, a €12m player, was #371 of 2026/27 when this went to 400. */
export const TOP_TRANSFER_LIMIT = 400;
