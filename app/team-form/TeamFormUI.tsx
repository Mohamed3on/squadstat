"use client";

import { useMemo } from "react";
import type { TeamFormEntry } from "@/app/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ManagerSection } from "@/app/components/ManagerPPGBadge";
import { LEAGUES, getLeagueLogoUrl, getLeagueUrl } from "@/lib/leagues";
import { useQueryParams } from "@/lib/hooks/use-query-params";

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

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function LeagueFilter({ selectedLeague, onValueChange }: { selectedLeague: string; onValueChange: (value: string) => void }) {
  return (
    <div className="mb-4 sm:mb-6">
      <p className="text-sm font-medium mb-3 text-text-secondary">
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
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 border border-border-subtle text-text-muted hover:text-text-secondary hover:bg-card/50 active:scale-[0.97] data-[state=on]:bg-card data-[state=on]:border-accent-blue data-[state=on]:text-accent-blue data-[state=on]:shadow-[0_0_12px_rgba(88,166,255,0.2)]"
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
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 flex items-center gap-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-card-hover active:scale-[0.97]"
              style={isSelected ? {
                backgroundColor: color,
                borderColor: color,
                color: league.name === "Ligue 1" ? "#000" : "#fff",
                boxShadow: `0 0 12px ${color}40`,
              } : undefined}
            >
              <img src={getLeagueLogoUrl(league.name)} alt="" className="w-4 h-4 object-contain rounded-sm bg-white p-px" />
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
  index?: number;
}

function TeamCard({ team, rank, type, index = 0 }: TeamCardProps) {
  const isOver = type === "over";
  const manager = team.manager;

  return (
    <Card
      className="h-full w-full overflow-hidden hover-lift animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <div className="flex items-stretch">
        {/* Main content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Rank */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${rank <= 3 ? (isOver ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-elevated text-text-muted"}`}
            >
              {rank}
            </div>

            {/* Club Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 bg-white shadow-sm">
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
              ) : (
                <div className="text-xl text-text-muted">?</div>
              )}
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <a
                href={team.clubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sm sm:text-base hover:underline block truncate text-text-primary"
              >
                {team.name}
              </a>
              <a href={getLeagueUrl(team.league)} target="_blank" rel="noopener noreferrer">
                <Badge
                  className="mt-0.5 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs shrink-0 flex items-center gap-1 w-fit hover:opacity-80 transition-opacity"
                  style={{
                    background: getLeagueColor(team.league),
                    color: team.league === "Ligue 1" ? "#000" : "#fff",
                    border: "none",
                  }}
                >
                  {getLeagueLogoUrl(team.league) && <img src={getLeagueLogoUrl(team.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
                  {team.league}
                </Badge>
              </a>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2.5 text-xs sm:text-sm text-text-muted">
            <span>
              <span className="text-text-secondary">{ordinal(team.leaguePosition)}</span> · {team.points}pts
            </span>
            <span className="text-border-medium">|</span>
            <span>
              <span className="text-text-secondary">Exp:</span> {ordinal(team.marketValueRank)} → {team.expectedPoints}pts
            </span>
            <span className="text-border-medium">|</span>
            <span>
              <span className="text-text-secondary">Avg:</span> {formatValue(team.marketValue)}
            </span>
          </div>

          {/* Manager info */}
          {manager && (
            <div className="mt-2 text-[11px] sm:text-sm text-text-muted">
              <ManagerSection manager={manager} />
            </div>
          )}
        </div>

        {/* Delta strip */}
        <div
          className={`w-16 sm:w-20 flex flex-col items-center justify-center shrink-0 border-l ${isOver ? "border-l-green-600/20 bg-green-600/[0.06]" : "border-l-red-600/20 bg-red-600/[0.06]"}`}
        >
          <span
            className={`text-xl sm:text-2xl font-display ${isOver ? "text-green-600" : "text-red-600"}`}
          >
            {team.deltaPts > 0 ? `+${team.deltaPts}` : team.deltaPts}
          </span>
          <span
            className={`text-[9px] uppercase tracking-wider mt-0.5 ${isOver ? "text-green-600/60" : "text-red-600/60"}`}
          >
            pts
          </span>
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
  const maxLength = Math.max(overperformers.length, underperformers.length);

  const renderTeamCard = (team: TeamFormEntry, rank: number, type: "over" | "under", index: number) => (
    <TeamCard
      team={team}
      rank={rank}
      type={type}
      index={index}
    />
  );

  return (
    <div className="animate-fade-in">
      {/* Desktop: aligned grid rows */}
      <div className="hidden md:block">
        {/* Headers */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 shrink-0 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Overperformers
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-600/10 text-green-600/70">
              {overperformers.length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-green-600/30" />
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 shrink-0 text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Underperformers
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-red-600/10 text-red-600/70">
              {underperformers.length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-red-600/30" />
          </div>
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
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2 shrink-0 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Overperformers
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-600/10 text-green-600/70">
              {overperformers.length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-green-600/30" />
          </div>
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
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2 shrink-0 text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Underperformers
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-red-600/10 text-red-600/70">
              {underperformers.length}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-red-600/30" />
          </div>
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
  const { params, update } = useQueryParams("/team-form");
  const requestedLeague = params.get("league");
  const selectedLeague = requestedLeague && LEAGUES.some((league) => league.name === requestedLeague)
    ? requestedLeague
    : "all";

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
        onValueChange={(value) => update({ league: value === "all" ? null : value })}
      />

      <TeamListsGrid
        overperformers={filteredOverperformers}
        underperformers={filteredUnderperformers}
      />
    </>
  );
}
