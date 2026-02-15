"use client";

import { useQueries } from "@tanstack/react-query";
import type { AnalysisResult, PeriodAnalysis, QualifiedTeam, ManagerInfo } from "@/app/types";
import { TeamCard } from "./TeamCard";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function fetchManager(clubId: string): Promise<{ clubId: string; manager: ManagerInfo | null }> {
  const res = await fetch(`/api/manager/${clubId}`);
  return res.json();
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
          {period.hasMatch ? "✓ Clear Standouts" : "No Clear Standouts"}
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
              <span>↑</span> Leading 2+ Categories ({period.topTeams.length})
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
              No team leads 2+ categories in this window
            </p>
          </Card>
        )}

        {period.bottomTeams.length > 0 ? (
          <div>
            <h4
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: "var(--accent-cold)" }}
            >
              <span>↓</span> Trailing 2+ Categories ({period.bottomTeams.length})
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
              No team trails 2+ categories in this window
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
        {isTop ? "Best In Class" : "Worst In Class"}
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

export function AnalyzerUI({ initialData }: { initialData: AnalysisResult }) {
  const data = initialData;

  return (
    <div className="space-y-8">
      {/* Hero Section - Match Result */}
      {data.success && data.analysis.find((p) => p.hasMatch) ? (
        <div
          className="rounded-2xl p-4 sm:p-6 animate-scale-in relative overflow-hidden"
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
                  Clear Pattern Found
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
                  Over the last{" "}
                  <span
                    className="font-bold"
                    style={{ color: "var(--accent-hot)" }}
                  >
                    {data.analysis.find((p) => p.hasMatch)?.period}
                  </span>{" "}
                  matches, there are clear standouts at the top and bottom.
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
          className="rounded-2xl p-4 sm:p-6 text-center animate-scale-in"
          style={{ borderColor: "var(--accent-cold)" }}
        >
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
          <h2
            className="text-lg sm:text-xl font-bold mb-2"
            style={{ color: "var(--accent-cold)" }}
          >
            No Clear Pattern
          </h2>
          <p className="text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
            No match window has clear standouts at both the top and bottom right now.
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
          By Match Window
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Each window is independent. Only teams leading or trailing 2+ categories are shown.
        </p>
        <div className="space-y-4">
          {data.analysis.map((period, index) => (
            <PeriodCard key={period.period} period={period} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
