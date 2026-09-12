# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: stats-minded football fans** who follow Europe's big leagues closely and want the
data-backed take: who's hot, who's beating or missing their budget, who's overpriced, who's
injured and what that costs. When their needs conflict with a professional scout's or analyst's,
the fan wins. The README's "scouting tools" line predates this record.

They arrive three ways:

- **Cold, from search:** landing on a player, team or league page with no context.
- **From a shared link or screenshot** on X, Reddit or a group chat.
- **Returning by habit:** the owner uses it every day.

## Product Purpose

SquadStat turns Transfermarkt data into views of the Premier League, La Liga, Bundesliga, Serie A,
Ligue 1 and the Champions League. Together they show what the league table misses: team form,
value vs table, player output vs price, market-value trends, injury cost, transfer fees vs value,
and squad values.

Success means all four of these:

1. Search traffic landing on player, team and league pages.
2. Numbers and views shared as links and screenshots.
3. The owner's daily-use tool.
4. A showcase of product and engineering craft.

## Positioning

**Everything in one place.** Form, value, injuries and transfers for the top five leagues and the
Champions League, all on one fast site. Team, player and league pages pull those threads together
for a single club, player or competition.

## Operating Context

- **Navigation:** header groups (Teams, Players, Transfers), a strip of league crests, and ⌘K
  search across players and every page.
- **Shareable state:** Quick Views (`/discover`) and the footer links are URL presets. Filters live
  in the query string. Player, team and league pages each generate their own share image.
- **Data freshness:** a GitHub Actions run every 3 hours commits fresh snapshots to `data/`. Pages
  scraped live from Transfermarkt are cached for 24 hours. The header refresh button clears caches
  and queues a refresh.
- **Season calendar:** Transfermarkt starts a new season on Aug 1. SquadStat stays on the previous
  season until at least 60% of the pool has played in the new one. Transfer windows drive the
  transfer views. World Cup 2026 is over, and its pages (`/wc`, `/wc-live`, `/wc-schedule`) are a
  frozen archive.

## Capabilities and Constraints

- **Coverage:** a tracked player pool across the top five leagues (732 players on 2026-09-13; some
  copy still says "500+"), plus the Champions League. Some views reach further: Most Valuable
  Squads covers the world's top 100, Club Transfers covers the biggest spenders, and team pages
  rank clubs outside the tracked leagues.
- **Views:**
  - Teams: Recent Form, Value vs Table, Squad Values, Injury Impact.
  - Players: All Players, Over/Under, Biggest Movers.
  - Transfers: Fee vs Value, By Club.
  - One page per league and one for the Champions League.
  - Detail pages for every player, team and league.
  - Quick Views, and How It Works (the methodology).
- **Single source:** Transfermarkt, scraped. Every page credits it. There is no other data
  provider.
- **Methodology to preserve:**
  - Rankings use value per player (squad market value ÷ squad size), never the squad total.
  - League strength is the summed market value of the pool's players in that league, on purpose.
- **Terminology:** value per player · points gap (actual − expected points) · form windows (last
  5/10/15/20 matches) · npG+A / G+A (excl. pens) · overpriced / bargain · missed % · biggest
  risers / fallers · Quick Views. UI copy says "football"; "soccer" appears only in SEO keywords.
- **No accounts, no user data, no monetization.** Hosted on Vercel Hobby (non-commercial use,
  100 GB/month bandwidth). A Cloudflare Worker relays Transfermarkt fetches in CI.
- **Responsive:** mobile and desktop are both first-class. English only.

## Brand Commitments

- **Name:** SquadStat (one word, capital S twice). Mark: `app/icon.png`.
- **Credit:** the footer credits Transfermarkt as the data source and reads "Built by Mohamed
  Oun", with links to mohamed3on.com, GitHub, X and Tech Cities Index.
- **Voice (confirmed across sessions):**
  - Label every metric literally and print its arithmetic under the header, e.g.
    "Overall · value added − money spent".
  - Use verb phrases a fan would say ("came out ahead", "sold below value") instead of coined
    jargon. "Won the window" and "won the market" were rejected.
  - Keep one sign convention per page, and say which direction is good.
  - Never write "hub", "board" or "dashboard". Use views, pages, sections, or a descriptive noun.

## Evidence on Hand

- **Real data:**
  - Committed snapshots in `data/`: player pool, squad values, transfer balance, biggest movers,
    clubs.
  - The frozen World Cup archive in `data/wc/`.
  - Live Transfermarkt scrapes for form, standings, injuries, managers and the Champions League.
- **Methodology:** `/how-it-works` explains each formula.
- **Assets:** `app/icon.png`, `public/og.png`, and the generated share images.
- **Traffic:** Vercel Web Analytics is installed. The numbers live in Vercel, not in the repo.
- **Absent:** testimonials, press, user counts, partnerships, and any Transfermarkt endorsement.
  Never invent them.

## Product Principles

1. **Every page is a front door.** Search and shared links drop visitors deep into the site, so
   each page must say on its own what it shows, for which season, and how it's calculated.
2. **Show the sum.** A fan should be able to trust a number and repeat it, so every figure carries
   its literal label and arithmetic.
3. **One place, connected.** Breadth is the position. A new view earns its place by linking into
   the team, player and league pages, not by standing alone.
4. **Shareable by default.** Anything worth passing on is reachable by URL and still makes sense
   when screenshotted or unfurled out of context.
5. **Fresh, fast, finished.** It's a daily tool and a craft showcase, so data freshness, speed and
   finish are features.
