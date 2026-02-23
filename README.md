# SquadStat

Football scouting dashboards built on Transfermarkt data.

- Live app: https://squadstat.com
- Public repo: https://github.com/Mohamed3on/squadstat

## What It Covers

- Recent club form across multiple match windows
- Team value vs actual table position
- Player explorer (market value, minutes, G+A, loans/new signings)
- Value analysis (bargains vs underperforming value)
- Injury impact by player, club, and injury type
- Curated discovery boards at `/discover`

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home and navigation |
| `/discover` | Curated board links (shareable filtered views) |
| `/form` | 5/10/15/20-match form analysis |
| `/team-form` | Squad value vs table over/underperformance |
| `/players` | Player explorer with filters and sorting |
| `/value-analysis` | Value efficiency, bargains, and minutes lens |
| `/injured` | Injury impact dashboards |

## API Routes

| Endpoint | Method | Notes |
| --- | --- | --- |
| `/api/analyze` | `GET` | Form analysis data |
| `/api/team-form` | `GET` | Team value vs table data |
| `/api/players` | `GET` | Player dataset for explorer tables |
| `/api/minutes-value` | `GET` | Minutes/value dataset |
| `/api/player-form?id=<id>` | `GET` | Target player comparisons |
| `/api/player-form?name=<name>` | `GET` | Same as above via name search |
| `/api/underperformers` | `GET` | Discovery candidates (value laggards) |
| `/api/overperformers` | `GET` | Discovery candidates (value bargains) |
| `/api/injured` | `GET` | Full injury dataset |
| `/api/injured?league=<code>` | `GET` | League-specific injury data |
| `/api/manager/[clubId]` | `GET` | Manager profile + context |
| `/api/revalidate` | `POST` | Revalidate cached tags/paths |
| `/api/refresh-data` | `POST` | Trigger GitHub workflow refresh |

## Local Development

```bash
bun install
bun run dev
```

Checks:

```bash
bunx tsc --noEmit
bun run lint
```

Refresh local minutes/value snapshot:

```bash
bun run refresh:minutes-value
```

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical base URL for sitemap/metadata |
| `GITHUB_TOKEN` | Optional | Required only for `/api/refresh-data` |

## Caching And Refresh

- Transfermarkt-backed fetches use `unstable_cache` tags.
- `POST /api/revalidate` clears Next.js cache tags for live scraped pages.
- `POST /api/refresh-data` dispatches `refresh-squadstat-data.yml` on GitHub for static-data pages (`/players`, `/value-analysis`), so refresh is asynchronous by design.
