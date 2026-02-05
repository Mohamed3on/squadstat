# FormTracker Development Guide

Use `bun` for all commands (not npm/yarn).

## Development

Don't run `bun run build` during development - the dev server is already running.

## UI Components

Use [shadcn/ui](https://ui.shadcn.com) for all UI components. Install new components with `npx shadcn@latest add <component>`. Never build custom UI primitives when a shadcn component exists.

## Performance

- **Server-side data fetching:** Always fetch data in async server components and pass as `initialData` props to client components. Never use client-side `useQuery`/`fetch` waterfalls. Use Next.js `loading.tsx` for streaming skeletons while server fetches. See `team-form`, `injured`, `minutes-value` pages for the pattern.
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

## Debugging Transfermarkt Pages

Use `curl` (not WebFetch) to inspect Transfermarkt HTML — match the headers from `lib/fetch.ts`:

```bash
curl -s -L -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" "https://www.transfermarkt.com/x/leistungsdaten/spieler/294057" | grep -A1 'content-box-headline'
```

## Current Cache Tags

- `underperformers` - Player underperformer candidates
- `injured` - Injured players across all leagues
- `team-form` - Team over/underperformers based on market value
- `manager` - Manager info from mitarbeiterhistorie page
