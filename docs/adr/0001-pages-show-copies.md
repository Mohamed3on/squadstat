# Pages show copies; only refreshes scrape sources

On 2026-10-18 one press of the header's refresh button on a league page cleared every
Transfermarkt cache, and the ~15 renders it set off (the page plus its re-prefetched links) each
re-scraped the same sources at once: Transfermarkt answered 502 for four minutes, renders hung for
two, and the data workflow running alongside failed. So each source now has one stored copy that
pages read and never re-scrape. Only a refresh (the button, or the hourly scheduled one) scrapes
a source, once, and it replaces the copy only when the scrape is complete.

## Considered Options

- **Keep `unstable_cache` and clear tags** (the previous design): clearing turns every concurrent
  reader into a scraper, and Workers can't share one in-flight scrape across requests.
- **Move the sources into committed data**: nothing scrapes on the request path, but a refresh
  would wait on the data workflow and a deploy, minutes instead of seconds.
- **KV for copies**: faster reads, but a write can take up to 60 s to show everywhere, so the
  person who just refreshed could see the old copy.
- **A Durable Object per source**: it would coordinate writers, but every read would travel to
  one location; skipping a re-scrape when the copy is under 5 minutes old covers writer races
  well enough.

## Consequences

- A page with no copy yet (a new source, an empty bucket, local dev) scrapes the source once and
  stores it: the one case where a page scrapes a source.
- On-demand scrapes (managers, national-team squads) stay cached on first read; a refresh clears
  only those for the page's own club or nation.
