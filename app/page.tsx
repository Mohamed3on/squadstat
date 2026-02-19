import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock,
  HeartPulse,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { createPageMetadata } from "@/lib/metadata";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAnalysis } from "@/lib/form-analysis";
import { getTeamFormData } from "@/lib/team-form";
import { applyStatsToggles, getMinutesValueData, toPlayerStats } from "@/lib/fetch-minutes-value";
import { findValueCandidates } from "@/lib/value-analysis";
import { getInjuredPlayers } from "@/lib/injured";
import { getManagerInfo } from "@/lib/fetch-manager";
import type { ManagerInfo, MinutesValuePlayer, QualifiedTeam } from "@/app/types";

export const revalidate = 7200; // 2 hours — matches form/team-form cache

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

const MIN_VALUE_ANALYSIS_MINUTES = 260;

interface SnapshotItem {
  label: string;
  value: string;
  detail: string;
  metrics?: string[];
  href: string;
  imageUrl?: string;
  secondaryImageUrl?: string;
  imageContain?: boolean;
  manager?: ManagerInfo;
}

interface SnapshotGroup {
  title: string;
  description: string;
  href: string;
  items: SnapshotItem[];
}

interface InjuryTeamSummary {
  club: string;
  league: string;
  clubLogoUrl: string;
  totalValue: number;
  count: number;
}

function hasManagerRanking(manager: ManagerInfo): manager is ManagerInfo & {
  ppg: number;
  ppgRank: number;
  totalComparableManagers: number;
} {
  return (
    manager.ppg !== null &&
    manager.ppgRank !== undefined &&
    manager.totalComparableManagers !== undefined
  );
}

function ManagerSnapshotBadges({ manager }: { manager: ManagerInfo }) {
  const gamesText = `${manager.matches} ${manager.matches === 1 ? "game" : "games"}`;
  const hasRanking = hasManagerRanking(manager);
  const isOnly = hasRanking && manager.totalComparableManagers === 1;
  const isBest = hasRanking && manager.ppgRank === 1 && !isOnly;
  const isWorst = hasRanking && manager.ppgRank === manager.totalComparableManagers && !isBest && !isOnly;

  const ppgClassName = isBest
    ? "border-emerald-500/35 bg-emerald-500/12 text-emerald-300"
    : isWorst
    ? "border-rose-500/35 bg-rose-500/12 text-rose-300"
    : isOnly
    ? "border-sky-500/35 bg-sky-500/12 text-sky-300"
    : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]";

  const ppgText =
    manager.matches === 0
      ? "New manager"
      : manager.ppg === null
      ? gamesText
      : hasRanking
      ? `${manager.ppg.toFixed(2)} PPG (${manager.ppgRank}/${manager.totalComparableManagers}) · ${gamesText}`
      : `${manager.ppg.toFixed(2)} PPG · ${gamesText}`;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <a
        href={manager.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:text-[var(--text-primary)] ${manager.isCurrentManager ? "border-[rgba(88,166,255,0.35)] bg-[rgba(88,166,255,0.12)] text-[var(--accent-blue)]" : "border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)]"}`}
      >
        <span className="truncate">Mgr {manager.name}</span>
      </a>
      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${ppgClassName}`}>
        {ppgText}
      </span>
      {!manager.isCurrentManager && (
        <span className="inline-flex items-center rounded-md border border-rose-500/35 bg-rose-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
          Sacked
        </span>
      )}
    </div>
  );
}

function SnapshotItemRow({
  item,
  variant = "section",
}: {
  item: SnapshotItem;
  variant?: "hero" | "section";
}) {
  const isHero = variant === "hero";
  const Tag = isHero ? "div" : "article";
  return (
    <Tag
      className={`rounded-lg border border-[var(--border-subtle)] px-3 py-2 ${
        isHero
          ? "bg-[var(--bg-card)]"
          : "bg-[var(--bg-elevated)] transition-colors hover:bg-[var(--bg-card-hover)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className={`h-10 w-10 border border-[var(--border-subtle)] ${isHero ? "bg-[var(--bg-elevated)]" : "bg-[var(--bg-card)]"}`}>
            {item.imageUrl ? (
              <AvatarImage
                src={item.imageUrl}
                alt={item.value}
                className={item.imageContain ? "object-contain bg-white p-1" : undefined}
              />
            ) : (
              <AvatarFallback>{item.value.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          {item.secondaryImageUrl && (
            <Avatar className="absolute -bottom-1 -right-1 h-5 w-5 border border-[var(--border-subtle)] bg-white">
              <AvatarImage src={item.secondaryImageUrl} alt="" className="object-contain p-px" />
            </Avatar>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">{item.label}</p>
          <p className={`truncate font-semibold leading-tight text-[var(--text-primary)] ${!isHero ? "mt-0.5 text-sm" : ""}`}>
            {item.value}
          </p>
          <p className={`text-xs leading-tight text-[var(--text-secondary)] ${!isHero ? "mt-0.5" : ""}`}>
            {item.detail}
          </p>
          {item.metrics && item.metrics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.metrics.map((metric) => (
                <span
                  key={metric}
                  className={`rounded-md border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] ${
                    isHero ? "bg-[var(--bg-elevated)]" : "bg-[var(--bg-card)]"
                  }`}
                >
                  {metric}
                </span>
              ))}
            </div>
          )}
          {item.manager && <ManagerSnapshotBadges manager={item.manager} />}
          <Link
            href={item.href}
            className="group/link mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-blue)] transition-colors hover:text-[var(--text-primary)]"
          >
            Explore
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </Tag>
  );
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatMarketValueNum(value: number): string {
  if (value >= 1_000_000_000) return `€${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

function formatMinutes(value?: number): string {
  if (value === undefined) return "0";
  return value.toLocaleString();
}

function getNpga(player: Pick<MinutesValuePlayer, "goals" | "assists" | "penaltyGoals">): number {
  return player.goals - (player.penaltyGoals ?? 0) + player.assists;
}

function sortByNpgaDesc(players: MinutesValuePlayer[]): MinutesValuePlayer[] {
  return [...players].sort((a, b) => {
    const npgaDiff = getNpga(b) - getNpga(a);
    if (npgaDiff !== 0) return npgaDiff;
    return b.marketValue - a.marketValue;
  });
}

function pickRecentPeriodHighlights(analysis: Awaited<ReturnType<typeof getAnalysis>> | null): {
  period: number | null;
  topTeams: QualifiedTeam[];
  bottomTeams: QualifiedTeam[];
} {
  if (!analysis || analysis.analysis.length === 0) {
    return { period: null, topTeams: [], bottomTeams: [] };
  }

  const periodData = analysis.matchedPeriod !== null
    ? analysis.analysis.find((p) => p.period === analysis.matchedPeriod)
    : analysis.analysis[0];
  if (!periodData) return { period: null, topTeams: [], bottomTeams: [] };

  const topTeams = [...periodData.topTeams].sort(
    (a, b) => b.stats.points - a.stats.points || b.stats.goalDiff - a.stats.goalDiff
  );
  const bottomTeams = [...periodData.bottomTeams].sort(
    (a, b) => a.stats.points - b.stats.points || a.stats.goalDiff - b.stats.goalDiff
  );

  return { period: periodData.period, topTeams, bottomTeams };
}

function pickWithTies<T>(
  items: T[],
  metric: (item: T) => number,
  direction: "top" | "bottom",
  opts?: { sort?: (a: T, b: T) => number; max?: number },
): T[] {
  if (items.length === 0) return [];
  const targetValue = items.reduce(
    (acc, item) => {
      const v = metric(item);
      return direction === "top" ? Math.max(acc, v) : Math.min(acc, v);
    },
    direction === "top" ? -Infinity : Infinity,
  );
  const tied = items.filter((item) => metric(item) === targetValue);
  const sorted = opts?.sort ? [...tied].sort(opts.sort) : tied;
  return opts?.max ? sorted.slice(0, opts.max) : sorted;
}

const MAX_PLAYER_CATEGORIES = 5;

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
] as const;

const entryLinks = [
  { href: "/form", label: "Recent Form" },
  { href: "/team-form", label: "Value vs Table" },
  { href: "/players", label: "Player Explorer" },
  { href: "/value-analysis", label: "Value Analysis" },
  { href: "/injured", label: "Injury Impact" },
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

export default async function Home() {
  const [analysisResult, teamFormResult, playersResult, injuredResult] = await Promise.allSettled([
    getAnalysis(),
    getTeamFormData(),
    getMinutesValueData(),
    getInjuredPlayers(),
  ]);

  const analysisData = analysisResult.status === "fulfilled" ? analysisResult.value : null;
  if (analysisResult.status === "rejected") console.error("[Home] getAnalysis failed:", analysisResult.reason);
  const teamFormData = teamFormResult.status === "fulfilled" ? teamFormResult.value : null;
  if (teamFormResult.status === "rejected") console.error("[Home] getTeamFormData failed:", teamFormResult.reason);
  const players = playersResult.status === "fulfilled" ? playersResult.value : [];
  if (playersResult.status === "rejected") console.error("[Home] getMinutesValueData failed:", playersResult.reason);
  const injuredPlayers = injuredResult.status === "fulfilled" ? injuredResult.value.players : [];
  if (injuredResult.status === "rejected") console.error("[Home] getInjuredPlayers failed:", injuredResult.reason);

  const { period: recentPeriod, topTeams: recentTopTeams, bottomTeams: recentBottomTeams } =
    pickRecentPeriodHighlights(analysisData);
  const recentTopTeam = recentTopTeams[0] ?? null;

  const managerByClubId = new Map<string, ManagerInfo | null>();
  for (const team of [...(teamFormData?.overperformers ?? []), ...(teamFormData?.underperformers ?? [])]) {
    if (!team.clubId) continue;
    managerByClubId.set(team.clubId, team.manager ?? null);
  }

  const recentSnapshotTeams = [...recentTopTeams, ...recentBottomTeams];
  const missingManagerClubIds = [...new Set(
    recentSnapshotTeams
      .map((team) => team.clubId)
      .filter((clubId) => clubId && !managerByClubId.has(clubId))
  )];
  if (missingManagerClubIds.length > 0) {
    const managerResults = await Promise.allSettled(missingManagerClubIds.map((clubId) => getManagerInfo(clubId)));
    missingManagerClubIds.forEach((clubId, index) => {
      const result = managerResults[index];
      if (result?.status === "fulfilled") {
        managerByClubId.set(clubId, result.value);
      } else {
        console.error(`[Home] getManagerInfo failed for club ${clubId}:`, result?.reason);
        managerByClubId.set(clubId, null);
      }
    });
  }
  const getManagerForClub = (clubId?: string): ManagerInfo | undefined =>
    clubId ? (managerByClubId.get(clubId) ?? undefined) : undefined;

  const mostOverperformingTeams = pickWithTies(
    teamFormData?.overperformers ?? [],
    (team) => team.deltaPts,
    "top",
    { sort: (a, b) => b.points - a.points || b.marketValueNum - a.marketValueNum },
  );
  const mostUnderperformingTeams = pickWithTies(
    teamFormData?.underperformers ?? [],
    (team) => team.deltaPts,
    "bottom",
    { sort: (a, b) => a.points - b.points || a.marketValueNum - b.marketValueNum },
  );
  const mostOverperformingTeam = mostOverperformingTeams[0] ?? null;

  const statsNoPenNoIntl = applyStatsToggles(players.map(toPlayerStats), {
    includePen: false,
    includeIntl: false,
  });
  const underperformerCandidates = findValueCandidates(statsNoPenNoIntl, {
    candidateOutperforms: false,
    minMinutes: MIN_VALUE_ANALYSIS_MINUTES,
    sortAsc: false,
  });
  const overperformerCandidates = findValueCandidates(statsNoPenNoIntl, {
    candidateOutperforms: true,
    sortAsc: true,
  });

  const mostOverpricedPlayers = pickWithTies(
    underperformerCandidates,
    (player) => player.count,
    "top",
    { sort: (a, b) => b.marketValue - a.marketValue },
  );
  const mostBargainPlayers = pickWithTies(
    overperformerCandidates,
    (player) => player.count,
    "top",
    { sort: (a, b) => b.points - a.points || a.marketValue - b.marketValue },
  );
  const mostOverpricedPlayer = mostOverpricedPlayers[0] ?? null;

  const playersByNpga = sortByNpgaDesc(players);
  const mostNpgaPlayers = pickWithTies(playersByNpga, (player) => getNpga(player), "top", {
    sort: (a, b) => b.marketValue - a.marketValue,
  });
  const mostNpgaPlayer = mostNpgaPlayers[0] ?? null;
  const mostNpgaSignings = pickWithTies(
    players.filter((p) => p.isNewSigning),
    (player) => getNpga(player),
    "top",
    { sort: (a, b) => b.marketValue - a.marketValue },
  );
  const mostValuableLoans = pickWithTies(
    players.filter((p) => p.isOnLoan),
    (player) => player.marketValue,
    "top",
    { sort: (a, b) => getNpga(b) - getNpga(a) || b.minutes - a.minutes },
  );

  const zeroCapsPlayers = players.filter((p) => (p.intlCareerCaps ?? 0) === 0);
  const mostValuableZeroCapsPlayers = pickWithTies(
    zeroCapsPlayers,
    (player) => player.marketValue,
    "top",
    { sort: (a, b) => getNpga(b) - getNpga(a) },
  );
  const mostNpgaZeroCapsPlayers = pickWithTies(
    sortByNpgaDesc(zeroCapsPlayers),
    (player) => getNpga(player),
    "top",
    { sort: (a, b) => b.marketValue - a.marketValue },
  );

  const mostValuableInjuredPlayers = pickWithTies(
    injuredPlayers,
    (player) => player.marketValueNum,
    "top",
    { sort: (a, b) => a.name.localeCompare(b.name) },
  );

  const injuryTeamMap = new Map<string, InjuryTeamSummary>();
  for (const player of injuredPlayers) {
    const key = `${player.league}::${player.club}`;
    const existing = injuryTeamMap.get(key);
    if (existing) {
      existing.totalValue += player.marketValueNum;
      existing.count += 1;
      continue;
    }
    injuryTeamMap.set(key, {
      club: player.club,
      league: player.league,
      clubLogoUrl: player.clubLogoUrl,
      totalValue: player.marketValueNum,
      count: 1,
    });
  }
  const injuryTeams = [...injuryTeamMap.values()];
  const mostAffectedInjuryTeams = pickWithTies(
    injuryTeams,
    (team) => team.totalValue,
    "top",
    { sort: (a, b) => b.count - a.count || a.club.localeCompare(b.club) },
  );

  // --- Hero snapshots (top-right card) ---
  const heroSnapshots: SnapshotItem[] = [];
  if (recentTopTeam && recentPeriod !== null) {
    heroSnapshots.push({
      label: `Hottest team (last ${recentPeriod})`,
      value: recentTopTeam.name,
      detail: `${recentTopTeam.stats.points} pts · GD ${formatSigned(recentTopTeam.stats.goalDiff)}`,
      href: "/form",
      imageUrl: recentTopTeam.logoUrl,
      imageContain: true,
      manager: getManagerForClub(recentTopTeam.clubId),
    });
  }
  if (mostOverperformingTeam) {
    heroSnapshots.push({
      label: "Biggest overperformer",
      value: mostOverperformingTeam.name,
      detail: `${mostOverperformingTeam.league} · ${formatSigned(mostOverperformingTeam.deltaPts)} pts vs expected`,
      href: "/team-form",
      imageUrl: mostOverperformingTeam.logoUrl,
      imageContain: true,
      manager: getManagerForClub(mostOverperformingTeam.clubId),
    });
  }
  if (mostOverpricedPlayer) {
    heroSnapshots.push({
      label: "Most overpriced player",
      value: mostOverpricedPlayer.name,
      detail: `${mostOverpricedPlayer.marketValueDisplay} · ${mostOverpricedPlayer.count} cheaper peers outscore`,
      href: "/value-analysis?mode=ga",
      imageUrl: mostOverpricedPlayer.imageUrl,
      secondaryImageUrl: mostOverpricedPlayer.clubLogoUrl,
    });
  }
  if (mostNpgaPlayer) {
    heroSnapshots.push({
      label: "Top scorer (npG+A)",
      value: mostNpgaPlayer.name,
      detail: `${mostNpgaPlayer.club} · ${getNpga(mostNpgaPlayer)} npG+A`,
      href: "/players?sort=ga",
      imageUrl: mostNpgaPlayer.imageUrl,
      secondaryImageUrl: mostNpgaPlayer.clubLogoUrl,
    });
  }

  // --- Section snapshot items (ties always shown; Player Explorer capped by category count) ---
  const recentFormItems: SnapshotItem[] = [];
  if (recentPeriod !== null) {
    recentTopTeams.forEach((team) => {
      recentFormItems.push({
        label: "Hottest team",
        value: team.name,
        detail: `${team.league} · ${team.stats.points} pts · GD ${formatSigned(team.stats.goalDiff)} in last ${recentPeriod}`,
        metrics: team.criteria,
        href: "/form",
        imageUrl: team.logoUrl,
        imageContain: true,
        manager: getManagerForClub(team.clubId),
      });
    });
    recentBottomTeams.forEach((team) => {
      recentFormItems.push({
        label: "Coldest team",
        value: team.name,
        detail: `${team.league} · ${team.stats.points} pts · GD ${formatSigned(team.stats.goalDiff)} in last ${recentPeriod}`,
        metrics: team.criteria,
        href: "/form",
        imageUrl: team.logoUrl,
        imageContain: true,
        manager: getManagerForClub(team.clubId),
      });
    });
  }

  const teamFormItems: SnapshotItem[] = [];
  mostOverperformingTeams.forEach((team) => {
    teamFormItems.push({
      label: "Biggest overperformer",
      value: team.name,
      detail: `${team.league} · ${formatSigned(team.deltaPts)} pts vs expected`,
      href: "/team-form",
      imageUrl: team.logoUrl,
      imageContain: true,
      manager: getManagerForClub(team.clubId),
    });
  });
  mostUnderperformingTeams.forEach((team) => {
    teamFormItems.push({
      label: "Biggest underperformer",
      value: team.name,
      detail: `${team.league} · ${formatSigned(team.deltaPts)} pts vs expected`,
      href: "/team-form",
      imageUrl: team.logoUrl,
      imageContain: true,
      manager: getManagerForClub(team.clubId),
    });
  });

  const valueAnalysisItems: SnapshotItem[] = [];
  mostOverpricedPlayers.forEach((player) => {
    valueAnalysisItems.push({
      label: "Most overpriced",
      value: player.name,
      detail: `${player.club} · ${player.marketValueDisplay}`,
      metrics: [`npG+A ${player.points}`, `${formatMinutes(player.minutes)} mins`, `${player.count} cheaper peers outscore`],
      href: "/value-analysis?mode=ga",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  mostBargainPlayers.forEach((player) => {
    valueAnalysisItems.push({
      label: "Best bargain",
      value: player.name,
      detail: `${player.club} · ${player.marketValueDisplay}`,
      metrics: [`npG+A ${player.points}`, `${formatMinutes(player.minutes)} mins`, `outscores ${player.count} pricier peers`],
      href: "/value-analysis?mode=ga&dTab=bargains",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });

  const playerCategories: SnapshotItem[][] = [];
  const npgaItems: SnapshotItem[] = [];
  mostNpgaPlayers.forEach((player) => {
    npgaItems.push({
      label: "Top scorer (npG+A)",
      value: player.name,
      detail: `${player.club} · ${getNpga(player)} npG+A`,
      metrics: [`${formatMinutes(player.minutes)} mins`, player.marketValueDisplay],
      href: "/players?sort=ga",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  if (npgaItems.length) playerCategories.push(npgaItems);

  const signingItems: SnapshotItem[] = [];
  mostNpgaSignings.forEach((player) => {
    signingItems.push({
      label: "Top scoring signing",
      value: player.name,
      detail: `${player.club} · ${getNpga(player)} npG+A`,
      metrics: [`${formatMinutes(player.minutes)} mins`, player.marketValueDisplay],
      href: "/players?signing=transfer&sort=ga",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  if (signingItems.length) playerCategories.push(signingItems);

  const loanItems: SnapshotItem[] = [];
  mostValuableLoans.forEach((player) => {
    loanItems.push({
      label: "Most valuable loan",
      value: player.name,
      detail: `${player.club} · ${player.marketValueDisplay}`,
      metrics: [`npG+A ${getNpga(player)}`, `${formatMinutes(player.minutes)} mins`],
      href: "/players?signing=loan&sort=value",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  if (loanItems.length) playerCategories.push(loanItems);

  const uncappedValueItems: SnapshotItem[] = [];
  mostValuableZeroCapsPlayers.forEach((player) => {
    uncappedValueItems.push({
      label: "Most valuable uncapped",
      value: player.name,
      detail: `${player.club} · ${player.marketValueDisplay}`,
      metrics: [`npG+A ${getNpga(player)}`, `${formatMinutes(player.minutes)} mins`],
      href: "/players?sort=value&maxcaps=0",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  if (uncappedValueItems.length) playerCategories.push(uncappedValueItems);

  const uncappedScorerItems: SnapshotItem[] = [];
  mostNpgaZeroCapsPlayers.forEach((player) => {
    uncappedScorerItems.push({
      label: "Top scoring uncapped",
      value: player.name,
      detail: `${player.club} · ${getNpga(player)} npG+A`,
      metrics: [`${formatMinutes(player.minutes)} mins`, player.marketValueDisplay],
      href: "/players?sort=ga&maxcaps=0",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  if (uncappedScorerItems.length) playerCategories.push(uncappedScorerItems);

  const playerItems = playerCategories.slice(0, MAX_PLAYER_CATEGORIES).flat();

  const injuryItems: SnapshotItem[] = [];
  mostValuableInjuredPlayers.forEach((player) => {
    injuryItems.push({
      label: "Most valuable injured",
      value: player.name,
      detail: `${player.club} · ${player.marketValue}`,
      metrics: [player.injury],
      href: "/injured?tab=players",
      imageUrl: player.imageUrl,
      secondaryImageUrl: player.clubLogoUrl,
    });
  });
  mostAffectedInjuryTeams.forEach((team) => {
    injuryItems.push({
      label: "Hardest hit club",
      value: team.club,
      detail: `${team.league} · ${formatMarketValueNum(team.totalValue)} lost · ${team.count} injured`,
      href: "/injured?tab=teams",
      imageUrl: team.clubLogoUrl,
      imageContain: true,
    });
  });

  const snapshotGroups: SnapshotGroup[] = [];
  if (recentFormItems.length) {
    snapshotGroups.push({
      title: "Recent Form",
      description: "Best and worst teams from the current form window.",
      href: "/form",
      items: recentFormItems,
    });
  }
  if (teamFormItems.length) {
    snapshotGroups.push({
      title: "Value vs Table",
      description: "Teams most above or below value-based expectation.",
      href: "/team-form",
      items: teamFormItems,
    });
  }
  if (valueAnalysisItems.length) {
    snapshotGroups.push({
      title: "Value Analysis",
      description: "Most overpriced players and best bargains by peer comparison.",
      href: "/value-analysis",
      items: valueAnalysisItems,
    });
  }
  if (playerItems.length) {
    snapshotGroups.push({
      title: "Player Explorer",
      description: "Top performers, signings, loans, and uncapped players.",
      href: "/players",
      items: playerItems,
    });
  }
  if (injuryItems.length) {
    snapshotGroups.push({
      title: "Injury Impact",
      description: "The most valuable sidelined players and hardest-hit clubs.",
      href: "/injured",
      items: injuryItems,
    });
  }

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
                Track form, spot overpriced players, find bargains, and check injury chaos — backed by daily Transfermarkt data.
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
                  Live snapshots
                </Badge>
                <CardTitle className="text-xl text-[var(--text-primary)]">Today&apos;s highlights</CardTitle>
                <CardDescription className="text-sm text-[var(--text-secondary)]">
                  The standout names across form, value, and output right now.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Right now</p>
                <div className="mt-3 space-y-2">
                  {heroSnapshots.length > 0 ? (
                    heroSnapshots.map((item) => (
                      <SnapshotItemRow
                        key={`${item.label}-${item.value}`}
                        item={item}
                        variant="hero"
                      />
                    ))
                  ) : (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-muted)]">
                      No snapshot data available right now. Open a section below for full details.
                    </div>
                  )}
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
          description="Every feature with plain-language explanations and direct links."
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
          eyebrow="Live data"
          title="Current leaders"
          description="Standouts from each section — scan the headlines, then dive deeper."
        />

        {snapshotGroups.length > 0 ? (
          <div className="columns-1 gap-4 lg:columns-2">
            {snapshotGroups.map((group) => (
              <Card key={group.title} className="mb-4 break-inside-avoid border-[var(--border-subtle)] bg-[var(--bg-card)]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-[var(--text-primary)]">{group.title}</CardTitle>
                      <CardDescription className="mt-1 text-sm text-[var(--text-secondary)]">
                        {group.description}
                      </CardDescription>
                    </div>
                    <Link
                      href={group.href}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--accent-blue)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.items.map((item) => (
                    <SnapshotItemRow
                      key={`${group.title}-${item.label}-${item.value}`}
                      item={item}
                      variant="section"
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
            Snapshot data is temporarily unavailable. Open a section for full live tables.
          </div>
        )}
      </section>

      <section className="pt-12 sm:pt-16">
        <div className="rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-card)] p-5 sm:p-6">
          <h2 className="text-xl font-black text-[var(--text-primary)] sm:text-2xl">Jump to a page</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Pick where you want to start.</p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
