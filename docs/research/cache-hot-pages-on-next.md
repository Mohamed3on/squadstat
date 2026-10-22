# Caching the hot pages between refreshes on Next, purged on refresh

Research for [#41](https://github.com/Mohamed3on/squadstat/issues/41) (map: #38). Researched on
2026-10-22 against `@opennextjs/cloudflare` 1.20.13, `@opennextjs/aws` 4.1.12, Next 16.4.2 and
wrangler 4.149.0 (the versions in `bun.lock`), the Cloudflare docs as of Oct 2026, this repo, and
squadstat's own Workers Logs.

**Requirement:** no visible staleness. A refresh that replaces a copy must make the next request
show new data. A TTL is not an answer.

## Answer

**Use Workers Cache** (Cloudflare, docs updated Oct 2026). It is a tiered edge cache that sits
_in front of_ the Worker: a hit never runs the Worker, so it is billed **0 CPU ms**. The Worker
purges it by tag from its own code, and by default each deployed version gets its own cache.
Put it on a named `Pages` entrypoint in `custom-worker.ts`, so caching covers only the hot
pages. Keep Next's rendering as it is (`force-dynamic`) and purge from `lib/copies.ts` whenever
a copy is replaced.

Sized against three days of production traffic (below), it saves **~19% of the hot families' CPU
(~28% of the traffic the new bot block keeps)**. Almost all of that comes from `/`, which gets
~91% hits. Two further steps:

- **Make the initial HTML of `/players` and `/value-analysis` independent of the query string**,
  so their cache key can drop it. Hot-family savings rise to **~45–52%**. This needs a small
  prototype first, see Option B.
- **Don't use OpenNext ISR.** In the simulation it is the best of the options (~57%), but it costs
  ~33 ms per hit. It also brings build-time prerenders that need production copies, a ≥30 s
  client router cache on static pages, and SEO-visible client-render bailouts.

No cache helps **`/players/[id]`** or **`/teams/[id]`**, the two biggest families. Only 7–17% of
their requests repeat a URL within a cache lifetime. Their per-render cost is what still decides
#38.

## What the hot pages are and why they render every time

- `/`, `/players`, `/value-analysis`, the `/leagues/*` statics and others export
  `dynamic = "force-dynamic"`. `/players/[playerId]` awaits `searchParams`. `/teams/[clubId]`,
  `/national-teams/[slug]` and `/leagues/[slug]` have dynamic segments without
  `generateStaticParams`, so Next renders them per request.
- They read R2 copies (`getCopy` in `lib/copies.ts`), committed `data/*.json` (bundled into each
  deploy) and, for clubs and nations, on-demand scrapes held in `unstable_cache`.
- Production headers today (`curl -sI`, 2026-10-22): `/` returns
  `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` and
  `vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`. The
  prerendered `/how-it-works` returns `cache-control: s-maxage=31536000`,
  `x-nextjs-cache: HIT` and `x-nextjs-stale-time: 300`. No page sets a cookie, and there is no
  middleware or proxy.

### How often copies change (this sets how long a cache entry can live)

Source `maxAge`s: injury list and both tables 7200 s; UEFA results 21600 s; top transfers, squad
profit and UEFA values 86400 s. The injury list or the tables appear on every hot family except
`/national-teams/[slug]`. So the hourly scheduled refresh replaces a copy those pages show about
every 2 h, and a purge driven by copies empties them about every 2 h. Deploys happened 4–9 times
a day in the sample (Oct 19–22), and every deploy starts a new version.

## Measured: how much any cache could save

Method: every GET to the seven families over Oct 19 08:51 → Oct 22 08:52 UTC, 23,137 events, from
Workers Logs (`telemetry/query`, `view: events`, paged, unsampled), replayed in time order. A
request counts as a hit if the same cache key was already seen in the same Worker version and
the same 2-hour purge window. Saved CPU is the request's measured `cpuTimeMs` minus the hit cost:
0 for Workers Cache, 33 ms for an OpenNext ISR hit. "Kept" is a rough stand-in for the traffic the
new bot block lets through: verified search-engine and page-preview bots, plus requests with no
bot category and no bot-like UA.

Cache keys simulated:

- **B (Workers Cache as is):** path + query.
- **B2:** like B, but `/players` and `/value-analysis` documents keyed by path only.
- **A (ISR):** path only, split by document / prefetch / RSC (how Next keys a static page).

| Family (3 days)          |  CPU s | B saves | B2 saves | A saves |
| ------------------------ | -----: | ------: | -------: | ------: |
| `/players/[id]`          |  2,685 |      9% |       9% |      9% |
| `/players`               |  2,117 |      4% |      93% |     92% |
| `/value-analysis`        |  2,083 |      4% |      93% |     92% |
| `/`                      |  1,652 |     91% |      91% |     92% |
| `/teams/[id]`            |  1,422 |      7% |       7% |     17% |
| `/leagues/*`             |    780 |      4% |       4% |     71% |
| `/national-teams/[slug]` |    559 |      5% |       5% |      7% |
| **All seven**            | 11,299 | **19%** |  **52%** | **57%** |
| **Kept traffic only**    |  6,432 | **28%** |  **45%** | **57%** |

What drives the numbers:

- `/players` and `/value-analysis` miss under B because of their query strings. The top params
  are `/value-analysis?id=…&name=…` (1,257 of 1,358 requests on Oct 20, mostly bots following
  the player page's benchmark links) and `/players?sort=…&club=…&fw=…`.
- `/leagues/*` and `/teams/[id]` are mostly RSC prefetches. Each `_rsc` value hashes the router
  state, so URL keys rarely repeat. ISR keys them by path.
- `/players/[id]` is a long tail: even keyed by path alone with no purges or versions, only 38–56%
  of requests repeat a URL across the whole three days.

The seven families are ~84% of Worker CPU. Against the map's $2.69/month: B saves ≈ $0.4/month,
B2 ≈ $1.2/month, A ≈ $1.3/month, all before the bot block shrinks the base.

### What a hit costs in CPU

| Path                                                    | CPU per hit                                                          | Source                                                                    |
| ------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Workers Cache hit                                       | **0**: the Worker doesn't run. The request is still billed.          | Sourced: [pricing table][wc]                                              |
| Gateway in front of a cached entrypoint (B as proposed) | ~1 ms, the wrapper's own code (estimate)                             | Not measured. Local `wrangler dev` doesn't emulate Workers Cache (tested) |
| OpenNext ISR / prerender hit through NextServer         | **p50 33 ms, p90 130 ms** (`/how-it-works`); p50 37 ms (`/discover`) | Measured, Workers Logs, last 24 h                                         |
| Same with `enableCacheInterception`                     | below that ("slightly improve cold start")                           | Sourced: [OpenNext caching][on]; not measured                             |
| Cache API lookup in `custom-worker.ts`                  | wrapper + `cache.match`, a few ms (estimate)                         | Not measured                                                              |
| Full render today                                       | `/` p50 657 ms, `/players` p50 512 ms                                | Measured, last 24 h                                                       |

[wc]: https://developers.cloudflare.com/workers/cache/
[on]: https://opennext.js.org/cloudflare/caching

## The options

### B. Workers Cache in front of a `Pages` entrypoint (recommended)

**How it works here.** Cloudflare checks the Worker's cache before running it. A hit is returned
from the lower tier (the eyeball's colo) or the upper tier, and only a miss runs the Worker.
Concurrent misses on one key collapse into a single invocation ([Workers Cache][wc]). Enabling
it on the default entrypoint would also bill static-asset requests and cache whatever OpenNext
marks `s-maxage=31536000`. So enable it on a named entrypoint only
([per-entrypoint caching](https://developers.cloudflare.com/workers/cache/configuration/#per-entrypoint-caching),
wrangler ≥ 4.107):

```jsonc
// wrangler.jsonc
"cache": { "enabled": false },
"exports": { "Pages": { "type": "worker", "cache": { "enabled": true } } },
```

```ts
// custom-worker.ts (sketch)
export class Pages extends WorkerEntrypoint {
  fetch(request) {
    return handler.fetch(request, this.env, this.ctx);
  } // OpenNext, unchanged
  purge(tags) {
    return this.ctx.cache?.purge({ tags });
  } // RPC, never cached
}
export default {
  fetch(request, env, ctx) {
    return isHotPage(request) // GET/HEAD to the seven families (+ their OG images)
      ? ctx.exports.Pages.fetch(request, {
          cf: { cacheControl: "max-age=604800" },
        })
      : handler.fetch(request, env, ctx);
  },
  scheduled, // unchanged
};
```

`ctx.exports` is on by default from compatibility date 2025-11-17, and squadstat's is 2026-10-01
([flag](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#enable-ctxexports)).
Wrangler 4.149 accepts this config (`wrangler deploy --dry-run`, tested with a toy Worker).

**Purge on refresh.** Purges are **scoped to the entrypoint that calls them**
([purge modes](https://developers.cloudflare.com/workers/cache/purge/#purge-modes)), so the
purge has to run inside `Pages`. That is why `purge` is an RPC method on it.

- In `lib/copies.ts`, after `write()` succeeds in `refreshOlderThan` (the button and the hourly
  refresh both pass through it), call `getCloudflareContext().ctx.exports.Pages.purge(["copies"])`.
  Every hot response carries `Cache-Tag: copies`. Per-source tags would gain little: the 2-hourly
  injury and table copies sit on every hot family but one.
- For `/teams/[id]` and `/national-teams/[slug]`, the button's `own` branch in `app/api/refresh`
  also purges that one page. That is a `pathPrefixes: ["/teams/123"]` purge, or a per-path tag.
- The button already calls `router.refresh()` after `/api/refresh` answers. A copy that lands
  within the 20 s budget is therefore purged before the RSC refetch. A slower copy lands, and
  purges, after the response, which is today's behaviour too: the toast already says it is
  stale.
- Committed data needs nothing: the data workflow's commit deploys a new version, and the cache
  key includes the version.
- Rate limit: Workers Cache always uses the Free purge tier, 5 requests/min with a bucket of 25
  per account ([limits](https://developers.cloudflare.com/cache/how-to/purge-cache/#availability-and-limits)).
  A few purges an hour fit. ADR-0001's 5-minute `MIN_AGE` already stops repeat presses from
  writing.

**Deploys and build ids.** The Worker version is part of the key by default, so every deploy
starts cold and never serves a previous version's page
([cache keys](https://developers.cloudflare.com/workers/cache/cache-keys/#invalidating-cache-across-deployments)).
That is right for squadstat, whose deploys are mostly data deploys. `cross_version_cache` would
need a purge after every deploy, so leave it off. Rollbacks are covered the same way. Previews
cache separately from production.

**HTML vs RSC, www vs apex.** The key is the path and query plus the version. The host is **not**
in it, so `www` and the apex share entries, which is harmless now that the zone redirects `www`.
RSC requests carry `_rsc=<hash>`, and Next's `Vary` header (`rsc`, `next-router-state-tree`,
`next-router-prefetch`, `next-router-segment-prefetch`) makes Workers Cache store a separate
variant per header combination
([Vary](https://developers.cloudflare.com/workers/cache/configuration/#vary)). Document and RSC
responses never mix. All variants of a URL share one purge identity.

**Gotchas.**

- _Unverified:_ whether `cf.cacheControl` from the caller overrides the callee's own
  `private, no-store`. The docs only show a callee that sets nothing
  ([override](https://developers.cloudflare.com/workers/cache/configuration/#override-cache-control-from-the-calling-worker)).
  If it doesn't, have `Pages` drop Next's `Cache-Control` and set
  `Cloudflare-CDN-Cache-Control: max-age=…`, which wins over `Cache-Control` and is stripped
  before the browser
  ([precedence](https://developers.cloudflare.com/workers/cache/configuration/#header-precedence)).
  Test both in a branch Preview. Local `wrangler dev` has no Workers Cache: in the toy test there
  was no `cf-cache-status` and `ctx.cache` was `undefined`, so guard it.
- **Race:** a render that read the old copy can finish after the purge and store stale HTML until
  the next purge. Purge again ~10 s later via `waitUntil`. (OpenNext ISR has the same race: its
  `set` stamps `lastModified` after the render.)
- Relative-time labels (`timeAgo` in `DataLastUpdated` and on the player page) freeze in cached
  HTML. Render them on the client.
- Billing: every request into `Pages` costs the standard request rate, hit or miss, which adds up
  to ~0.3 M requests/month ≈ $0.09. CPU on a hit is not billed.
- Workers Cache serves stale on Worker error indefinitely unless the response sets
  `stale-if-error=0` or `s-maxage`
  ([max-age](https://developers.cloudflare.com/workers/cache/configuration/#set-the-freshness-window-with-max-age)).
  That is acceptable here.
- "Cache Analytics in Workers Observability" is still listed as coming soon. Until it ships,
  measure the hit rate with `cf-cache-status` and the logs' per-invocation cache-hit field.

**B2: making `/players` and `/value-analysis` cacheable.** Their server output depends on the
query only because `PlayersUI` and `ValueAnalysisUI` read `useSearchParams` during SSR. Keying
them by path needs a first render that ignores the URL, applying URL state after mount. A
gateway that strips the query instead would make React hydrate against `window.location` and hit
mismatches. Prototype one page before committing to it. The cost is a flash of the default
filters on deep links.

**Effort.** B: about half a day, plus a Preview check of the two unverified points. B2: one to two
days.

### A. Drop `force-dynamic`, use OpenNext ISR, call `revalidatePath` on refresh

**How it works here.** The pages become static or ISR (`generateStaticParams` returning `[]` for
the dynamic segments). OpenNext stores the HTML, RSC and segment data in R2, behind the regional
Cache API (`withRegionalCache`, already configured). The tag cache in D1 records
revalidations.

**Purge.** `revalidatePath(path)` passes no profile, so OpenNext writes `expire = now` to D1.
The next read finds `hasBeenRevalidated` and treats it as a **miss**, which means a blocking
render and no stale serve (`@opennextjs/aws` `adapters/cache.js` `revalidateTag` and
`getIncrementalCache`; Next `revalidate.js`). On Next 16 the regional cache still checks D1 on
every hit (`regional-cache.js`: `bypassTagCacheOnCacheHit` defaults to false), so it stays
correct. Hook: after a copy write, call `revalidatePath` for every page showing that source,
using `type: "page"` for patterns. The docs say in route handlers "the revalidation is done on
the next visit" ([revalidatePath][rp]). Whether it may run inside `after()` was not verified.

[rp]: https://nextjs.org/docs/app/api-reference/functions/revalidatePath

**Deploys and build ids.** R2 entries are keyed `incremental-cache/<buildId>/<hash>` and D1 tags
`<buildId>/<tag>` (`r2-incremental-cache.js`, `d1-next-tag-cache.js`), so each deploy starts
cold, the same as B. Removing `force-dynamic` from `/`, `/players`, `/value-analysis`, … makes
`next build` **prerender them**. That calls `getCopy` at build time, and there async
`getCloudflareContext` falls back to wrangler's `getPlatformProxy` with an empty local R2
(`cloudflare-context.js`). So the build would scrape Transfermarkt from Workers Builds, whose
Cloudflare egress TM blocks. The fixes are remote R2 bindings at build, or reading copies over
HTTP. Either way a copy replaced between build and go-live stays stale until the next
replacement, which can be up to 24 h for top transfers.

**HTML vs RSC, www vs apex.** One entry per route path, holding the HTML, `rsc` and
`segmentData`, regardless of host or query (`cacheInterceptor.js`). That is why its simulated
hit rate on `/leagues/*` prefetches is high.

**Gotchas.**

- A static page sends `x-nextjs-stale-time: 300`, so the client router reuses prefetched static
  pages for 5 min (≥30 s with `staleTimes.static`). That is visible staleness on in-app
  navigation after a refresh.
- `useSearchParams` in a static route makes everything up to the nearest Suspense boundary render
  on the client
  ([useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)), so
  `/players`' and `/value-analysis`' tables leave the initial HTML unless they get default-state
  fallbacks.
- Each hit still does an R2 or Cache API read plus a D1 query, at ~33 ms CPU.
- Previews skip the prerender upload.
- The purge race described under B applies here too.
- `/players/[id]` must stop reading `searchParams` (below).

**Effort.** Three to five days, with build-pipeline risk.

### C. Zone Cache Rules + purge by Cache-Tag

**Not applicable as such.** A Worker on a Custom Domain is the origin and runs before the zone
cache. Cache Rules only apply to a Worker's `fetch()` subrequests, not to its own response
([Workers and cache](https://developers.cloudflare.com/cache/interaction-cloudflare-products/workers/)).
They also have no effect on Workers Cache
([limitations](https://developers.cloudflare.com/workers/cache/limitations/#zone-level-cache-configuration)).
Making it work needs a second Worker or hostname to act as the origin. Workers Cache is the
first-party replacement for that pattern.

Plan facts, for completeness: the zone is on the **Free** plan (API, 2026-10-22). Purge by tag,
prefix and host has been available on every plan since 2025-04-01
([changelog](https://developers.cloudflare.com/changelog/post/2025-04-01-purge-for-all/)), at
5 requests/min per account.

### D. Cache API (`caches.default`) in `custom-worker.ts`

**How it works here.** The wrapper calls `cache.match` and returns on a hit; on a miss it renders
and calls `cache.put`. The Worker still runs on every hit. Entries live only in one colo, there's
no tiering and no request collapsing
([Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)). `cache.delete` is
local to one colo. A global purge needs the zone purge API with `Cache-Tag` on the stored
response, an API-token secret and the Free plan's 5/min
([purging Cache API entries](https://developers.cloudflare.com/workers/reference/how-the-cache-works/#purge-assets-stored-with-the-cache-api)).
The key has to include the version (`CF_VERSION_METADATA`) and the RSC headers by hand. Simulated
per colo, it saves ~10% of hot CPU against B's ~19%. Workers Cache beats it on every axis, so
it is not recommended.

## `/players/[id]`'s `searchParams`

`sameLeague=1` / `allLeagues=1` / `top5=1` choose the comparison scope shown first
(`paramsToScope`). The page already sends all four scopes' data (`comparisons: Record<scope, …>`).
`ComparisonPanels` keeps the scope in `useState` and changes the URL with `history.replaceState`,
and `HeroSignalBadges` already reads the params through `useSearchParams`. They can move to the
client: pass no `initialScope` and read it with `useSearchParams` in `ComparisonPanels`, which
needs a Suspense boundary. Under A this is required. Under B it doesn't matter, because those
params almost never appear in production (none of the Oct 20 top-25 params). The family misses
because of its long tail of ids.

## Questions this raises

- **Can the long-tail detail pages render cheaply?** `/players/[id]` and `/teams/[id]` make up
  36% of hot CPU, and no cache gets past ~9–17% on them. Everything caching can't remove depends
  on what a single render costs there: data shaping such as `getPlayerDetailData` and
  `slimForClient` against React rendering. That is the baseline #38's decision rule actually
  turns on.
- Note: OpenNext's D1 tag keys carry the build id, so a `revalidateTag(managerTag(…))` made before
  a deploy is invisible after it. The data-cache entries it was meant to expire outlive deploys
  (`open-next.config.ts`), so a manager scrape cleared just before a deploy can come back. This is
  an edge case in today's code, unrelated to the choice above.
