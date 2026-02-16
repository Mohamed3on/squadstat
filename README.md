# FormTracker

Football analytics app for scanning recent form, squad value efficiency, player output, injuries, and minutes patterns using Transfermarkt data.

Live app: https://football-form.vercel.app

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page with tool overview and direct navigation |
| `/discover` | Index of curated scouting-board shortcuts (direct links to live filtered views) |
| `/form` | Recent form windows (20, 15, 10, 5 matches) with top/bottom signal clusters |
| `/team-form` | Team value vs table performance (actual points vs expected points from value rank) |
| `/players` | Player explorer (value, minutes, games, G+A with league/club/signing filters) |
| `/value-analysis` | Player output vs market value (goal contributions and minutes context) |
| `/injured` | Injury impact by player, team, and injury type |

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Tailwind CSS 4
- shadcn/ui components
- TanStack Query
- Cheerio
- Bun

## Development

Install dependencies:

```bash
bun install
```

Run local dev server:

```bash
bun run dev
```

Type check:

```bash
bunx tsc --noEmit
```

Refresh the prebuilt minutes-value dataset:

```bash
bun run refresh:minutes-value
```

This script rewrites `data/minutes-value.json`.

## API Routes

| Endpoint | Method | Notes |
|---|---|---|
| `/api/analyze` | `GET` | Recent form analysis across 20/15/10/5 windows (cached) |
| `/api/team-form` | `GET` | Team value vs table dataset |
| `/api/player-form` | `GET` | Target-player comparison and underperformers |
| `/api/underperformers` | `GET` | Discovery candidates by position (cached) |
| `/api/players` | `GET` | Player search dataset by position |
| `/api/minutes-value` | `GET` | Minutes-value dataset from committed JSON |
| `/api/injured` | `GET` | Injury dataset; supports `?league=<code>` |
| `/api/manager/[clubId]` | `GET` | Manager profile and PPG context (cached) |
| `/api/player-minutes/[playerId]` | `GET` | Player minutes/goals/assists (cached) |
| `/api/player-minutes/batch` | `POST` | Batch fetch minutes stats |
| `/api/revalidate` | `POST` | Revalidate all or selected cache tags |

## Data Notes

- Source: Transfermarkt pages scraped server-side.
- Cache strategy: `unstable_cache` is used for Transfermarkt-backed routes.
- `POST /api/revalidate` is wired to invalidate all active cache tags used by the app.

## Naming

The product name is **FormTracker**.  
Repository slug is `formtracker`.
