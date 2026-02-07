"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import type { AnalysisResult, PeriodAnalysis, QualifiedTeam, ManagerInfo } from "@/app/types";
import { TeamCard, TeamCardSkeleton } from "./TeamCard";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function fetchAnalysis(): Promise<AnalysisResult> {
  const res = await fetch("/api/analyze");
  if (!res.ok) {
    const text = await res.text();
    console.error("API error:", res.status, text);
    throw new Error(`Failed to fetch analysis: ${res.status}`);
  }
  return res.json();
}

async function fetchManager(clubId: string): Promise<{ clubId: string; manager: ManagerInfo | null }> {
  const res = await fetch(`/api/manager/${clubId}`);
  return res.json();
}

// Skeleton loader for the main content
function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero skeleton */}
      <Card className="rounded-2xl p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <TeamCardSkeleton />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <TeamCardSkeleton />
            <TeamCardSkeleton />
          </div>
        </div>
      </Card>

      {/* Period cards skeleton */}
      {[1, 2].map((i) => (
        <Card
          key={i}
          className="rounded-2xl p-6"
          style={{ opacity: 1 - i * 0.3 }}
        >
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Loading spinner with pulsing effect
function LoadingSpinner() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--border-subtle)",
            borderTopColor: "var(--accent-hot)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ background: "var(--accent-hot)" }}
        />
      </div>
      <div>
        <p style={{ color: "var(--text-primary)" }} className="font-medium">
          Analyzing form data…
        </p>
        <p style={{ color: "var(--text-muted)" }} className="text-sm">
          Scanning top 5 European leagues
        </p>
      </div>
    </div>
  );
}

// Component to render teams with parallel manager fetching
function MatchedTeamsSection({ teams, type }: { teams: QualifiedTeam[]; type: "top" | "bottom" }) {
  const clubIds = teams.map((t) => t.clubId).filter(Boolean);

  const managerQueries = useQueries({
    queries: clubIds.map((clubId) => ({
      queryKey: ["manager", clubId],
      queryFn: () => fetchManager(clubId),
      staleTime: 60 * 60 * 1000, // 1 hour
      gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  const managersMap = useMemo(() => {
    const map: Record<string, ManagerInfo | null> = {};
    managerQueries.forEach((q, i) => {
      if (q.data) {
        map[clubIds[i]] = q.data.manager;
      }
    });
    return map;
  }, [managerQueries, clubIds]);

  const isTop = type === "top";
  const accentColor = isTop ? "var(--accent-hot)" : "var(--accent-cold)";

  return (
    <div>
      <h3
        className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3"
        style={{ color: accentColor }}
      >
        <span
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-lg sm:text-xl"
          style={{
            background: isTop ? "var(--accent-hot-glow)" : "var(--accent-cold-glow)",
          }}
        >
          {isTop ? "↑" : "↓"}
        </span>
        {isTop ? "Top Signal Cluster" : "Bottom Signal Cluster"}
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {teams.map((t, index) => (
          <div
            key={t.clubId}
            className="animate-slide-up"
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
          >
            <TeamCard
              team={t}
              type={type}
              manager={managersMap[t.clubId]}
              managerLoading={managerQueries.find((_, i) => clubIds[i] === t.clubId)?.isLoading}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PeriodCard({ period, index }: { period: PeriodAnalysis; index: number }) {
  return (
    <Card
      className="rounded-2xl p-4 sm:p-6 hover-lift animate-slide-up"
      style={{
        boxShadow: period.hasMatch ? "var(--shadow-glow-hot)" : "none",
        animationDelay: `${Math.min(index * 30, 300)}ms`,
      }}
    >
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="text-2xl sm:text-3xl font-black"
            style={{ color: "var(--text-primary)" }}
          >
            {period.period}
          </span>
          <span className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>matches</span>
        </div>
        <Badge
          variant={period.hasMatch ? "default" : "secondary"}
          className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider"
          style={period.hasMatch ? {
            background: "var(--accent-hot-glow)",
            color: "var(--accent-hot)",
            borderColor: "var(--accent-hot)",
          } : undefined}
        >
          {period.hasMatch ? "✓ Strong Signal" : "No Strong Signal"}
        </Badge>
      </div>

      {/* Leaders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <LeaderCard type="top" leaders={period.leaders.top} />
        <LeaderCard type="bottom" leaders={period.leaders.bottom} />
      </div>

      {/* Qualified Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {period.topTeams.length > 0 ? (
          <div>
            <h4
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--accent-hot)" }}
            >
              <span>↑</span> Met 2+ Signal Metrics ({period.topTeams.length})
            </h4>
            <div className="space-y-2">
              {period.topTeams.map((t) => (
                <TeamCard key={t.clubId} team={t} type="top" compact />
              ))}
            </div>
          </div>
        ) : (
          <Card className="h-full p-4 text-center bg-[var(--bg-elevated)] flex items-center justify-center">
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              No team led at least 2 top-side metrics in this window
            </p>
          </Card>
        )}

        {period.bottomTeams.length > 0 ? (
          <div>
            <h4
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--accent-cold)" }}
            >
              <span>↓</span> Met 2+ Signal Metrics ({period.bottomTeams.length})
            </h4>
            <div className="space-y-2">
              {period.bottomTeams.map((t) => (
                <TeamCard key={t.clubId} team={t} type="bottom" compact />
              ))}
            </div>
          </div>
        ) : (
          <Card className="h-full p-4 text-center bg-[var(--bg-elevated)] flex items-center justify-center">
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              No team led at least 2 bottom-side metrics in this window
            </p>
          </Card>
        )}
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
  const accentColor = isTop ? "var(--accent-hot)" : "var(--accent-cold)";
  const glowColor = isTop ? "var(--accent-hot-glow)" : "var(--accent-cold-glow)";

  const rows = isTop
    ? [
        { label: "Points", value: `${leaders.points.value}`, teams: leaders.points.teams },
        { label: "Goal Diff", value: `+${leaders.goalDiff.value}`, teams: leaders.goalDiff.teams },
        { label: "Goals For", value: `${leaders.goalsScored.value}`, teams: leaders.goalsScored.teams },
        { label: "Goals Against", value: `${leaders.goalsConceded.value}`, teams: leaders.goalsConceded.teams },
      ]
    : [
        { label: "Points", value: `${leaders.points.value}`, teams: leaders.points.teams },
        { label: "Goal Diff", value: `${leaders.goalDiff.value}`, teams: leaders.goalDiff.teams },
        { label: "Goals For", value: `${leaders.goalsScored.value}`, teams: leaders.goalsScored.teams },
        { label: "Goals Against", value: `${leaders.goalsConceded.value}`, teams: leaders.goalsConceded.teams },
      ];

  return (
    <Card className="h-full p-3 sm:p-4 bg-[var(--bg-elevated)]">
      <h4
        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2"
        style={{ color: accentColor }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
        />
        {isTop ? "Top Leaders" : "Bottom Leaders"}
      </h4>
      <div className="space-y-1.5 sm:space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="text-xs sm:text-sm py-0.5 sm:py-1"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex justify-between items-start gap-2">
              <span style={{ color: "var(--text-muted)" }} className="shrink-0">{row.label}</span>
              <span
                className="font-bold shrink-0"
                style={{ color: accentColor }}
              >
                {row.value}
              </span>
            </div>
            <div
              className="text-[10px] sm:text-xs mt-0.5 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {row.teams.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AnalyzerUI() {
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["analysis"],
    queryFn: fetchAnalysis,
    retry: 1,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: false,
  });

  const isBusy = isLoading || isFetching;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
            Form Signals
          </h1>
          <p className="text-sm sm:text-base max-w-3xl" style={{ color: "var(--text-muted)" }}>
            We scan 5, 10, 15, and 20-match windows across Europe&apos;s top leagues. A team is flagged when it leads at
            least 2 metrics in the same window: points, goal difference, goals scored, or goals conceded.
          </p>
        </div>

        {/* Loading State */}
        {isBusy && !data && (
          <div className="space-y-8">
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
            <AnalysisSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card
            className="rounded-2xl p-6 sm:p-8 text-center animate-scale-in"
            style={{
              background: "var(--accent-cold-glow)",
              borderColor: "var(--accent-cold)",
            }}
          >
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚠️</div>
            <h2
              className="text-lg sm:text-xl font-bold mb-2"
              style={{ color: "var(--accent-cold)" }}
            >
              Analysis Failed
            </h2>
            <p style={{ color: "var(--text-secondary)" }} className="mb-4 text-sm sm:text-base">
              Couldn&apos;t load the latest Transfermarkt data. Try refreshing this page.
            </p>
            <Button
              onClick={() => refetch()}
              className="px-6 py-2"
              style={{
                background: "var(--accent-cold)",
                color: "var(--bg-base)",
              }}
            >
              Try Again
            </Button>
          </Card>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-8">
            {/* Hero Section - Match Result */}
            {data.success && data.analysis.find((p) => p.hasMatch) ? (
              <div
                className="rounded-2xl p-4 sm:p-8 animate-scale-in relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
                  border: "1px solid var(--accent-hot)",
                  boxShadow: "var(--shadow-glow-hot)",
                }}
              >
                {/* Decorative gradient orb */}
                <div
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20"
                  style={{ background: "var(--accent-hot)" }}
                />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <span
                      className="text-2xl sm:text-3xl font-black"
                      style={{ color: "var(--accent-hot)" }}
                    >
                      ✓
                    </span>
                    <div>
                      <h2
                        className="text-xl sm:text-2xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Strong Signal Found
                      </h2>
                      <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
                        In the last{" "}
                        <span
                          className="font-bold"
                          style={{ color: "var(--accent-hot)" }}
                        >
                          {data.analysis.find((p) => p.hasMatch)?.period}
                        </span>{" "}
                        matches, both top and bottom clusters are clear.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <MatchedTeamsSection
                      teams={data.analysis.find((p) => p.hasMatch)?.topTeams || []}
                      type="top"
                    />
                    <MatchedTeamsSection
                      teams={data.analysis.find((p) => p.hasMatch)?.bottomTeams || []}
                      type="bottom"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Card
                className="rounded-2xl p-6 sm:p-8 text-center animate-scale-in"
                style={{ borderColor: "var(--accent-cold)" }}
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
                <h2
                  className="text-lg sm:text-xl font-bold mb-2"
                  style={{ color: "var(--accent-cold)" }}
                >
                  No Balanced Window Found
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
                  None of the 5/10/15/20-match windows produced both a clear top and clear bottom signal cluster.
                </p>
              </Card>
            )}

            {/* Period Analysis Section */}
            <div>
              <h2
                className="text-lg font-bold mb-6 flex items-center gap-3"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="w-1 h-6 rounded-full"
                  style={{ background: "var(--accent-blue)" }}
                />
                Window-by-Window Breakdown
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                Read each window independently. Teams shown below are only those that led at least 2 metrics.
              </p>
              <div className="space-y-4">
                {data.analysis.map((period, index) => (
                  <PeriodCard key={period.period} period={period} index={index} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fetching overlay */}
        {isBusy && data && (
          <div
            className="fixed bottom-6 right-6 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-up"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--border-subtle)",
                borderTopColor: "var(--accent-blue)",
              }}
            />
            <span style={{ color: "var(--text-secondary)" }} className="text-sm">
              Refreshing…
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
