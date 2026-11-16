import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Crown, Medal, TrendingDown, TrendingUp } from "lucide-react";
import { DetailHero, DetailPageShell } from "@/components/DetailHero";
import { createPageMetadata } from "@/lib/metadata";
import { getLeistungsdatenUrl } from "@/lib/format";
import { getNationalTeamLinks } from "@/lib/national-teams";
import { getPlayerDetailData, type PlayerRankings } from "@/lib/player-detail";
import { paramsToScope } from "@/lib/comparison-scope";
import { enrichRecentMatches } from "@/lib/player-recent-matches";
import { displayAvailable } from "@/lib/filter-players";
import { MIN_COMPARISON_COUNT } from "@/lib/value-analysis";
import { InfoTip } from "@/app/components/InfoTip";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { LeagueBadge } from "@/components/LeagueBadge";
import { PlayerSubtitle } from "@/components/PlayerSubtitle";
import { timeAgo } from "@/app/components/DataLastUpdated";
import { ComparisonPanels } from "./ComparisonPanels";
import { HeroVerdict } from "./HeroVerdict";
import { MinutesBenchmarkSection } from "./MinutesBenchmarkSection";
import { DetailSection } from "@/components/DetailSection";
import { readData } from "@/lib/data";
import { seasonLabel } from "@/lib/fee-vs-value-rankings";
import { HeroMetric } from "@/components/HeroMetric";
import { EmptyNote } from "@/components/EmptyNote";
import { Disclosure } from "@/components/Disclosure";
import { SignalBadge } from "@/components/SignalBadge";
import { TeamLogo } from "@/components/TeamLogo";
import type { RecentGameStats } from "@/app/types";
import { POSITION_NAMES } from "@/lib/player-aggregation";
import { PlayerInjuryBadge } from "./PlayerInjuryBadge";
import { PlayerTransferBadges } from "./PlayerTransferBadges";
import { effectivePosition, getBroadPositionFilter, getBroadPositionGroup } from "@/lib/positions";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site-config";

// Gold is the top-3 accolade; below the podium a rank only gets brighter or dimmer.
function rankColor(rank: number, total: number): string {
  const pct = rank / total;
  if (rank <= 3) return "text-accent-gold";
  if (pct <= 0.15) return "text-text-primary";
  if (pct <= 0.4) return "text-text-secondary";
  return "text-text-muted";
}

function RankBadge({
  rank,
  total,
  className,
}: {
  rank: number;
  total: number;
  className?: string;
}) {
  return (
    <span className={`font-value ${rankColor(rank, total)} ${className ?? ""}`}>
      {rank === 1 && <Crown className="mr-0.5 inline h-3 w-3" />}
      {rank > 1 && rank <= 3 && <Medal className="mr-0.5 inline h-3 w-3" />}#{rank}
    </span>
  );
}

function GoalBreakdown({ goals, penaltyGoals }: { goals: number; penaltyGoals: number }) {
  const openPlay = goals - penaltyGoals;
  if (goals === 0) return <span className="text-text-muted">0</span>;
  return (
    <>
      {openPlay > 0 && <span className="text-accent-hot">{openPlay}</span>}
      {penaltyGoals > 0 && (
        <span className="text-text-secondary">
          {openPlay > 0 ? "+" : ""}
          {penaltyGoals}
          <abbr title="penalty" className="no-underline">
            P
          </abbr>
        </span>
      )}
    </>
  );
}

function RankCell({ rank, total, href }: { rank: number; total: number; href?: string }) {
  return (
    <TableCell className="text-right whitespace-nowrap">
      {href ? (
        <Link href={href} className="transition-opacity hover:opacity-70">
          <RankBadge rank={rank} total={total} />
        </Link>
      ) : (
        <RankBadge rank={rank} total={total} />
      )}
    </TableCell>
  );
}

const RANKING_METRICS: Array<{
  overallKey: keyof PlayerRankings;
  leagueKey: keyof PlayerRankings;
  clubKey: keyof PlayerRankings;
  positionKey: keyof PlayerRankings;
  label: string;
  shortLabel: string;
  sortKey: string | null;
}> = [
  {
    overallKey: "marketValueOverall",
    leagueKey: "marketValueLeague",
    clubKey: "marketValueClub",
    positionKey: "marketValuePosition",
    label: "Market value",
    shortLabel: "Value",
    sortKey: "value",
  },
  {
    overallKey: "npgaOverall",
    leagueKey: "npgaLeague",
    clubKey: "npgaClub",
    positionKey: "npgaPosition",
    label: "npG+A",
    shortLabel: "npG+A",
    sortKey: "ga",
  },
  {
    overallKey: "pointsOverall",
    leagueKey: "pointsLeague",
    clubKey: "pointsClub",
    positionKey: "pointsPosition",
    label: "G+A",
    shortLabel: "G+A",
    sortKey: "ga",
  },
  {
    overallKey: "minutesOverall",
    leagueKey: "minutesLeague",
    clubKey: "minutesClub",
    positionKey: "minutesPosition",
    label: "Minutes",
    shortLabel: "Mins",
    sortKey: "mins",
  },
  {
    overallKey: "goalsOverall",
    leagueKey: "goalsLeague",
    clubKey: "goalsClub",
    positionKey: "goalsPosition",
    label: "Goals",
    shortLabel: "Goals",
    sortKey: "ga",
  },
  {
    overallKey: "assistsOverall",
    leagueKey: "assistsLeague",
    clubKey: "assistsClub",
    positionKey: "assistsPosition",
    label: "Assists",
    shortLabel: "Asst",
    sortKey: "ga",
  },
  {
    overallKey: "form5Overall",
    leagueKey: "form5League",
    clubKey: "form5Club",
    positionKey: "form5Position",
    label: "Last 5 npG+A",
    shortLabel: "L5",
    sortKey: "ga&fw=5",
  },
  {
    overallKey: "form10Overall",
    leagueKey: "form10League",
    clubKey: "form10Club",
    positionKey: "form10Position",
    label: "Last 10 npG+A",
    shortLabel: "L10",
    sortKey: "ga&fw=10",
  },
];

const metricId = (m: (typeof RANKING_METRICS)[number]) => m.overallKey.replace(/Overall$/, "");

/** The rankings shown up front, by role; the rest wait behind "More rankings". Goals and assists
 *  aren't a keeper's or a defender's job, so their pages lead with value and minutes. */
const UP_FRONT_RANKINGS = {
  goalkeepers: ["marketValue", "minutes"],
  defenders: ["marketValue", "minutes", "npga", "form5"],
  outfield: ["marketValue", "npga", "minutes", "form5"],
};

function formatShortDate(value: string): string {
  if (!value) return "Unknown";
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

type NationLinks = Record<string, { name: string; href: string }>;

/** A footer row of the match log: a window's totals, npG+A first. */
type FormTotal = {
  label: string;
  npga: number;
  goals: number;
  pens: number;
  assists: number;
  mins: number;
};

function RecentMatchRow({ match, nations }: { match: RecentGameStats; nations: NationLinks }) {
  const hasScore = match.teamGoals !== undefined && match.opponentGoals !== undefined;
  const resultLabel = hasScore
    ? match.teamGoals! > match.opponentGoals!
      ? "W"
      : match.teamGoals! < match.opponentGoals!
        ? "L"
        : "D"
    : null;
  const resultTone =
    resultLabel === "W"
      ? "border-accent-hot-border bg-accent-hot-glow text-accent-hot"
      : resultLabel === "L"
        ? "border-accent-cold-border bg-accent-cold-glow text-accent-cold-soft"
        : "border-border-subtle bg-card text-text-secondary";
  const venuePrefix = match.venue === "away" ? "at " : "vs ";
  // A national-team opponent (in a major tournament) has a page of its own.
  const opponentHref = match.opponentClubId
    ? (nations[match.opponentClubId]?.href ?? `/teams/${match.opponentClubId}`)
    : null;
  const date = formatShortDate(match.date);
  const detail = [
    match.competitionName || match.competitionId,
    match.gameDay ? `MD ${match.gameDay}` : null,
    match.positionId ? POSITION_NAMES[match.positionId] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TableRow>
      <TableCell className="hidden whitespace-nowrap text-text-secondary sm:table-cell">
        {date}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <TeamLogo src={match.opponentLogoUrl} alt={match.opponentName} />
          <div className="min-w-0">
            <p className="text-text-primary">
              {match.opponentName ? (
                <>
                  {venuePrefix}
                  {opponentHref ? (
                    <Link href={opponentHref} className="hover:underline">
                      {match.opponentName}
                    </Link>
                  ) : (
                    match.opponentName
                  )}
                </>
              ) : (
                "Opponent unavailable"
              )}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="sm:hidden">
                {date}
                {detail && " · "}
              </span>
              {detail}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">
        {hasScore && (
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 font-value text-xs ${resultTone}`}
          >
            {resultLabel} {match.teamGoals}:{match.opponentGoals}
          </span>
        )}
      </TableCell>
      <TableCell
        className={`text-right font-value ${match.minutes >= 70 ? "text-text-primary" : "text-text-secondary"}`}
      >
        {match.minutes}&apos;
      </TableCell>
      <TableCell className="text-right font-value">
        <GoalBreakdown goals={match.goals} penaltyGoals={match.penaltyGoals ?? 0} />
      </TableCell>
      <TableCell
        className={`text-right font-value ${match.assists > 0 ? "text-accent-hot" : "text-text-muted"}`}
      >
        {match.assists}
      </TableCell>
      <TableCell className="hidden text-right sm:table-cell">
        {match.matchReportUrl && (
          <a
            href={match.matchReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Match report: ${venuePrefix}${match.opponentName ?? "opponent"}, ${date}`}
            className="inline-flex p-1 text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </TableCell>
    </TableRow>
  );
}

function RecentMatches({
  matches,
  nations,
  totals,
}: {
  matches: RecentGameStats[];
  nations: NationLinks;
  totals: FormTotal[];
}) {
  const recentMatches = enrichRecentMatches(matches);

  if (recentMatches.length === 0) {
    return <EmptyNote>No recent match log is stored for this player.</EmptyNote>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden text-left sm:table-cell">Date</TableHead>
          <TableHead className="text-left">Match</TableHead>
          <TableHead className="text-right">Result</TableHead>
          <TableHead className="text-right">Mins</TableHead>
          <TableHead className="text-right">G</TableHead>
          <TableHead className="text-right">A</TableHead>
          <TableHead className="hidden sm:table-cell">
            <span className="sr-only">Match report</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentMatches.map((match) => (
          <RecentMatchRow
            key={match.gameId || `${match.date}-${match.minutes}-${match.goals}-${match.assists}`}
            match={match}
            nations={nations}
          />
        ))}
      </TableBody>
      {totals.length > 0 && (
        <tfoot className="border-t border-border-subtle bg-black/20">
          {totals.map((total) => (
            <TableRow key={total.label} className="last:border-0">
              <TableCell className="hidden sm:table-cell" />
              <TableCell colSpan={2} className="text-text-secondary">
                {total.label} <span className="opacity-40">·</span>{" "}
                <span
                  className={`font-value ${total.npga > 0 ? "text-accent-hot" : "text-text-secondary"}`}
                >
                  {total.npga}
                </span>{" "}
                npG+A
              </TableCell>
              <TableCell className="text-right font-value text-text-primary">
                {total.mins.toLocaleString()}&apos;
              </TableCell>
              <TableCell className="text-right font-value">
                <GoalBreakdown goals={total.goals} penaltyGoals={total.pens} />
              </TableCell>
              <TableCell
                className={`text-right font-value ${total.assists > 0 ? "text-accent-hot" : "text-text-muted"}`}
              >
                {total.assists}
              </TableCell>
              <TableCell className="hidden sm:table-cell" />
            </TableRow>
          ))}
        </tfoot>
      )}
    </Table>
  );
}

function RankHead({
  label,
  count,
  className = "",
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <TableHead className={`text-right whitespace-nowrap ${className}`}>
      {label}
      <span className="block font-value normal-case tracking-normal">of {count}</span>
    </TableHead>
  );
}

function RankingsTable({
  metrics,
  player,
  rankings,
  counts,
  positionHeader,
}: {
  metrics: typeof RANKING_METRICS;
  player: { league: string; club: string; position: string; playedPosition?: string };
  rankings: PlayerRankings;
  counts: { overall: number; league: number; club: number; position: number };
  positionHeader: string;
}) {
  const posFilter = getBroadPositionFilter(effectivePosition(player));
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">Metric</TableHead>
          <RankHead label="All" count={counts.overall} />
          <RankHead label="League" count={counts.league} />
          <RankHead label="Club" count={counts.club} className="hidden sm:table-cell" />
          <RankHead label={positionHeader} count={counts.position} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((m) => {
          const base = `/players${m.sortKey ? `?sort=${m.sortKey}` : ""}`;
          const sep = m.sortKey ? "&" : "?";
          return (
            <TableRow key={m.label}>
              <TableCell className="whitespace-nowrap">
                <Link
                  href={base}
                  className="text-text-secondary transition-colors hover:text-text-primary hover:underline"
                >
                  <span className="sm:hidden">{m.shortLabel}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </Link>
              </TableCell>
              <RankCell rank={rankings[m.overallKey]} total={counts.overall} href={base} />
              <RankCell
                rank={rankings[m.leagueKey]}
                total={counts.league}
                href={`${base}${sep}league=${encodeURIComponent(player.league)}`}
              />
              <TableCell className="hidden sm:table-cell text-right whitespace-nowrap">
                <Link
                  href={`${base}${sep}club=${encodeURIComponent(player.club)}`}
                  className="transition-opacity hover:opacity-70"
                >
                  <RankBadge rank={rankings[m.clubKey]} total={counts.club} />
                </Link>
              </TableCell>
              <RankCell
                rank={rankings[m.positionKey]}
                total={counts.position}
                href={`${base}${sep}pos=${posFilter}`}
              />
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playerId: string }>;
}): Promise<Metadata> {
  const { playerId } = await params;
  const data = await getPlayerDetailData(playerId);

  if (!data) {
    return createPageMetadata({
      title: "Player Report",
      description: "Detailed player report with rankings, form, and value comparisons.",
      path: `/players/${playerId}`,
      noIndex: true,
    });
  }

  const { player } = data;
  return createPageMetadata({
    title: `${player.name} Stats, Form & Market Value`,
    description: `${player.name} (${player.club}, ${player.league}): ${player.goals} goals, ${player.assists} assists, ${player.minutes.toLocaleString("en")} minutes and a ${player.marketValueDisplay} market value, with form and peer rankings.`,
    path: `/players/${player.playerId}`,
    keywords: [
      player.name,
      `${player.name} stats`,
      `${player.name} market value`,
      player.club,
      player.league,
      "player report",
      "football player rankings",
      "player form stats",
    ],
  });
}

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ sameLeague?: string; allLeagues?: string; top5?: string }>;
}) {
  const { playerId } = await params;
  const scope = paramsToScope(await searchParams);
  const [data, nations, season] = await Promise.all([
    getPlayerDetailData(playerId),
    getNationalTeamLinks(),
    // The season the refresh is aggregating (it trails TM's calendar until the pool has played).
    readData<string>("season.txt")
      .then(Number)
      .catch(() => null),
  ]);

  if (!data) {
    if (/^\d+$/.test(playerId)) {
      const url = `https://www.transfermarkt.com/x/profil/spieler/${playerId}`;
      return (
        <div className="mx-auto flex min-h-64 max-w-md flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-elevated">
            <ArrowUpRight className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <p className="text-lg font-pixel text-text-primary">Not in tracked dataset</p>
            <p className="mt-1 text-sm text-text-secondary">Redirecting to Transfermarkt&hellip;</p>
          </div>
          <meta httpEquiv="refresh" content={`1;url=${url}`} />
          <a
            href={url}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-elevated px-4 py-2 text-sm text-text-primary transition-colors hover:bg-card-hover"
          >
            Go now
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <Link
            href="/players"
            className="text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            ← Back to player explorer
          </Link>
        </div>
      );
    }
    notFound();
  }

  const {
    player,
    rankings,
    trend,
    form,
    comparisons,
    minutesBenchmark,
    subgroupRankings,
    positionLabel,
    positionShortLabel,
    positionPeerCount,
    overallCount,
    leagueCount,
    clubCount,
    penaltyRank,
  } = data;
  const nation = player.nationalTeamId ? nations[player.nationalTeamId] : undefined;
  // "Brazil international · 87 caps"; a capped player outside the current squad keeps
  // the caps without the title: "Brazil · 87 caps".
  const caps = player.intlCareerCaps;
  const intlLead = player.isCurrentIntl
    ? `${nation?.name ?? "Current"} international`
    : nation?.name;
  const intlLabel = (player.isCurrentIntl || caps > 0) && (
    <span>
      {intlLead}
      {intlLead && caps > 0 && " · "}
      {caps > 0 && (
        <>
          <span className="font-value">{caps}</span> {caps === 1 ? "cap" : "caps"}
        </>
      )}
    </span>
  );
  const { signalSummary } = comparisons.all;
  const fallbackMatchCount = player.recentForm?.length ?? 0;
  // Totals under the match log: the last 5 once the log holds more than five, and the last 10
  // only when they differ from the season totals the hero already gives.
  const formTotals = [
    fallbackMatchCount > 5 && {
      label: "Last 5",
      npga: form.last5Npga,
      goals: form.last5Goals,
      pens: form.last5PenaltyGoals,
      assists: form.last5Assists,
      mins: form.last5Minutes,
    },
    fallbackMatchCount >= 10 &&
      form.last10Minutes !== form.seasonMinutes && {
        label: "Last 10",
        npga: form.last10Npga,
        goals: form.last10Goals,
        pens: form.last10PenaltyGoals,
        assists: form.last10Assists,
        mins: form.last10Minutes,
      },
  ].filter((t) => t !== false);
  const broadGroup = getBroadPositionGroup(effectivePosition(player));
  // Keepers and defenders lead with availability; everyone else with output.
  const outputLeads = broadGroup !== "goalkeepers" && broadGroup !== "defenders";
  const upFront =
    broadGroup === "goalkeepers" || broadGroup === "defenders"
      ? UP_FRONT_RANKINGS[broadGroup]
      : UP_FRONT_RANKINGS.outfield;
  const upFrontMetrics = upFront.map((id) => RANKING_METRICS.find((m) => metricId(m) === id)!);
  const moreMetrics = RANKING_METRICS.filter((m) => !upFront.includes(metricId(m)));
  const { gamesMissed, gamesScheduled, availablePct } = signalSummary;
  const rankCounts = {
    overall: overallCount,
    league: leagueCount,
    club: clubCount,
    position: positionPeerCount,
  };
  const peersPlayingLess = minutesBenchmark.pricier.playingLessCount;
  const peersPlayingMore = minutesBenchmark.cheaper.playingMoreCount;
  const pageUrl = absoluteUrl(`/players/${player.playerId}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${player.name} stats, form and market value`,
        description: `${player.name} performance report for ${player.club} in ${player.league}.`,
        mainEntity: { "@id": `${pageUrl}#player` },
      },
      {
        "@type": "Person",
        "@id": `${pageUrl}#player`,
        name: player.name,
        url: pageUrl,
        ...(player.imageUrl ? { image: player.imageUrl } : {}),
        jobTitle: "Professional footballer",
        nationality: player.nationality,
        sameAs: getLeistungsdatenUrl(player.profileUrl),
        memberOf: {
          "@type": "SportsTeam",
          name: player.club,
          ...(data.clubId ? { url: absoluteUrl(`/teams/${data.clubId}`) } : {}),
        },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Market value",
            value: player.marketValueDisplay,
          },
          { "@type": "PropertyValue", name: "Goals", value: player.goals },
          { "@type": "PropertyValue", name: "Assists", value: player.assists },
          { "@type": "PropertyValue", name: "Minutes played", value: player.minutes },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Players",
            item: absoluteUrl("/players"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: player.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  const statusChip = "border-border-subtle bg-card-hover text-text-secondary";
  const linkedChip = `${statusChip} transition-colors hover:text-text-primary`;

  return (
    <DetailPageShell backHref="/players" backLabel="All players">
      <JsonLd data={jsonLd} />
      <DetailHero>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <PlayerAvatar
            imageUrl={player.imageUrl}
            name={player.name}
            size="lg"
            className="h-24 w-24 rounded-[1.5rem] border border-border-medium sm:h-28 sm:w-28"
          />

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-pixel leading-tight text-text-primary sm:text-4xl">
              {player.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              <PlayerSubtitle
                position={player.position}
                playedPosition={player.playedPosition}
                club={player.club}
                clubLogoUrl={player.clubLogoUrl}
                clubId={data.clubId ?? undefined}
                age={player.age}
                nationalityFlagUrl={player.nationalityFlagUrl}
                nationality={player.nationality}
              />
            </div>

            {/* Status, fitness first. Context chips stay neutral; only signals take a colour. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <LeagueBadge league={player.league} />
              <Suspense>
                <PlayerInjuryBadge playerId={player.playerId} />
              </Suspense>
              {player.isOnLoan && <SignalBadge className={statusChip}>On loan</SignalBadge>}
              {!player.isOnLoan && player.isNewSigning && (
                <SignalBadge className={statusChip}>New signing</SignalBadge>
              )}
              {player.contractExpiry && (
                <Link href={`/players?contract=${encodeURIComponent(player.contractExpiry)}`}>
                  <SignalBadge className={linkedChip}>
                    Contract until {player.contractExpiry}
                  </SignalBadge>
                </Link>
              )}
              {intlLabel &&
                (nation ? (
                  <Link href={nation.href}>
                    <SignalBadge className={linkedChip}>{intlLabel}</SignalBadge>
                  </Link>
                ) : (
                  <SignalBadge className={statusChip}>{intlLabel}</SignalBadge>
                ))}
              {trend && (
                <Link href="/biggest-movers">
                  <SignalBadge
                    className={
                      trend.type === "winner"
                        ? "border-accent-hot-border bg-accent-hot-glow text-accent-hot"
                        : "border-accent-cold-border bg-accent-cold-glow text-accent-cold-soft"
                    }
                  >
                    {trend.type === "winner" ? (
                      <TrendingUp className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                    )}
                    {trend.type === "winner" ? "Repeat riser" : "Repeat faller"} ·{" "}
                    <span className="ml-1 font-value">{trend.appearances.length}</span>
                    &nbsp;{trend.type === "winner" ? "rises" : "drops"}
                  </SignalBadge>
                </Link>
              )}
              {peersPlayingLess === 0 && peersPlayingMore >= MIN_COMPARISON_COUNT && (
                <SignalBadge className="border-accent-cold-border bg-accent-cold-glow text-accent-cold-soft">
                  Fewest minutes among {peersPlayingMore} comparable peers
                  <InfoTip className="ml-1">
                    <p>
                      No player worth the same or more — with as many games available, in a
                      same-or-more-defensive role — has played fewer minutes than {player.name} this
                      season.
                    </p>
                    <p className="mt-1.5">
                      Meanwhile {peersPlayingMore} players worth the same or less, with no more
                      available games, have played more. Based on all tracked leagues — see Minutes
                      vs price below.
                    </p>
                  </InfoTip>
                </SignalBadge>
              )}
              {/* Any fee-vs-value list this player's move heads. Streamed beside the
                  injury badge for the same reason: neither is worth making the hero
                  wait on a scrape. */}
              <Suspense>
                <PlayerTransferBadges playerId={player.playerId} />
              </Suspense>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary">
              {season && (
                <span>
                  <span className="font-value">{seasonLabel(season)}</span> season
                </span>
              )}
              {season && player.fetchedAt && <span className="opacity-40">·</span>}
              {player.fetchedAt && <span>Updated {timeAgo(new Date(player.fetchedAt))}</span>}
              <span className="opacity-40">·</span>
              <a
                href={getLeistungsdatenUrl(player.profileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 transition-colors hover:text-text-primary"
              >
                Transfermarkt
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 sm:gap-x-6">
            <HeroMetric
              label="Value"
              value={player.marketValueDisplay}
              subline={`#${rankings.marketValueOverall} overall · #${rankings.marketValuePosition} ${positionLabel.toLowerCase()}`}
              accentClass="text-accent-gold"
            />
            {outputLeads && (
              <HeroMetric
                label={
                  <span className="inline-flex items-center gap-1">
                    npG+A
                    <InfoTip>
                      <p>
                        Non-penalty goals plus assists: goals − penalty goals + assists. Penalties
                        are left out so a penalty taker isn&apos;t credited for who takes them.
                      </p>
                    </InfoTip>
                  </span>
                }
                value={String(form.seasonNpga)}
                subline={
                  <>
                    {form.seasonGoals}G{form.penaltyGoals > 0 && ` (${form.penaltyGoals} pen)`} ·{" "}
                    {form.seasonAssists}A · #{rankings.npgaPosition} {positionLabel.toLowerCase()}
                  </>
                }
                accentClass="text-accent-hot"
              />
            )}
            <HeroMetric
              label="Minutes"
              value={`${player.minutes.toLocaleString()}'`}
              subline={
                outputLeads
                  ? `Played ${player.totalMatches} of ${displayAvailable(player)}${availablePct < 100 ? ` · ${100 - availablePct}% missed` : ""}`
                  : `Played ${player.totalMatches} of ${displayAvailable(player)} · #${rankings.minutesPosition} ${positionLabel.toLowerCase()}`
              }
              accentClass="text-accent-blue"
            />
            {!outputLeads && (
              <HeroMetric
                label="Available"
                value={`${availablePct}%`}
                subline={
                  gamesMissed > 0
                    ? `Missed ${gamesMissed} of ${gamesScheduled} games`
                    : `Missed none of ${gamesScheduled} games`
                }
                accentClass={
                  availablePct >= 90
                    ? "text-accent-hot"
                    : availablePct < 70
                      ? "text-accent-cold-soft"
                      : "text-text-primary"
                }
              />
            )}
          </div>
          {/* The verdict weighs npG+A, which says nothing about a keeper. */}
          {broadGroup !== "goalkeepers" && (
            <HeroVerdict
              signalSummaries={{
                all: comparisons.all.signalSummary,
                league: comparisons.league.signalSummary,
                noLeagueEdge: comparisons.noLeagueEdge.signalSummary,
                top5: comparisons.top5.signalSummary,
              }}
              leagueLabel={player.league}
            />
          )}
        </div>
      </DetailHero>

      <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
        <DetailSection
          id="form"
          title="Form"
          description={`His last ${fallbackMatchCount} matches, newest first.`}
        >
          <div className="max-w-4xl space-y-3">
            <RecentMatches
              matches={player.recentForm ?? []}
              nations={nations}
              totals={formTotals}
            />
            {form.penaltyAttempts > 0 && (
              <Link
                href="/players?sort=pen"
                className="block text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Penalties this season:{" "}
                <span className="font-value text-text-primary">
                  {form.penaltyGoals}/{form.penaltyAttempts}
                </span>{" "}
                scored
                {form.penaltyConversion !== null && (
                  <>
                    {" "}
                    (
                    <span
                      className={`font-value ${form.penaltyConversion >= 80 ? "text-accent-hot" : form.penaltyConversion >= 60 ? "text-text-primary" : "text-accent-cold-soft"}`}
                    >
                      {form.penaltyConversion}%
                    </span>
                    )
                  </>
                )}
                {penaltyRank && (
                  <>
                    {" "}
                    · <RankBadge rank={penaltyRank.rank} total={penaltyRank.total} /> of{" "}
                    {penaltyRank.total} takers
                  </>
                )}
              </Link>
            )}
            {player.positionStats && player.positionStats.length > 1 && (
              <Disclosure label="Season by position">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Position</TableHead>
                      <TableHead className="text-right">Apps</TableHead>
                      <TableHead className="text-right">G</TableHead>
                      <TableHead className="text-right">A</TableHead>
                      <TableHead className="text-right">G+A</TableHead>
                      <TableHead className="text-right">Mins</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {player.positionStats.map((ps) => {
                      // No penalty split per position, so this is G+A, not npG+A.
                      const ga = ps.goals + ps.assists;
                      const bestGa = Math.max(
                        ...player.positionStats!.map((p) => p.goals + p.assists),
                      );
                      const isBest = ga > 0 && ga === bestGa;
                      return (
                        <TableRow key={ps.positionId}>
                          <TableCell className="text-text-secondary">{ps.position}</TableCell>
                          <TableCell className="text-right font-value text-text-primary">
                            {ps.appearances}
                          </TableCell>
                          <TableCell className="text-right font-value text-text-primary">
                            {ps.goals}
                          </TableCell>
                          <TableCell className="text-right font-value text-text-primary">
                            {ps.assists}
                          </TableCell>
                          <TableCell
                            className={`text-right font-value ${isBest ? "text-accent-hot" : "text-text-primary"}`}
                          >
                            {ga}
                          </TableCell>
                          <TableCell className="text-right font-value text-text-primary">
                            {ps.minutes.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Disclosure>
            )}
          </div>
        </DetailSection>

        <DetailSection
          id="comparisons"
          title="Price vs output"
          description="His npG+A (goals − penalty goals + assists) against players valued above and below him."
        >
          <ComparisonPanels
            comparisons={comparisons}
            initialScope={scope}
            leagueLabel={player.league}
            underBenchmarkUrl={`/value-analysis?id=${player.playerId}&name=${encodeURIComponent(player.name)}&tab=underdelivering`}
            overBenchmarkUrl={`/value-analysis?id=${player.playerId}&name=${encodeURIComponent(player.name)}&tab=better-value`}
          />
        </DetailSection>

        <DetailSection
          id="minutes"
          title="Minutes vs price"
          description="Who plays more or less than him, among peers with as many games available."
        >
          <MinutesBenchmarkSection
            benchmark={minutesBenchmark}
            playerId={player.playerId}
            playerName={player.name}
          />
        </DetailSection>

        <DetailSection
          id="rankings"
          title="Rankings"
          description={
            <>
              Where he ranks among the <span className="font-value">{overallCount}</span> tracked
              players, his league, his club and his position.
            </>
          }
        >
          <div className="max-w-4xl space-y-3">
            <RankingsTable
              metrics={upFrontMetrics}
              player={player}
              rankings={rankings}
              counts={rankCounts}
              positionHeader={positionShortLabel || positionLabel}
            />
            <Disclosure label="More rankings">
              <div className="space-y-3">
                <RankingsTable
                  metrics={moreMetrics}
                  player={player}
                  rankings={rankings}
                  counts={rankCounts}
                  positionHeader={positionShortLabel || positionLabel}
                />
                {subgroupRankings.map((group) => (
                  <Table key={group.label}>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">
                          {group.label} ({group.total})
                        </TableHead>
                        <TableHead className="text-right">npG+A</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Minutes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-text-secondary">Rank</TableCell>
                        <TableCell
                          className={`text-right font-value ${rankColor(group.npgaRank, group.total)}`}
                        >
                          #{group.npgaRank}
                        </TableCell>
                        <TableCell
                          className={`text-right font-value ${rankColor(group.marketValueRank, group.total)}`}
                        >
                          #{group.marketValueRank}
                        </TableCell>
                        <TableCell
                          className={`text-right font-value ${rankColor(group.minutesRank, group.total)}`}
                        >
                          #{group.minutesRank}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ))}
              </div>
            </Disclosure>
          </div>
        </DetailSection>
      </div>
    </DetailPageShell>
  );
}
