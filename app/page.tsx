import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock,
  HeartPulse,
  LayoutGrid,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { createPageMetadata } from "@/lib/metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = createPageMetadata({
  title: "Home",
  description:
    "FormTracker helps football fans track team form, player output, injuries, and value trends across Europe.",
  path: "/",
  keywords: [
    "football analytics",
    "football stats for fans",
    "team form tracker",
    "player value analysis",
    "injury impact football",
  ],
});

const snapshotTiles = [
  {
    value: "5",
    label: "Top Leagues",
    detail: "Premier League, La Liga, Bundesliga, Serie A, Ligue 1",
  },
  {
    value: "500+",
    label: "Players",
    detail: "Big-name profiles with value, minutes, G+A, penalties, and status tags",
  },
  {
    value: "2",
    label: "Value Modes",
    detail: "G+A value mode and minutes mode for overpriced vs bargain signals",
  },
  {
    value: "Daily",
    label: "Refresh",
    detail: "Transfermarkt-backed data with a manual refresh button in the header",
  },
] as const;

type FeatureTone = {
  card: string;
  iconWrap: string;
  icon: string;
  tag: string;
  bullet: string;
  link: string;
};

type Feature = {
  title: string;
  href: string;
  tag: string;
  description: string;
  highlights: readonly [string, string, string];
  icon: LucideIcon;
  tone: FeatureTone;
};

const features: readonly Feature[] = [
  {
    title: "Recent Form",
    href: "/form",
    tag: "Hot & Cold",
    description:
      "See which teams are flying or falling apart across 5, 10, 15, and 20-match windows.",
    highlights: [
      "Best and worst teams by points, goal difference, goals scored, and goals conceded",
      "Window-by-window cards so you can compare momentum quickly",
      "Manager PPG context attached to standout teams",
    ],
    icon: Activity,
    tone: {
      card: "hover:border-[var(--accent-hot-border)]",
      iconWrap: "bg-[var(--accent-hot-glow)]",
      icon: "text-[var(--accent-hot)]",
      tag: "border-[var(--accent-hot-border)] text-[var(--accent-hot)]",
      bullet: "bg-[var(--accent-hot)]",
      link: "text-[var(--accent-hot)]",
    },
  },
  {
    title: "Value vs Table",
    href: "/team-form",
    tag: "Punching Up?",
    description:
      "Compare actual points to value-based expected points and find clubs overachieving or underachieving.",
    highlights: [
      "Clear overperformer and underperformer rankings",
      "League filters plus all-leagues mode",
      "Manager overlays for extra context",
    ],
    icon: Scale,
    tone: {
      card: "hover:border-[rgba(88,166,255,0.35)]",
      iconWrap: "bg-[rgba(88,166,255,0.16)]",
      icon: "text-[var(--accent-blue)]",
      tag: "border-[rgba(88,166,255,0.35)] text-[var(--accent-blue)]",
      bullet: "bg-[var(--accent-blue)]",
      link: "text-[var(--accent-blue)]",
    },
  },
  {
    title: "Player Explorer",
    href: "/players",
    tag: "Player Rabbit Hole",
    description:
      "Dive into player stats with filters for value, minutes, games, G+A, penalties, loans, and new signings.",
    highlights: [
      "Loan and new-signing filters plus top-5-only mode",
      "League, club, nationality, and sorting controls",
      "Injury overlays and penalty context",
    ],
    icon: Clock,
    tone: {
      card: "hover:border-[rgba(255,215,0,0.32)]",
      iconWrap: "bg-[rgba(255,215,0,0.15)]",
      icon: "text-[var(--accent-gold)]",
      tag: "border-[rgba(255,215,0,0.32)] text-[var(--accent-gold)]",
      bullet: "bg-[var(--accent-gold)]",
      link: "text-[var(--accent-gold)]",
    },
  },
  {
    title: "Value Analysis",
    href: "/value-analysis",
    tag: "Overpriced or Steal?",
    description:
      "Compare players against peers to spot expensive underdeliverers and sneaky bargains.",
    highlights: [
      "Two modes: output value (G+A) and low-minutes flags",
      "Toggle penalties and international output",
      "Optional injury exclusion for cleaner minutes view",
    ],
    icon: TrendingUp,
    tone: {
      card: "hover:border-emerald-500/40",
      iconWrap: "bg-emerald-500/15",
      icon: "text-emerald-400",
      tag: "border-emerald-500/40 text-emerald-400",
      bullet: "bg-emerald-400",
      link: "text-emerald-400",
    },
  },
  {
    title: "Injury Impact",
    href: "/injured",
    tag: "Who Is Missing?",
    description:
      "Track injury impact by player, club, and injury type with value-loss rankings.",
    highlights: [
      "Tabs for players, teams, and injury categories",
      "Club-level value loss and injured player counts",
      "Injury duration and return timeline hints",
    ],
    icon: HeartPulse,
    tone: {
      card: "hover:border-[var(--accent-cold-border)]",
      iconWrap: "bg-[var(--accent-cold-glow)]",
      icon: "text-[var(--accent-cold)]",
      tag: "border-[var(--accent-cold-border)] text-[var(--accent-cold)]",
      bullet: "bg-[var(--accent-cold)]",
      link: "text-[var(--accent-cold)]",
    },
  },
  {
    title: "Quick Views",
    href: "/discover",
    tag: "Saved Filters",
    description:
      "Open ready-made views instantly. A quick view is saved filters + sorting in one shareable URL.",
    highlights: [
      "Preset catalog grouped by section",
      "Shortcuts for signings, injuries, bargains, and league-specific views",
      "Perfect for recurring fan checks",
    ],
    icon: LayoutGrid,
    tone: {
      card: "hover:border-violet-500/40",
      iconWrap: "bg-violet-500/15",
      icon: "text-violet-300",
      tag: "border-violet-500/40 text-violet-300",
      bullet: "bg-violet-300",
      link: "text-violet-300",
    },
  },
] as const;

const valueAnalysisLinks = [
  {
    label: "Most overpriced players",
    href: "/value-analysis?mode=ga",
    summary: "Players flagged as expensive relative to output.",
  },
  {
    label: "Best bargain players",
    href: "/value-analysis?mode=ga&dTab=bargains",
    summary: "Lower-value players outperforming more expensive peers.",
  },
  {
    label: "Top 5 bargains",
    href: "/value-analysis?mode=ga&dTab=bargains&dTop5=1",
    summary: "Bargain view narrowed to top-5 leagues.",
  },
  {
    label: "Top 5 overpriced",
    href: "/value-analysis?mode=ga&dTop5=1",
    summary: "Overpriced view narrowed to top-5 leagues.",
  },
  {
    label: "Expensive players with fewest minutes",
    href: "/value-analysis?mode=mins",
    summary: "High-value players with low minutes this season.",
  },
  {
    label: "Fewest minutes (excluding injuries)",
    href: "/value-analysis?mode=mins&noInj=1",
    summary: "Low-minute high-value players excluding current injuries.",
  },
] as const;

const entryLinks = [
  { href: "/form", label: "Recent Form" },
  { href: "/team-form", label: "Value vs Table" },
  { href: "/players", label: "Player Explorer" },
  { href: "/value-analysis", label: "Value Analysis" },
] as const;

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black text-[var(--text-primary)] sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)] sm:text-base">{description}</p>
      </div>
      {action && (
        <Button asChild variant="outline" className="border-[var(--border-medium)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Card
      className={`group h-full border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--bg-card-hover)] ${feature.tone.card}`}
    >
      <CardHeader>
        <div className="mb-3 flex items-center justify-between">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.tone.iconWrap}`}>
            <Icon className={`h-5 w-5 ${feature.tone.icon}`} />
          </span>
          <Badge
            variant="outline"
            className={`border text-[10px] uppercase tracking-[0.16em] ${feature.tone.tag}`}
          >
            {feature.tag}
          </Badge>
        </div>
        <CardTitle className="text-xl text-[var(--text-primary)]">{feature.title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {feature.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {feature.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <span className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${feature.tone.bullet}`} />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
        <Link
          href={feature.href}
          className={`group/link mt-5 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--text-primary)] ${feature.tone.link}`}
        >
          Open {feature.title}
          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="pb-16 sm:pb-20">
      <section className="full-bleed relative overflow-hidden border-b border-[var(--border-subtle)] bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,135,0.16),transparent_40%),radial-gradient(circle_at_82%_8%,rgba(88,166,255,0.15),transparent_40%),linear-gradient(180deg,var(--bg-base),var(--bg-elevated))]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,166,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(88,166,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" aria-hidden="true" />

        <div className="page-container relative py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <Badge className="mb-5 border-[var(--accent-hot-border)] bg-[var(--accent-hot-glow)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent-hot)]">
                Daily football stats across Europe&apos;s top leagues
              </Badge>

              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                Football stats,
                <span className="ml-2 bg-gradient-to-r from-[var(--accent-hot)] via-[var(--accent-blue)] to-[var(--accent-gold)] bg-clip-text text-transparent">
                  in one place.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-lg">
                Track form, compare value to results, hunt bargains, and check injury chaos across Europe&apos;s top leagues in one place.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="bg-[var(--accent-hot)] text-black hover:bg-[rgb(0,220,116)]">
                  <Link href="/form">Start With Form</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-[var(--border-medium)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]">
                  <Link href="/value-analysis">
                    Open Value Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="border-[var(--border-medium)] bg-[rgba(13,17,23,0.86)] backdrop-blur-sm">
              <CardHeader>
                <Badge variant="outline" className="w-fit border-[var(--accent-blue)]/40 bg-[rgba(88,166,255,0.1)] text-[var(--accent-blue)]">
                  Value Analysis shortcuts
                </Badge>
                <CardTitle className="text-xl text-[var(--text-primary)]">Jump straight to the view you need</CardTitle>
                <CardDescription className="text-sm text-[var(--text-secondary)]">
                  Open Value Analysis with preset filters for bargains, overpriced players, and minutes-based flags.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Try these first</p>
                <div className="mt-3 space-y-2">
                  {valueAnalysisLinks.slice(0, 4).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group/quick flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] transition-transform group-hover/quick:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {snapshotTiles.map((item) => (
              <Card key={item.label} className="border-[var(--border-subtle)] bg-[rgba(13,17,23,0.85)] backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    {item.label}
                  </CardDescription>
                  <CardTitle className="text-2xl font-black text-[var(--text-primary)]">{item.value}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-[var(--text-secondary)]">{item.detail}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-12 sm:pt-16">
        <SectionHeading
          eyebrow="Explore"
          title="Everything you can explore"
          description="Every feature is here with plain-language explanations and direct links."
          action={{ href: "/value-analysis", label: "Open value analysis" }}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.href} feature={feature} />
          ))}
        </div>
      </section>

      <section className="pt-12 sm:pt-16">
        <SectionHeading
          eyebrow="Value Analysis"
          title="Popular value analysis links"
          description="Direct links to the most useful Value Analysis setups."
          action={{ href: "/value-analysis", label: "Open value analysis page" }}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {valueAnalysisLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-colors hover:bg-[var(--bg-card-hover)]"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Value Analysis
                </Badge>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">{item.label}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-12 sm:pt-16">
        <div className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-card)] p-5 sm:p-6">
          <h2 className="text-xl font-black text-[var(--text-primary)] sm:text-2xl">Jump to a page</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Pick where you want to start.</p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {entryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
