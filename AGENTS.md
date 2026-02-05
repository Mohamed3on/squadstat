# FormTracker Development Guide

Use `bun` for all commands (not npm/yarn).

## Development

Don't run `bun run build` during development - the dev server is already running.

## UI Components

Use [shadcn/ui](https://ui.shadcn.com) for all UI components. Install new components with `npx shadcn@latest add <component>`. Never build custom UI primitives when a shadcn component exists.

## Performance

- **Parallel fetching:** Use `Promise.all` / `Promise.allSettled` for independent data fetches.
- **Caching:** All API routes that fetch from Transfermarkt must use `unstable_cache` (see below).
- **Retries:** Wrap external fetches with retry logic (exponential backoff, max 3 attempts) for rate-limited or flaky responses.
- **Client:** Prefer server components. Only use `"use client"` when interactivity is required.

## Caching Strategy

All API routes that fetch from Transfermarkt should use `unstable_cache` for daily caching:

```typescript
import { unstable_cache } from "next/cache";

const getData = unstable_cache(
  async () => {
    // fetch logic
  },
  ["cache-key"],
  { revalidate: 86400, tags: ["tag-name"] } // 24 hour cache
);
```

**Important:** When adding a new cached route, always add its tag to `/app/api/revalidate/route.ts`:

```typescript
revalidateTag("your-new-tag");
```

This ensures the header refresh button properly busts all caches.

## Current Cache Tags

- `underperformers` - Player underperformer candidates
- `injured` - Injured players across all leagues
- `team-form` - Team over/underperformers based on market value
- `manager` - Manager info from mitarbeiterhistorie page
