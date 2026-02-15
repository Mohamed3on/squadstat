import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Scale,
  Activity,
  Clock,
  HeartPulse,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Home",
  description:
    "FormTracker helps you scan recent form, value efficiency, injuries, and minutes trends across Europe's top football leagues.",
};

const pages = [
  {
    title: "Recent Form",
    href: "/form",
    tag: "FORM",
    description:
      "Who's hot and who's not. Compare form over 5, 10, 15, and 20-match windows across all leagues.",
    detail: "Spot momentum shifts before the table does.",
    icon: Activity,
    accentVar: "--accent-hot",
    glowVar: "--accent-hot-glow",
  },
  {
    title: "Value vs Table",
    href: "/team-form",
    tag: "VALUE",
    description:
      "Actual league points vs expected points derived from squad market value rank.",
    detail: "Who is punching above their weight?",
    icon: Scale,
    accentVar: "--accent-blue",
    glowVar: "--accent-blue",
  },
  {
    title: "Player Explorer",
    href: "/players",
    tag: "PLAYERS",
    description:
      "Browse and sort 500+ elite players by value, minutes, games, and G+A across Europe's top leagues.",
    detail: "Filter by league, club, or top 5.",
    icon: Clock,
    accentVar: "--accent-hot",
    glowVar: "--accent-hot-glow",
  },
  {
    title: "Value Analysis",
    href: "/value-analysis",
    tag: "OUTPUT",
    description:
      "Find overpriced players and hidden bargains — two lenses (G+A and minutes) to spot who's overpaid and who punches above their price tag.",
    detail: "Overpriced vs bargain players.",
    icon: TrendingUp,
    accentVar: "--accent-gold",
    glowVar: "--accent-gold",
  },
  {
    title: "Injury Impact",
    href: "/injured",
    tag: "INJURIES",
    description:
      "Where injury absences represent the biggest market-value hit across squads.",
    detail: "Impact by player, team, and injury type.",
    icon: HeartPulse,
    accentVar: "--accent-cold",
    glowVar: "--accent-cold-glow",
  },
] as const;

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Large radial glow behind hero */}
      <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,255,135,0.07)_0%,transparent_70%)]" />
      {/* Diagonal accent line */}
      <div className="absolute top-20 right-0 h-px w-80 origin-right rotate-[-20deg] bg-gradient-to-l from-[var(--accent-hot)] via-[rgba(0,255,135,0.2)] to-transparent opacity-40" />
      <div className="absolute top-52 left-0 h-px w-60 origin-left rotate-[15deg] bg-gradient-to-r from-[var(--accent-cold)] via-[rgba(255,71,87,0.2)] to-transparent opacity-30" />
      {/* Floating data dots */}
      <div className="absolute top-32 right-[15%] h-1.5 w-1.5 rounded-full bg-[var(--accent-hot)] opacity-60 animate-float" />
      <div className="absolute top-48 right-[25%] h-1 w-1 rounded-full bg-[var(--accent-blue)] opacity-40 animate-float [animation-delay:1s]" />
      <div className="absolute top-24 left-[20%] h-1 w-1 rounded-full bg-[var(--accent-gold)] opacity-50 animate-float [animation-delay:0.5s]" />
    </div>
  );
}

function MiniBar({ height, delay, color }: { height: string; delay: string; color: string }) {
  return (
    <div
      className="w-1 rounded-full animate-slide-up"
      style={{
        height,
        animationDelay: delay,
        background: color,
        opacity: 0.7,
      }}
    />
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
        <HeroVisual />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
          {/* Live tag */}
          <div className="mb-5 flex items-center gap-2 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-hot)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-hot)]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-hot)]">
              Live across 5 leagues
            </span>
          </div>

          <h1 className="animate-slide-up text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Football Signals,
            <br />
            <span className="bg-gradient-to-r from-[var(--accent-hot)] via-[var(--accent-blue)] to-[var(--accent-gold)] bg-clip-text text-transparent">
              Not Noise.
            </span>
          </h1>

          <p className="mt-5 max-w-xl animate-slide-up text-base text-[var(--text-secondary)] sm:text-lg [animation-delay:0.08s]">
            Cut through the noise. Five analytical lenses on Europe&rsquo;s top leagues &mdash;
            form, team value, player output, minutes, and injury impact &mdash; updated daily from Transfermarkt.
          </p>

          {/* Mini stat preview */}
          <div className="mt-8 flex flex-wrap gap-3 animate-slide-up [animation-delay:0.15s]">
            {(["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1"] as const).map(
              (league) => (
                <span
                  key={league}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                >
                  {league}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Cards Grid ── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-subtle)] to-transparent" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Analytical Tools
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-[var(--border-subtle)] to-transparent" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page, i) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.href}
                href={page.href}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all duration-200 hover:bg-[var(--bg-card-hover)] animate-slide-up hover-lift"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                {/* Top accent line */}
                <div
                  className="h-0.5 w-full opacity-60 transition-opacity group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, var(${page.accentVar}), transparent)`,
                  }}
                />

                <div className="flex flex-1 flex-col p-5">
                  {/* Icon + tag row */}
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                      style={{
                        background: `color-mix(in srgb, var(${page.accentVar}) 12%, transparent)`,
                        color: `var(${page.accentVar})`,
                      }}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{
                        background: `color-mix(in srgb, var(${page.accentVar}) 8%, transparent)`,
                        color: `var(${page.accentVar})`,
                        border: `1px solid color-mix(in srgb, var(${page.accentVar}) 20%, transparent)`,
                      }}
                    >
                      {page.tag}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {page.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {page.description}
                  </p>
                  <p className="mt-1.5 text-xs text-[var(--text-muted)] italic">
                    {page.detail}
                  </p>

                  {/* Bottom arrow */}
                  <div className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-semibold transition-colors" style={{ color: `var(${page.accentVar})` }}>
                    <span className="uppercase tracking-wider">Explore</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* "How it works" card — fills the 6th slot on large screens */}
          <div className="relative flex flex-col overflow-hidden rounded-xl border border-dashed border-[var(--border-medium)] bg-[var(--bg-elevated)] p-5 animate-slide-up [animation-delay:0.25s]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              How it works
            </div>
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[10px] font-bold text-[var(--accent-hot)]">1</span>
                <span>Data pulled daily from Transfermarkt</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[10px] font-bold text-[var(--accent-blue)]">2</span>
                <span>Crunched into form signals and value metrics</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-[10px] font-bold text-[var(--accent-gold)]">3</span>
                <span>Over &amp; underperformance surfaced instantly</span>
              </div>
            </div>
            {/* Mini decorative bar chart */}
            <div className="mt-auto flex items-end gap-1 pt-6 opacity-40">
              <MiniBar height="12px" delay="0s" color="var(--accent-cold)" />
              <MiniBar height="20px" delay="0.05s" color="var(--accent-cold)" />
              <MiniBar height="16px" delay="0.1s" color="var(--accent-blue)" />
              <MiniBar height="28px" delay="0.15s" color="var(--accent-hot)" />
              <MiniBar height="36px" delay="0.2s" color="var(--accent-hot)" />
              <MiniBar height="24px" delay="0.25s" color="var(--accent-blue)" />
              <MiniBar height="32px" delay="0.3s" color="var(--accent-hot)" />
              <MiniBar height="18px" delay="0.35s" color="var(--accent-gold)" />
              <MiniBar height="40px" delay="0.4s" color="var(--accent-hot)" />
              <MiniBar height="14px" delay="0.45s" color="var(--accent-cold)" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
