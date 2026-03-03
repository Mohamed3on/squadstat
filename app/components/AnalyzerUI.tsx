"use client";

import { useQueries } from "@tanstack/react-query";
import type { AnalysisResult, PeriodAnalysis, QualifiedTeam, AggregatedTeam, ManagerInfo } from "@/app/types";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ManagerSection, ManagerSkeleton } from "./ManagerPPGBadge";
import { getLeagueLogoUrl, getLeagueUrl } from "@/lib/leagues";
import { ChevronDown } from "lucide-react";

async function fetchManager(clubId: string): Promise<{ clubId: string; manager: ManagerInfo | null }> {
  const res = await fetch(`/api/manager/${clubId}`);
  if (!res.ok) throw new Error(`Manager fetch failed for ${clubId}: ${res.status}`);
  return res.json();
}

function formatOrdinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

function formatStatValue(category: string, value: number): string {
  if (category.includes("GD")) return value > 0 ? `+${value}` : `${value}`;
  return `${value}`;
}

function groupEntries(entries: AggregatedTeam["entries"]): { category: string; periodValues: { period: number; value: number }[] }[] {
  const map = new Map<string, { period: number; value: number }[]>();
  for (const { category, period, value } of entries) {
    const existing = map.get(category);
    if (existing) existing.push({ period, value });
    else map.set(category, [{ period, value }]);
  }
  return Array.from(map, ([category, periodValues]) => ({
    category,
    periodValues: periodValues.sort((a, b) => a.period - b.period),
  }));
}

function AggregatedTeamCard({
  team,
  type,
  manager,
  managerLoading,
  index,
  isLeader,
  deltaPts,
}: {
  team: AggregatedTeam;
  type: "top" | "bottom";
  manager?: ManagerInfo | null;
  managerLoading?: boolean;
  index: number;
  isLeader: boolean;
  deltaPts?: number;
}) {
  const isTop = type === "top";
  const grouped = groupEntries(team.entries);
  const showManager = manager !== undefined || managerLoading;

  return (
    <Card
      className={`p-3 sm:p-4 hover-lift animate-slide-up ${
        isLeader
          ? isTop
            ? "bg-gradient-to-br from-[var(--accent-hot-glow)] to-[var(--bg-elevated)] border-accent-hot shadow-[0_0_30px_var(--accent-hot-glow)]"
            : "bg-gradient-to-br from-[var(--accent-cold-glow)] to-[var(--bg-elevated)] border-accent-cold shadow-[0_0_30px_var(--accent-cold-glow)]"
          : isTop
            ? "bg-elevated border-accent-hot/30"
            : "bg-elevated border-accent-cold/30"
      }`}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {team.logoUrl && (
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 bg-card">
            <Image
              src={team.logoUrl}
              alt={team.name}
              width={40}
              height={40}
              sizes="(max-width: 640px) 32px, 40px"
              className="object-contain w-8 h-8 sm:w-10 sm:h-10"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-pixel text-base sm:text-lg truncate text-text-primary">
            {team.clubUrl ? (
              <a
                href={`https://www.transfermarkt.com${team.clubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline transition-colors ${isTop ? "text-accent-hot" : "text-accent-cold"}`}
              >
                {team.name}
              </a>
            ) : (
              team.name
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm truncate text-text-secondary">
            {getLeagueUrl(team.league) ? (
              <a href={getLeagueUrl(team.league)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline shrink-0">
                {getLeagueLogoUrl(team.league) && <img src={getLeagueLogoUrl(team.league)} alt="" width={16} height={16} className="w-4 h-4 object-contain shrink-0 rounded-sm bg-white/90 p-px" />}
                {team.league}
              </a>
            ) : (
              team.league
            )}
            {deltaPts != null && (
              <a href="/expected-position" className={`inline-flex items-center gap-0.5 font-value text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full transition-all duration-150 hover:scale-105 hover:brightness-125 ${deltaPts > 0 ? "bg-[var(--accent-hot-glow)] text-[var(--accent-hot)]" : "bg-[var(--accent-cold-glow)] text-[var(--accent-cold)]"}`}>
                {deltaPts > 0 ? "+" : ""}{deltaPts} vs exp <span className="text-[8px] opacity-60">→</span>
              </a>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${isTop ? "bg-accent-hot-glow text-accent-hot border-accent-hot" : "bg-accent-cold-glow text-accent-cold border-accent-cold"}`}
        >
          <span className="font-value">{team.count}</span>&nbsp;categories
        </Badge>
      </div>

      {/* What they led */}
      <div className="mt-3 space-y-1">
        {grouped.map(({ category, periodValues }) => (
          <div key={category} className="text-xs sm:text-sm text-text-muted">
            <span className={`font-semibold ${isTop ? "text-accent-hot" : "text-accent-cold"}`}>{category}</span>
            <span className="text-text-secondary"> · {periodValues.map(({ period, value }) => (
              <span key={period}>{period !== periodValues[0].period && ", "}<span className="font-value">{formatStatValue(category, value)}</span> <span className="text-text-muted">in last {period}</span></span>
            ))}</span>
          </div>
        ))}
      </div>

      {/* Manager info */}
      {showManager && team.clubId && (
        <div className="mt-3 pt-2 sm:pt-3 text-xs sm:text-sm border-t border-t-border-subtle">
          {managerLoading ? (
            <ManagerSkeleton />
          ) : manager ? (
            <ManagerSection manager={manager} />
          ) : (
            <span className="text-text-muted">Manager data unavailable</span>
          )}
        </div>
      )}
    </Card>
  );
}

function AggregatedSection({ teams, type, deltaMap }: { teams: AggregatedTeam[]; type: "top" | "bottom"; deltaMap?: Record<string, number> }) {
  const clubIds = useMemo(() => teams.map((t) => t.clubId).filter(Boolean), [teams]);

  const managerQueries = useQueries({
    queries: clubIds.map((clubId) => ({
      queryKey: ["manager", clubId],
      queryFn: () => fetchManager(clubId),
      staleTime: 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  const { managersMap, loadingSet } = useMemo(() => {
    const map: Record<string, ManagerInfo | null> = {};
    const loading = new Set<string>();
    managerQueries.forEach((q, i) => {
      if (q.data) map[clubIds[i]] = q.data.manager;
      if (q.isLoading) loading.add(clubIds[i]);
    });
    return { managersMap: map, loadingSet: loading };
  }, [managerQueries, clubIds]);

  useEffect(() => {
    managerQueries.forEach((q, i) => {
      if (q.error) console.error(`[manager] Query failed for club ${clubIds[i]}:`, q.error);
    });
  }, [managerQueries, clubIds]);

  const isTop = type === "top";
  const maxCount = teams[0]?.count ?? 0;

  return (
    <div>
      <h3
        className={`font-pixel text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 ${isTop ? "text-accent-hot" : "text-accent-cold"}`}
      >
        <span
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-lg sm:text-xl ${isTop ? "bg-accent-hot-glow" : "bg-accent-cold-glow"}`}
          aria-hidden="true"
        >
          {isTop ? "↑" : "↓"}
        </span>
        {isTop ? "Best Form" : "Worst Form"}
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {teams.map((team, index) => (
          <AggregatedTeamCard
            key={team.clubId}
            team={team}
            type={type}
            manager={managersMap[team.clubId]}
            managerLoading={loadingSet.has(team.clubId)}
            index={index}
            isLeader={team.count === maxCount}
            deltaPts={deltaMap?.[team.clubId]}
          />
        ))}
      </div>
    </div>
  );
}

function PeriodCard({ period, index }: { period: PeriodAnalysis; index: number }) {
  return (
    <Card
      className={`rounded-2xl p-4 sm:p-6 hover-lift animate-slide-up ${period.hasMatch ? "shadow-[0_0_40px_rgba(0,255,135,0.1)]" : ""}`}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl font-value text-text-primary">
            {period.period}
          </span>
          <span className="text-sm sm:text-base text-text-secondary">matches</span>
        </div>
        <Badge
          variant={period.hasMatch ? "default" : "secondary"}
          className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${period.hasMatch ? "bg-accent-hot-glow text-accent-hot border-accent-hot" : ""}`}
        >
          {period.hasMatch ? "Clear Standouts" : "No Clear Standouts"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <LeaderCard type="top" leaders={period.leaders.top} />
        <LeaderCard type="bottom" leaders={period.leaders.bottom} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {period.topTeams.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent-hot">
              <span aria-hidden="true">↑</span> <span>Leading 2+ Categories ({period.topTeams.length})</span>
            </h4>
            <div className="space-y-2">
              {period.topTeams.map((t) => (
                <CompactTeamCard key={t.clubId} team={t} type="top" />
              ))}
            </div>
          </div>
        ) : (
          <Card className="h-full p-4 text-center bg-elevated flex items-center justify-center">
            <p className="text-sm text-text-muted">No team leads 2+ categories in this window</p>
          </Card>
        )}

        {period.bottomTeams.length > 0 ? (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-accent-cold">
              <span aria-hidden="true">↓</span> <span>Trailing 2+ Categories ({period.bottomTeams.length})</span>
            </h4>
            <div className="space-y-2">
              {period.bottomTeams.map((t) => (
                <CompactTeamCard key={t.clubId} team={t} type="bottom" />
              ))}
            </div>
          </div>
        ) : (
          <Card className="h-full p-4 text-center bg-elevated flex items-center justify-center">
            <p className="text-sm text-text-muted">No team trails 2+ categories in this window</p>
          </Card>
        )}
      </div>
    </Card>
  );
}

function CompactTeamCard({ team, type }: { team: QualifiedTeam; type: "top" | "bottom" }) {
  const isTop = type === "top";

  return (
    <Card className="p-3 bg-elevated hover-lift">
      <div className="flex items-center gap-3">
        {team.logoUrl && (
          <Image src={team.logoUrl} alt={team.name} width={28} height={28} sizes="28px" className="object-contain" unoptimized />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-text-primary">
            {team.clubUrl ? (
              <a href={`https://www.transfermarkt.com${team.clubUrl}`} target="_blank" rel="noopener noreferrer" className={`hover:underline ${isTop ? "text-accent-hot" : "text-accent-cold"}`}>
                {team.name}
              </a>
            ) : team.name}
          </div>
          <div className="text-xs text-text-muted">
            {formatOrdinal(team.leaguePosition)} place · <span className="font-value">{team.stats.points}</span> pts · GD: <span className="font-value">{team.stats.goalDiff > 0 ? "+" : ""}{team.stats.goalDiff}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function LeaderCard({
  type,
  leaders,
}: {
  type: "top" | "bottom";
  leaders: PeriodAnalysis["leaders"]["top"];
}) {
  const isTop = type === "top";
  const accentClass = isTop ? "text-accent-hot" : "text-accent-cold";

  const gd = leaders.goalDiff.value;
  const rows = [
    { label: "Points", value: `${leaders.points.value}`, teams: leaders.points.teams },
    { label: "Goal Diff", value: `${gd > 0 ? "+" : ""}${gd}`, teams: leaders.goalDiff.teams },
    { label: "Goals For", value: `${leaders.goalsScored.value}`, teams: leaders.goalsScored.teams },
    { label: "Goals Against", value: `${leaders.goalsConceded.value}`, teams: leaders.goalsConceded.teams },
  ];

  return (
    <Card className="h-full p-3 sm:p-4 bg-elevated">
      <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2 ${accentClass}`}>
        <span className={`w-2 h-2 rounded-full ${isTop ? "bg-accent-hot shadow-[0_0_8px_var(--accent-hot)]" : "bg-accent-cold shadow-[0_0_8px_var(--accent-cold)]"}`} aria-hidden="true" />
        {isTop ? "Best In Class" : "Worst In Class"}
      </h4>
      <div className="space-y-1.5 sm:space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="text-xs sm:text-sm py-0.5 sm:py-1 border-b border-b-border-subtle">
            <div className="flex justify-between items-start gap-2">
              <span className="shrink-0 text-text-muted">{row.label}</span>
              <span className={`font-value shrink-0 ${accentClass}`}>
                {row.value}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs mt-0.5 leading-relaxed text-text-secondary">
              {row.teams.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AnalyzerUI({ initialData, deltaMap }: { initialData: AnalysisResult; deltaMap?: Record<string, number> }) {
  const [periodsOpen, setPeriodsOpen] = useState(false);
  const hasAggregated = initialData.aggregatedTop.length > 0 || initialData.aggregatedBottom.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero Section — Aggregated View */}
      {hasAggregated ? (
        <div
          className="rounded-2xl p-4 sm:p-6 animate-scale-in relative overflow-hidden border border-accent-hot bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] shadow-[var(--shadow-glow-hot)]"
        >
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 bg-accent-hot" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-pixel text-accent-hot" aria-hidden="true">
                ✓
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-pixel text-text-primary text-balance">
                  Aggregated Form Leaders
                </h2>
                <p className="text-sm sm:text-base text-text-secondary">
                  Teams that lead the most categories across their last 5, 10, 15, and 20 matches.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {initialData.aggregatedTop.length > 0 && (
                <AggregatedSection teams={initialData.aggregatedTop} type="top" deltaMap={deltaMap} />
              )}
              {initialData.aggregatedBottom.length > 0 && (
                <AggregatedSection teams={initialData.aggregatedBottom} type="bottom" deltaMap={deltaMap} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl p-4 sm:p-6 text-center animate-scale-in border-accent-cold">
          <h2 className="text-lg sm:text-xl font-pixel mb-2 text-accent-cold">
            No Clear Pattern
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            No team leads 2+ categories across their last 5, 10, 15, and 20 matches right now.
          </p>
        </Card>
      )}

      {/* Per-window section — collapsible */}
      <Collapsible open={periodsOpen} onOpenChange={setPeriodsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center gap-3 text-text-secondary cursor-pointer group"
            aria-label={periodsOpen ? "Collapse per-period breakdown" : "Expand per-period breakdown"}
          >
            <span className="w-1 h-6 rounded-full bg-accent-blue" aria-hidden="true" />
            <span className="text-lg font-pixel">By Number of Matches</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ease-out ${periodsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            <span className="flex-1 h-px bg-border-subtle" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="text-sm mt-4 mb-4 text-text-muted">
            Breakdown by the last 5, 10, 15, and 20 matches. Only teams leading or trailing 2+ categories are shown.
          </p>
          <div className="space-y-4">
            {initialData.analysis.map((period, index) => (
              <PeriodCard key={period.period} period={period} index={index} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
