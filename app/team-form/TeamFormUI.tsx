"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { TeamFormEntry, ManagerInfo } from "@/app/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ManagerPPGBadge, ManagerSkeleton } from "@/app/components/ManagerPPGBadge";
import { LEAGUES } from "@/lib/leagues";

export interface TeamFormResponse {
  success: boolean;
  overperformers: TeamFormEntry[];
  underperformers: TeamFormEntry[];
  totalTeams: number;
  leagues: string[];
}

interface TeamFormUIProps {
  initialData: TeamFormResponse;
}

async function fetchManager(clubId: string): Promise<{ clubId: string; manager: ManagerInfo | null }> {
  const res = await fetch(`/api/manager/${clubId}`);
  return res.json();
}

function getLeagueColor(league: string): string {
  const colors: Record<string, string> = {
    Bundesliga: "#d20515",
    "Premier League": "#38003c",
    "La Liga": "#ff4b44",
    "Serie A": "#024494",
    "Ligue 1": "#dae025",
  };
  return colors[league] || "#666";
}

function formatValue(value: string): string {
  return value || "-";
}

function LeagueFilter({ selectedLeague, onValueChange }: { selectedLeague: string; onValueChange: (value: string) => void }) {
  return (
    <div className="mb-4 sm:mb-6">
      <p className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
        Filter by league:
      </p>
      <ToggleGroup
        type="single"
        value={selectedLeague}
        onValueChange={(value) => onValueChange(value || "all")}
        className="flex flex-wrap gap-2"
      >
        <ToggleGroupItem
          value="all"
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{
            backgroundColor: selectedLeague === "all" ? "var(--bg-card)" : "transparent",
            border: selectedLeague === "all" ? "1px solid var(--accent-blue)" : "1px solid var(--border-subtle)",
            color: selectedLeague === "all" ? "var(--accent-blue)" : "var(--text-muted)",
            boxShadow: selectedLeague === "all" ? "0 0 12px rgba(88, 166, 255, 0.2)" : "none",
          }}
        >
          All Leagues
        </ToggleGroupItem>

        {LEAGUES.map((league) => {
          const isSelected = selectedLeague === league.name;
          const color = getLeagueColor(league.name);

          return (
            <ToggleGroupItem
              key={league.code}
              value={league.name}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: isSelected ? color : "var(--bg-card)",
                border: `1px solid ${isSelected ? color : "var(--border-subtle)"}`,
                color: isSelected ? (league.name === "Ligue 1" ? "#000" : "#fff") : "var(--text-secondary)",
                boxShadow: isSelected ? `0 0 12px ${color}40` : "none",
              }}
            >
              {league.name}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}

interface TeamCardProps {
  team: TeamFormEntry;
  rank: number;
  type: "over" | "under";
  manager?: ManagerInfo | null;
  managerLoading?: boolean;
  index?: number;
}

function TeamCard({ team, rank, type, manager, managerLoading, index = 0 }: TeamCardProps) {
  const isOver = type === "over";
  const showManager = manager !== undefined || managerLoading;

  return (
    <Card
      className="h-full w-full p-3 sm:p-4 transition-[transform,box-shadow] hover:scale-[1.01] hover-lift animate-slide-up opacity-0"
      style={{
        animationDelay: `${index * 0.05}s`,
        animationFillMode: "forwards",
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
          style={{
            background: rank <= 3 ? (isOver ? "#16a34a" : "#dc2626") : "var(--bg-elevated)",
            color: rank <= 3 ? "#fff" : "var(--text-muted)",
          }}
        >
          {rank}
        </div>

        {/* Club Logo */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
          ) : (
            <div className="text-xl" style={{ color: "var(--text-muted)" }}>?</div>
          )}
        </div>

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={team.clubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sm sm:text-base hover:underline block truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {team.name}
              </a>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs shrink-0"
                  style={{
                    background: getLeagueColor(team.league),
                    color: team.league === "Ligue 1" ? "#000" : "#fff",
                    border: "none",
                  }}
                >
                  {team.league}
                </Badge>
              </div>
            </div>
            {/* Delta */}
            <div
              className="text-lg sm:text-xl font-black shrink-0"
              style={{ color: isOver ? "#16a34a" : "#dc2626" }}
            >
              {team.deltaPts > 0 ? `+${team.deltaPts}` : team.deltaPts}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            <span>
              <span style={{ color: "var(--text-secondary)" }}>Pos:</span> {team.leaguePosition}
            </span>
            <span>
              <span style={{ color: "var(--text-secondary)" }}>Pts:</span> {team.points}
            </span>
            <span>
              <span style={{ color: "var(--text-secondary)" }}>Expected:</span> {team.marketValueRank}th → {team.expectedPoints}pts
            </span>
            <span>
              <span style={{ color: "var(--text-secondary)" }}>Avg:</span> {formatValue(team.marketValue)}
            </span>
          </div>

          {/* Manager info */}
          {showManager && team.clubId && (
            <div className="mt-2 text-[11px] sm:text-sm" style={{ color: "var(--text-muted)" }}>
              {managerLoading ? (
                <ManagerSkeleton />
              ) : manager ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    Manager:{" "}
                    <a
                      href={manager.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                      style={{ color: "var(--accent-blue)" }}
                    >
                      {manager.name}
                    </a>
                  </span>
                  <ManagerPPGBadge manager={manager} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Component that renders both lists with aligned card rows
function TeamListsGrid({
  overperformers,
  underperformers,
}: {
  overperformers: TeamFormEntry[];
  underperformers: TeamFormEntry[];
}) {
  const allClubIds = useMemo(() => {
    const ids = [...overperformers, ...underperformers].map((t) => t.clubId).filter(Boolean);
    return [...new Set(ids)];
  }, [overperformers, underperformers]);

  const managerQueries = useQueries({
    queries: allClubIds.map((clubId) => ({
      queryKey: ["manager", clubId],
      queryFn: () => fetchManager(clubId),
      staleTime: 24 * 60 * 60 * 1000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  const managersMap = useMemo(() => {
    const map: Record<string, { manager: ManagerInfo | null; loading: boolean }> = {};
    allClubIds.forEach((clubId, i) => {
      map[clubId] = {
        manager: managerQueries[i].data?.manager ?? null,
        loading: managerQueries[i].isLoading,
      };
    });
    return map;
  }, [managerQueries, allClubIds]);

  const maxLength = Math.max(overperformers.length, underperformers.length);

  const renderTeamCard = (team: TeamFormEntry, rank: number, type: "over" | "under", index: number) => (
    <TeamCard
      team={team}
      rank={rank}
      type={type}
      manager={managersMap[team.clubId]?.manager}
      managerLoading={managersMap[team.clubId]?.loading}
      index={index}
    />
  );

  return (
    <div className="animate-fade-in">
      {/* Desktop: aligned grid rows */}
      <div className="hidden md:block">
        {/* Headers */}
        <div className="grid grid-cols-2 gap-6 mb-3">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "#16a34a" }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Overperformers
          </h2>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "#dc2626" }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Underperformers
          </h2>
        </div>

        {/* Card rows */}
        <div className="space-y-3">
          {Array.from({ length: maxLength }).map((_, idx) => {
            const overTeam = overperformers[idx];
            const underTeam = underperformers[idx];

            return (
              <div key={idx} className="grid grid-cols-2 gap-6 items-stretch">
                <div className="flex">
                  {overTeam ? renderTeamCard(overTeam, idx + 1, "over", idx) : <div />}
                </div>
                <div className="flex">
                  {underTeam ? renderTeamCard(underTeam, idx + 1, "under", idx) : <div />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: stacked lists */}
      <div className="md:hidden space-y-6">
        {/* Overperformers */}
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3" style={{ color: "#16a34a" }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Overperformers
          </h2>
          <div className="space-y-3">
            {overperformers.map((team, idx) => (
              <div key={`${team.name}-${team.league}`}>
                {renderTeamCard(team, idx + 1, "over", idx)}
              </div>
            ))}
          </div>
        </div>

        {/* Underperformers */}
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-3" style={{ color: "#dc2626" }}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Underperformers
          </h2>
          <div className="space-y-3">
            {underperformers.map((team, idx) => (
              <div key={`${team.name}-${team.league}`}>
                {renderTeamCard(team, idx + 1, "under", idx)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamFormUI({ initialData }: TeamFormUIProps) {
  const data = initialData;

  // Initialize with all leagues shown
  const [selectedLeague, setSelectedLeague] = useState<string>("all");

  // Filter teams based on selected league
  const filteredOverperformers = useMemo(
    () => selectedLeague === "all"
      ? data.overperformers
      : data.overperformers.filter((team) => team.league === selectedLeague),
    [data.overperformers, selectedLeague]
  );

  const filteredUnderperformers = useMemo(
    () => selectedLeague === "all"
      ? data.underperformers
      : data.underperformers.filter((team) => team.league === selectedLeague),
    [data.underperformers, selectedLeague]
  );

  return (
    <>
      <LeagueFilter
        selectedLeague={selectedLeague}
        onValueChange={setSelectedLeague}
      />

      <TeamListsGrid
        overperformers={filteredOverperformers}
        underperformers={filteredUnderperformers}
      />
    </>
  );
}
