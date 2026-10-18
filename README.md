# SquadStat

Football scouting tools built on Transfermarkt data.

- Live app: https://squadstat.com
- Public repo: https://github.com/Mohamed3on/squadstat

## What It Covers

- Recent club form across multiple match windows
- Team value vs actual table position
- Player explorer (market value, minutes, G+A, loans/new signings)
- Value analysis (bargains vs underperforming value)
- Injury impact by player, club, and injury type
- Curated discovery views at `/discover`

## Main Routes

| Route                | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `/`                  | Home and navigation                            |
| `/discover`          | Curated quick-view links (shareable filters)   |
| `/form`              | 5/10/15/20-match form analysis                 |
| `/expected-position` | Squad value vs table over/underperformance     |
| `/players`           | Player explorer with filters and sorting       |
| `/value-analysis`    | Value efficiency, bargains, and minutes lens   |
| `/injured`           | Injury impact by player, team, and injury type |

## API Routes

| Endpoint                       | Method | Notes                                 |
| ------------------------------ | ------ | ------------------------------------- |
| `/api/analyze`                 | `GET`  | Form analysis data                    |
| `/api/expected-position`       | `GET`  | Team value vs table data              |
| `/api/players`                 | `GET`  | Player dataset for explorer tables    |
| `/api/minutes-value`           | `GET`  | Minutes/value dataset                 |
| `/api/player-form?id=<id>`     | `GET`  | Target player comparisons             |
| `/api/player-form?name=<name>` | `GET`  | Same as above via name search         |
| `/api/underperformers`         | `GET`  | Discovery candidates (value laggards) |
| `/api/overperformers`          | `GET`  | Discovery candidates (value bargains) |
| `/api/injured`                 | `GET`  | Full injury dataset                   |
| `/api/injured?league=<code>`   | `GET`  | League-specific injury data           |
| `/api/manager/[clubId]`        | `GET`  | Manager profile + context             |
| `/api/refresh`                 | `POST` | Refresh the data a page shows         |
| `/api/copies`                  | `GET`  | Age of each source's copy             |

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

| Variable               | Required    | Purpose                                 |
| ---------------------- | ----------- | --------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical base URL for sitemap/metadata |
| `GITHUB_TOKEN`         | Optional    | Lets a refresh start the data workflow  |

## Caching And Refresh

- Each Transfermarkt source keeps one copy in R2, which pages read; an hourly scheduled refresh re-scrapes copies past their maximum age (see `docs/adr/0001-pages-show-copies.md`).
- `POST /api/refresh` re-scrapes the sources a page shows, and for pages showing committed data also dispatches `refresh-squadstat-data.yml` on GitHub, whose data lands with the deploy that follows.
