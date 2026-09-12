---
name: SquadStat
description: Football analytics set like an analyst's terminal. Near-black surfaces, hairline borders, mono figures, and colour only where it signals.
colors:
  bg-base: "#080a0c"
  bg-elevated: "#0d1117"
  bg-card: "#161b22"
  bg-card-hover: "#1c232d"
  text-primary: "#f0f6fc"
  text-secondary: "#8b949e"
  text-muted: "#6e7681"
  border-subtle: "rgba(240, 246, 252, 0.1)"
  border-medium: "rgba(240, 246, 252, 0.15)"
  accent-hot: "#00ff87"
  accent-hot-glow: "rgba(0, 255, 135, 0.15)"
  accent-hot-border: "rgba(0, 255, 135, 0.2)"
  accent-cold: "#ff4757"
  accent-cold-soft: "#ff6b7a"
  accent-cold-glow: "rgba(255, 71, 87, 0.15)"
  accent-cold-border: "rgba(255, 71, 87, 0.2)"
  accent-blue: "#58a6ff"
  accent-gold: "#ffd700"
typography:
  display:
    fontFamily: "Geist Pixel Square, monospace"
    fontSize: "3.75rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Pixel Square, monospace"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Geist Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Geist Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.18em"
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    letterSpacing: "-0.02em"
    fontFeature: '"tnum" on, "lnum" on'
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  hero: "28px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent-hot}"
    textColor: "{colors.bg-base}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.bg-elevated}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.lg}"
    size: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
  input:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "24px"
  list-row:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "10px"
  list-row-hover:
    backgroundColor: "{colors.bg-card-hover}"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    padding: "4px 10px"
    height: "36px"
  segment-on:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
  tab-list:
    backgroundColor: "{colors.bg-elevated}"
    rounded: "{rounded.lg}"
    padding: "4px"
    height: "40px"
  tab-active:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  pill-hot:
    backgroundColor: "{colors.accent-hot-glow}"
    textColor: "{colors.accent-hot}"
    rounded: "{rounded.full}"
    padding: "2px 6px"
  pill-cold:
    backgroundColor: "{colors.accent-cold-glow}"
    textColor: "{colors.accent-cold}"
    rounded: "{rounded.full}"
    padding: "2px 6px"
  rank-chip:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-muted}"
    typography: "{typography.data}"
    rounded: "{rounded.lg}"
    size: "32px"
  rank-chip-top:
    backgroundColor: "{colors.accent-hot}"
    textColor: "{colors.bg-base}"
    typography: "{typography.data}"
    rounded: "{rounded.lg}"
    size: "32px"
  table-header:
    backgroundColor: "rgba(0, 0, 0, 0.2)"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    padding: "8px 12px"
---

# Design System: SquadStat

## Overview

**Creative North Star: "The Analyst's Terminal"**

SquadStat looks like a data terminal laid over grid paper, after dark. A blue-black ground, a
faint Clear Sky Blue grid under every page, four surfaces that step up in lightness, and hairline
borders carry all the structure. The type comes in three voices from one family: Geist Pixel Square
for headlines (the one piece of character), Geist Sans for reading, and Geist Mono with tabular
digits for every figure. It is dense by default. Text at 10 to 14px does most of the work, and
tables and ranked rows are the main forms.

Colour is signal, never decoration. Electric Spring Green means up, won, hot, and the page's one
main action. Hot Coral Red means down, lost, cold. Clear Sky Blue marks links, focus, and neutral
figures. Pure Gold marks the benchmark figure: the value everything else on the page is measured
against. Everything else is greyscale. The controls stay quiet (outline segments, ghost icons,
muted labels), so the numbers are the loudest thing on screen.

Heroes are the one place atmosphere is allowed: soft radial washes of blue and green over a larger
grid, a big Pixel headline, and a three-figure metric row. Even there the structure is still the
terminal's: label, figure, sub-line. SquadStat must never look like a betting app, a sports-news
portal, a corporate BI tool, or a generic SaaS template.

**Key Characteristics:**

- Dark only. The root is hard-set to `dark` and there is no light theme.
- Every number is Geist Mono with tabular digits, at regular weight.
- Page and section headings use Geist Pixel Square.
- Green and red carry meaning. Blue carries links and neutral figures. Gold carries the benchmark.
- Flat. Depth comes from tonal surfaces and hairlines. A glow sits only on the main action.
- Imagery is data: club crests, league logos, player headshots and flags. No illustration.
- Motion is brief and functional, and all of it stops under `prefers-reduced-motion`.

## Colors

A near-black, blue-tinted greyscale with four signal accents, each with one job.

### Primary

- **Electric Spring Green** (`accent-hot`, #00ff87): up, won, hot form, positive gaps. Also used
  for the primary button (dark text on green), the current item in nav menus, "Stat" in the
  wordmark, rank chips 1 to 3, and the winner's half of a result row. It comes with a tint
  ladder: `accent-hot-glow` (15%) fills pills and badges, and `accent-hot-border` (20%) draws a
  tinted hairline.

### Secondary

- **Hot Coral Red** (`accent-cold`, #ff4757): down, lost, cold form, negative gaps, destructive
  actions. **Soft Coral** (`accent-cold-soft`, #ff6b7a) is the red for running text, where full
  red is too hot. Its glow and border tints mirror the green's.

### Tertiary

- **Clear Sky Blue** (`accent-blue`, #58a6ff): links, the global focus ring, text selection, and
  the background grid (at 3 to 5% alpha). Also neutral figures such as market values in player
  lists, and the second word of some page titles ("Player **Explorer**").
- **Pure Gold** (`accent-gold`, #ffd700): the benchmark. Value per player on club heroes and in
  the Most Valuable Squads table, the reference player in Over/Under, and accolades. It also
  colours small Pixel-caps section eyebrows.

### Neutral

- **Blue-Black** (`bg-base`, #080a0c): the page ground, and the text colour on green fills.
- **Deep Navy-Charcoal** (`bg-elevated`, #0d1117): the first raised layer. Used for inputs,
  ranked rows, tab rails, empty notes and selected segments.
- **Slate Charcoal** (`bg-card`, #161b22): cards, panels, the active tab.
- **Lifted Slate** (`bg-card-hover`, #1c232d): hover on rows and cards, and the current item in
  menus.
- **Cool White** (`text-primary`, #f0f6fc): names, headings, figures.
- **Steel Grey** (`text-secondary`, #8b949e): detail lines, descriptions, inactive nav.
- **Dim Grey** (`text-muted`, #6e7681): labels, table headers, inactive controls.
- **Hairline** (`border-subtle`, white at 10%) and **Firm Hairline** (`border-medium`, 15%): every
  border. Firm is for hover and emphasis.

### Named Rules

**The Signal-Only Rule.** Colour means something or it isn't there. Green is up, won, or go. Red is
down or lost. Blue is a link or a neutral figure. Gold is the benchmark. Anything else is greyscale.

**The Good-Is-Green Rule.** Green marks the better outcome and red the worse, whichever way the
number runs. The fewest goals conceded takes the green. Within a page, the same direction is always
the same colour.

Raw Tailwind hues (`emerald-400`, `red-400`/`500`, `amber-400`) appear in about 100 places for
deltas and row tints, and they read as near-duplicates of the tokens. New work should reach for
the tokens first.

## Typography

**Display Font:** Geist Pixel Square (with monospace fallback)
**Body Font:** Geist Sans (with system-ui, -apple-system, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace)

**Character:** One family, three voices. Pixel gives headlines a scoreboard edge, Sans stays
neutral for reading, and Mono turns every figure into aligned data.

### Hierarchy

- **Display** (400, 36px → 48px → 60px by breakpoint, 1.25, -0.025em): the home headline only.
- **Headline** (400, 24–36px by breakpoint, 1.2): page titles (30px → 36px) and section heads
  (24px → 30px). Always Pixel. CLAUDE.md allows `font-bold` with it.
- **Title** (600, 14–16px): entity names, meaning players, clubs and card titles. This is the only
  place Sans goes heavy.
- **Body** (400, 14px, 1.43): the workhorse. Detail lines drop to 12px, and hero intros rise to
  18px. Prose blocks are capped at `max-w-2xl` to `max-w-3xl`.
- **Label** (400, 10px, 0.18em, uppercase): table headers, hero metric labels, eyebrows. Group
  labels in the mobile nav use 11px at 0.14em.
- **Data** (400, Geist Mono, 12–24px, tabular and lining figures, -0.02em): every number. Applied
  with the `font-value` class.

### Named Rules

**The Mono Figures Rule.** Every number (money, percentages, counts, ranks, scores) is set in
`font-value`, never bold. The mono face is the emphasis.

**The Pixel Heads Rule.** Page and section headings use Pixel. Large Geist Sans is never bold or
semibold.

## Layout

- **Container:** `.page-container` caps at 88rem, with side margins of 12px, then 16px (≥640px),
  then 24px (≥1024px). Detail pages break out through `full-bleed` to `max-w-screen-2xl`.
- **Rhythm:** sections sit 48px apart (64px from 640px up). Cards pad 16px, rising to 24px. Rows
  pad 10px with 8 to 12px gaps. Spacing runs on Tailwind's 4px scale.
- **Grids:** heroes split 1.1fr/0.9fr (home) or 1.2fr/0.8fr (detail pages) at ≥1024px. Card grids
  go 1 → 2 (md) → 3 (xl) columns. Hero metrics come in threes: three across on desktop, two plus
  one on phones.
- **Header:** a sticky 56px bar holding the wordmark, three nav groups, a hairline divider, league
  crests, then search (⌘K), help and refresh. Below 1024px the groups move into a 288px sheet on
  the right.
- **Mobile:** layouts stack (`flex-col sm:flex-row`). Rank chips disappear below 640px to give
  names room. Wide tables scroll sideways inside their own rounded box, and the page itself never
  scrolls sideways.

## Elevation & Depth

Flat, with tonal layers. A raised element is a lighter surface plus a hairline: base → elevated →
card → card-hover, with borders at 10% white (15% on hover). Shadows are rare and never do
structural work. The header gets its separation from 90% black, a backdrop blur, and a hairline.

### Shadow Vocabulary

- **Action glow** (`box-shadow: 0 0 40px rgba(0, 255, 135, 0.1)`): the primary button only.
- **Hover lift** (`box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3)` with a 2px rise): `hover-lift`
  cards, and only on fine-pointer devices.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. A new layer is a lighter surface and a
hairline, never a drop shadow. The glow belongs to the main action alone.

## Shapes

- **Corner ladder:**
  - 4px: crest tiles, tiny chips.
  - 6px: badges, tab triggers, crest links.
  - 8px: buttons, inputs, segments, rank chips, tab rails. This is the workhorse.
  - 12px: cards, ranked rows, tables.
  - 16px: panels, empty notes.
  - 28px: detail heroes.
  - Fully round: pills and avatars.
- **Borders:** 1px hairlines everywhere. A dashed hairline means an empty state. A 2px accent left
  border marks a highlight card.
- **Crests and league logos** sit on white tiles at 90% with a pixel of padding, so any crest reads
  on dark.
- **Grid paper:** square grid lines in Clear Sky Blue, 60px on the page ground (3%) and 64 to 72px
  in heroes (4 to 5%).

## Components

Quiet controls, loud numbers. The controls recede into outlines, while the figures and the single
green action carry the page.

### Buttons

- **Shape:** gently rounded (8px).
- **Primary:** Electric Spring Green fill, Blue-Black text, 14px at 600 weight. It is 40px tall
  (48px `lg`, 32px `sm`) with 16px side padding and the action glow. Green fill is reserved for
  the page's main action.
- **Hover / Focus:** hover drops to 90% opacity. Focus shows a 2px ring in the variant's colour
  with a 2px offset. Transitions last 200ms.
- **Outline:** transparent with a hairline border and Cool White text. Hover fills Deep
  Navy-Charcoal.
- **Ghost:** Dim Grey icon or text with no border, brightening on a Deep Navy-Charcoal hover. Header
  controls are 32px ghost squares. Housekeeping actions such as refresh stay ghost.

### Chips

- **Signal pills:** fully round, glow-tint fill with accent text, 10 to 12px, medium weight.
  Examples: "↑ form", "2 rises", "Squad value this window". Inside table rows they shrink to a
  bare arrow below 640px.
- **Context chips:** 6px corners with a hairline, sometimes accent-tinted. Examples: blue for a
  manager, green or red for a points-per-game figure.
- **Eyebrow badge:** 10px uppercase at 0.2em with a green hairline and glow fill. Used on the home
  hero.

### Segmented controls

- **Style:** one hairline-outlined group with 8px corners holding flush segments. They are 36px
  tall with 12px medium uppercase labels in Dim Grey (10px on phones). Standalone filter toggles
  are 32px outline buttons, each with its own hairline.
- **State:** the selected segment fills Deep Navy-Charcoal and turns Cool White. A selected
  standalone toggle also lifts its border to Dim Grey. Pressing scales to 0.97.

### Tabs

- **Rail:** Deep Navy-Charcoal with 8px corners and a 4px inset.
- **Active tab:** a Slate Charcoal fill, Cool White text, 6px corners and a faint small shadow.

### Cards / Containers

- **Corner Style:** 12px for cards, 16px for panels, 28px for detail heroes.
- **Background:** Slate Charcoal, or Deep Navy-Charcoal for rows and empty notes.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px, rising to 24px from 640px.

### Inputs / Fields

- **Style:** Deep Navy-Charcoal fill, hairline border, 8px corners, 40px tall, 14px text, Dim Grey
  placeholder.
- **Focus:** a 2px Electric Spring Green ring with a 2px offset. Everything else uses the global
  2px Clear Sky Blue focus outline.
- **Search:** opens a ⌘K command palette covering players and every page.

### Navigation

- **Wordmark:** "Squad" in Cool White and "Stat" in Electric Spring Green, set in Pixel.
- **Group triggers:** Teams, Players and Transfers at 14px medium. They are Steel Grey, turning
  Cool White while open or when they hold the current page.
- **Menu items:** 14px. The current item is Electric Spring Green on Lifted Slate.
- **League crests:** 28px targets, each a 20px crest on a white tile. They sit at 60% opacity until
  hovered, and the active one gets a ring. The name lives in a tooltip.
- **Mobile:** a sheet with 11px uppercase group labels and 15px links.

### Tables

- **Container:** a 12px-rounded hairline box that scrolls sideways when needed.
- **Header:** a 20% black fill with 10px uppercase Dim Grey labels at 0.18em.
- **Rows:** half-strength hairline dividers and 10px vertical padding. Figures are mono and
  right-aligned.
- **Qualifiers:** a small muted mono rank sits beside a figure, e.g. "€55.3M 2nd" or "25 #53".
- **Tints:** rows take a 4% green or red wash for good or bad (8% on hover). A result row washes
  the winner's half green, and a draw stays even.

### Hero metric row (signature)

A label (10px uppercase at 0.18em, Dim Grey), then a figure (Geist Mono at 24px in one accent),
then a sub-line (12px Steel Grey). Three to a row. It is the terminal's readout, and it opens
every league, club and player page.

### Detail hero (signature)

28px corners, a hairline border, and a Slate Charcoal to Deep Navy-Charcoal gradient. Radial washes
of blue (top left, 16%) and green (top right, 14%) sit under a 64px blue grid at 5%. Inside: the
crest on a white tile, the Pixel name, outline actions, and the metric row on the right. It
enters with a 0.3s blur-in, switched off under reduced motion.

### Ranked row (signature)

The whole row is a link: Deep Navy-Charcoal, 12px corners, a hairline border and 10px padding.
From left to right: a mono rank chip (hidden below 640px), the headshot, the name over a detail
line, and the list's figures. On hover the border firms and the fill lifts to Lifted Slate.

### Empty note

A dashed hairline box with 16px corners, a Deep Navy-Charcoal fill, and 14px Steel Grey text saying
why nothing is here.

### Loading

Skeletons shimmer between Slate Charcoal and Lifted Slate over 1.5s, with 6px corners. Each route's
`loading.tsx` streams them in while the server fetches.

## Do's and Don'ts

### Do:

- **Do** set every number in `font-value` (Geist Mono, tabular digits) at regular weight.
- **Do** set page and section headings in Geist Pixel Square.
- **Do** build depth from the four surfaces and hairlines: `border-subtle` at rest,
  `border-medium` on hover.
- **Do** give green to the better outcome and red to the worse, consistently within a page.
- **Do** reserve the green fill and its glow for the page's main action. Housekeeping controls stay
  ghost.
- **Do** put crests and league logos on white tiles at 90%, so every crest reads on dark.
- **Do** stack to one column on phones, and let wide tables scroll inside their own rounded box.

### Don't:

- **Don't** look like a betting app: no neon odds tables, casino urgency, or flashing calls to
  action.
- **Don't** look like a sports-news portal: no ad slots, autoplay, or walls of headlines.
- **Don't** look like a corporate BI tool: no enterprise-grey controls, cluttered charts, or heavy
  toolbars.
- **Don't** look like a generic SaaS template: no pastel gradients, rounded blobs, or stock
  illustration.
- **Don't** use drop shadows to show layering.
- **Don't** bold numbers, or set large headings in bold Sans.
- **Don't** add colour for decoration. If it doesn't signal up, down, a link or the benchmark, it
  stays greyscale.
