# SquadStat Development Guide

Use `bun` for all commands (not npm/yarn).

## Development

Don't run `bun run build` during development - the dev server is already running.

## Hosting

Cloudflare Workers via OpenNext (`wrangler.jsonc`, `open-next.config.ts`). Workers Builds runs
`bun run build:worker` and deploys every push to `main`, the data workflows' commits included;
other branches get a Preview whose URL lands on the PR, on its own R2 and D1 so it never touches
production's caches. The sources' copies, `unstable_cache` entries and prerenders live in R2,
revalidation stamps in D1. The hourly scheduled refresh is declared in `wrangler.jsonc` and run
by `custom-worker.ts`.

```bash
bun run preview                # production build in a local workerd, on localhost:8787
bunx wrangler tail squadstat   # live production logs
bunx wrangler rollback         # back to the previous version
```

Workers Builds settings live in the dashboard, not the repo: build `bun run build:worker`, deploy
`bunx opennextjs-cloudflare deploy`, preview `bunx wrangler preview`, build cache on, and
`BUN_INSTALL_CACHE_DIR=/tmp/bun-install-cache` so only `.next/cache` is cached (restoring bun's
cache took longer than a fresh install). Previews skip the prerender upload, so the root
`/opengraph-image` (a `public/og.png` read) 500s there and only there.

The zone (Free plan) also has two rules that live only in the dashboard: a redirect sending
`www.squadstat.com` to the apex, and a WAF custom rule that 403s every bot except Google, Bing
and link-preview bots (verified bots by category and UA, self-declared bots by UA), plus the
AS132203 headless-Chrome prefetch fleet. Bots were ~87% of Worker CPU before it (Oct 2026). A
new crawler or monitor that must get through needs an exception there.

A Worker has no filesystem: `data/` is imported, so each deploy bundles its own copy, and the
`*updated-at.txt` stamps are inlined by `next.config.ts`. Secrets (`GITHUB_TOKEN`, `CRON_SECRET`,
`TM_RELAY_URL`, `TM_RELAY_SECRET`) are set with `bunx wrangler secret put`.

## UI Components

Use [shadcn/ui](https://ui.shadcn.com) for all UI components. Install new components with `npx shadcn@latest add <component>`. Never build custom UI primitives when a shadcn component exists.

**No inline styles:** Use Tailwind classes (including `data-[state=on]:`, `hover:`, `active:` variants) instead of `style={{}}`. Inline styles override Tailwind's interactive states. For CSS variables, use Tailwind's arbitrary value syntax: `text-[var(--text-muted)]`, `bg-[var(--bg-card)]`, `border-[var(--border-subtle)]`.

**No custom pixel widths:** Never use arbitrary width values like `w-[200px]`, `max-w-[140px]`, `min-w-[3rem]`. Use Tailwind's built-in sizing scale (`w-48`, `min-w-48`, `max-w-sm`) or let content size naturally. Exception: native shadcn/ui component internals may use custom widths.

**Mobile-first responsive design:** All layouts must work on mobile and desktop. Always test both breakpoints mentally when writing markup. Use `flex-col sm:flex-row`, `hidden sm:block`, and responsive variants (`sm:`, `md:`) to adapt layouts. Never ship desktop-only designs.

**Reusable components:** Always think in reusable components. Before creating a new component, look for existing components with similar structure and extract a shared base. Actively look for opportunities to consolidate duplicated UI patterns and logic across the codebase.

**Numeric values:** All numbers (money, percentages, stats, counts) must use the `font-value` class for monospace rendering. Never use `font-bold`/`font-black` on numbers — let the mono font speak for itself.

**Typography weights:** Never use `font-bold` or `font-semibold` on large/prominent Geist Sans text (section headers, headings). Use `font-pixel font-bold` for those instead. Small bold is fine: player/team names, numbers, badges, inline links.

## Performance

- **Server-side data fetching:** Always fetch data in async server components and pass as `initialData` props to client components. Never use client-side `useQuery`/`fetch` waterfalls. Use Next.js `loading.tsx` for streaming skeletons while server fetches. See `expected-position`, `injured`, `minutes-value` pages for the pattern.
- **Parallel fetching:** Use `Promise.all` / `Promise.allSettled` for independent data fetches.
- **Caching:** Pages read a Transfermarkt source's copy and never scrape it (see below).
- **Retries:** Wrap external fetches with retry logic (exponential backoff, max 3 attempts) for rate-limited or flaky responses.
- **Client:** Prefer server components. Only use `"use client"` when interactivity is required.

## Caching Strategy

Transfermarkt data reaches pages two ways (the words are defined in `CONTEXT.md`, the decision in
`docs/adr/0001-pages-show-copies.md`):

- **Sources** (league tables, form tables, the injury list, top transfers, each UEFA
  competition's values or results) each keep one copy in R2, which pages read with `getCopy`
  from `lib/copies.ts`. Pages never scrape a source: only a refresh does, the header button's
  (`app/api/refresh`) or the hourly scheduled one (`app/api/cron/refresh`), and only a complete
  scrape replaces a copy. A new source is defined beside its scraper (copy key, label, maximum
  age, and a scrape that throws unless Transfermarkt answered completely), listed in
  `lib/sources.ts`, and added to the refresh plan of every page that shows it.
- **On-demand scrapes** (a club's managers, a nation's squad) stay in `unstable_cache`, tagged per
  club or nation from `lib/cache-tags.ts`; a refresh of that club's or nation's page clears only
  its own.

The refresh plan in `app/api/refresh/route.ts` has an entry for every page route: the sources
its refresh re-scrapes, whose on-demand scrapes it clears, and whether it also starts the data
workflow, for pages showing committed `data/*.json`. A page missing from it only re-renders, and
its refresh logs a warning. `/api/copies` reports each copy's age, and the data workflow's
`check-copies` job fails when one is twice its maximum age.

**Caches over committed `data/*.json` files are different.** `unstable_cache` entries survive
deployments (`open-next.config.ts` keeps them out of R2's per-build prefix), so they go stale the
moment CI commits fresh data. Plain JSON imports (see `lib/biggest-movers.ts`) need no
`unstable_cache` at all — they're fresh every deploy. If the
derived computation is expensive enough to cache (see `lib/player-detail.ts`), include
`getDataVersion()` from `lib/data-version.ts` in the cache key so each data deploy misses cleanly.

## Debugging Transfermarkt Pages

Use `curl` (not WebFetch) to inspect Transfermarkt HTML — match the headers from `lib/fetch.ts`:

```bash
curl -s -L -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" "https://www.transfermarkt.com/x/leistungsdaten/spieler/294057" | grep -A1 'content-box-headline'
```

## Transfermarkt Relay

Transfermarkt's WAF blocks GitHub's Azure ranges with an HTTP 200 and an **empty body**, and
since Oct 2026 all of Cloudflare's egress (Workers included) with a CloudFront 403 — no
captcha to solve either way. AWS egress is still served, so CI and the production Worker relay
every TM fetch through `workers/tm-relay` running on Lambda (`squadstat-tm-relay` in
eu-central-1, behind a Function URL). Local dev leaves `TM_RELAY_URL` unset and fetches
direct, which is why debugging with plain `curl` above still works.

```bash
workers/tm-relay/deploy-lambda.sh   # deployed by hand; changes ~never
aws logs tail /aws/lambda/squadstat-tm-relay --region eu-central-1 --follow   # live relay traffic
```

The same handler still deploys as a Worker (`cd workers/tm-relay && bunx wrangler deploy`),
the free home should Transfermarkt ever let Cloudflare back in.

Rotating the secret means setting it in **all three** places, or CI and production 403:

```bash
S=$(openssl rand -hex 32)
aws lambda update-function-configuration --region eu-central-1 \
  --function-name squadstat-tm-relay --environment "Variables={RELAY_SECRET=$S}"
printf %s "$S" | gh secret set TM_RELAY_SECRET
printf %s "$S" | bunx wrangler secret put TM_RELAY_SECRET   # production Worker
```

A bare `HTTP 403` from Transfermarkt (its AWS WAF rate block carries no body) is retried with
backoff. Only the relay's own rejections (`forbidden`, `host not allowed`) are fatal.

If TM ever blocks AWS too (`[relay] upstream 403` in the Lambda log, or `HTTP 403 from
Transfermarkt` on every retry in the run), point `TM_RELAY_URL` at another unblocked host.

**The refresh alert skips when any `scraper-broken` issue is open.** Close it when you fix the
thing, or you're blind to the next failure.

**Every failed refresh run also pings Telegram** via `notify-refresh-failure.yml` — a
`workflow_run` trigger, so it fires even for timeouts and runs GitHub's runner infra never
picked up (which the in-job alert step can't see). Needs `TELEGRAM_BOT_TOKEN` +
`TELEGRAM_CHAT_ID` secrets.

## Season Rollover

TM keys seasons by starting year and flips its date-based ID on Aug 1 (`tmCurrentSeasonId`),
weeks before the big leagues kick off. The refresh keeps aggregating the **previous** season
until ≥60% of the pool has played games in the new one (`chooseSeason` in
`lib/season-selection.ts`), then flips automatically — never edit a hardcoded season into the
scrapers. The choice is purely coverage-driven in both directions — a season that flipped
early on a thin sample walks back to the previous one until the bar is properly met. The
chosen season is committed to `data/season.txt`; when it changes, the old-vs-new regression
guards skip for that one run (a flip legitimately resets every stat).
ceapi payloads carry each player's full career, which is what makes aggregating a past season
(and the "last-season coverage ≥70%" scraper-health guard) possible.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
