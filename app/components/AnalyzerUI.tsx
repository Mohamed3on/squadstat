"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import type { AnalysisResult, PeriodAnalysis, QualifiedTeam, ManagerInfo } from "@/app/types";
import { TeamCard, TeamCardSkeleton } from "./TeamCard";
import { Header } from "./Header";
import { useMemo } from "react";

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
      <div
        className="rounded-2xl p-8"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="skeleton h-6 w-32" />
            <TeamCardSkeleton />
          </div>
          <div className="space-y-3">
            <div className="skeleton h-6 w-32" />
            <TeamCardSkeleton />
            <TeamCardSkeleton />
          </div>
        </div>
      </div>

      {/* Period cards skeleton */}
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            opacity: 1 - i * 0.3,
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="skeleton h-7 w-40" />
            <div className="skeleton h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="skeleton h-32 rounded-xl" />
            <div className="skeleton h-32 rounded-xl" />
          </div>
        </div>
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
          Analyzing form data...
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
        {isTop ? "Best Form" : "Worst Form"}
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {teams.map((t, index) => (
          <div
            key={t.clubId}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
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
    <div
      className="rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:scale-[1.01] animate-slide-up"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: period.hasMatch ? "var(--shadow-glow-hot)" : "none",
        animationDelay: `${index * 150}ms`,
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
          <span className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>games</span>
        </div>
        <span
          className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider"
          style={{
            background: period.hasMatch ? "var(--accent-hot-glow)" : "var(--bg-elevated)",
            color: period.hasMatch ? "var(--accent-hot)" : "var(--text-muted)",
            border: `1px solid ${period.hasMatch ? "var(--accent-hot)" : "var(--border-subtle)"}`,
          }}
        >
          {period.hasMatch ? "✓ Match" : "No Match"}
        </span>
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
              <span>↑</span> Qualified ({period.topTeams.length})
            </h4>
            <div className="space-y-2">
              {period.topTeams.map((t) => (
                <TeamCard key={t.clubId} team={t} type="top" compact />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--bg-elevated)" }}
          >
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              No team has 2+ top criteria
            </p>
          </div>
        )}

        {period.bottomTeams.length > 0 ? (
          <div>
            <h4
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--accent-cold)" }}
            >
              <span>↓</span> Qualified ({period.bottomTeams.length})
            </h4>
            <div className="space-y-2">
              {period.bottomTeams.map((t) => (
                <TeamCard key={t.clubId} team={t} type="bottom" compact />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "var(--bg-elevated)" }}
          >
            <p style={{ color: "var(--text-muted)" }} className="text-sm">
              No team has 2+ bottom criteria
            </p>
          </div>
        )}
      </div>
    </div>
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
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
    >
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
            className="flex justify-between items-center text-xs sm:text-sm py-0.5 sm:py-1"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <div className="text-right">
              <span
                className="font-bold mr-1 sm:mr-2"
                style={{ color: accentColor }}
              >
                {row.value}
              </span>
              <span style={{ color: "var(--text-secondary)" }} className="text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-none inline-block align-bottom">
                {row.teams.slice(0, 1).join(", ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
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
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
          <div
            className="rounded-2xl p-6 sm:p-8 text-center animate-scale-in"
            style={{
              background: "var(--accent-cold-glow)",
              border: "1px solid var(--accent-cold)",
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
              Unable to fetch data from Transfermarkt
            </p>
            <button
              onClick={() => refetch()}
              className="px-6 py-2 rounded-lg font-semibold"
              style={{
                background: "var(--accent-cold)",
                color: "var(--bg-base)",
              }}
            >
              Try Again
            </button>
          </div>
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
                        Match Found
                      </h2>
                      <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
                        Last{" "}
                        <span
                          className="font-bold"
                          style={{ color: "var(--accent-hot)" }}
                        >
                          {data.analysis.find((p) => p.hasMatch)?.period}
                        </span>{" "}
                        games analysis
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
              <div
                className="rounded-2xl p-6 sm:p-8 text-center animate-scale-in"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--accent-cold)",
                }}
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
                <h2
                  className="text-lg sm:text-xl font-bold mb-2"
                  style={{ color: "var(--accent-cold)" }}
                >
                  No Clear Match Found
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
                  No period has both clear top and bottom qualifying teams
                </p>
              </div>
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
                Period Breakdown
              </h2>
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
              Refreshing...
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
