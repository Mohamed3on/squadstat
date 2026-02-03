"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/app/components/Header";
import type { InjuredPlayer } from "@/app/types";

interface TeamInjuryGroup {
  club: string;
  clubLogoUrl: string;
  league: string;
  players: InjuredPlayer[];
  totalValue: number;
  count: number;
}

interface InjuredResponse {
  success: boolean;
  players: InjuredPlayer[];
  totalPlayers: number;
  leagues: string[];
}

async function fetchInjuredPlayers(): Promise<InjuredResponse> {
  const res = await fetch("/api/injured");
  if (!res.ok) throw new Error("Failed to fetch injured players");
  return res.json();
}

function formatValue(value: string): string {
  return value || "-";
}

function getLeagueColor(league: string): string {
  const colors: Record<string, string> = {
    "Bundesliga": "#d20515",
    "Premier League": "#38003c",
    "La Liga": "#ff4b44",
    "Serie A": "#024494",
    "Ligue 1": "#dae025",
  };
  return colors[league] || "#666";
}

function PlayerCard({ player, rank }: { player: InjuredPlayer; rank: number }) {
  return (
    <div
      className="rounded-xl p-3 sm:p-4 transition-all hover:scale-[1.01]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Rank */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
          style={{
            background: rank <= 3 ? "var(--accent-hot)" : "var(--bg-elevated)",
            color: rank <= 3 ? "var(--bg-base)" : "var(--text-muted)",
          }}
        >
          {rank}
        </div>

        {/* Player Image */}
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)" }}>
          {player.imageUrl && !player.imageUrl.includes("data:image") ? (
            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl" style={{ color: "var(--text-muted)" }}>
              ?
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={player.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sm sm:text-base hover:underline block truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {player.name}
              </a>
              <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>
                {player.position}
              </p>
            </div>
            <div
              className="text-sm sm:text-lg font-black shrink-0"
              style={{ color: "var(--accent-hot)" }}
            >
              {formatValue(player.marketValue)}
            </div>
          </div>

          {/* Club & League */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
            {player.clubLogoUrl && (
              <img src={player.clubLogoUrl} alt={player.club} className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
            )}
            <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" style={{ color: "var(--text-secondary)" }}>
              {player.club}
            </span>
            <span
              className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold shrink-0"
              style={{
                background: getLeagueColor(player.league),
                color: player.league === "Ligue 1" ? "#000" : "#fff",
              }}
            >
              {player.league}
            </span>
          </div>

          {/* Injury Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "#ef4444" }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="truncate max-w-[150px] sm:max-w-none" style={{ color: "var(--text-secondary)" }}>{player.injury}</span>
            </span>
            {player.returnDate && (
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                Until {player.returnDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatValueNum(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(0)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}K`;
  }
  return `€${value}`;
}

function TeamInjuryCard({ team, rank }: { team: TeamInjuryGroup; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const displayPlayers = expanded ? team.players : team.players.slice(0, 3);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Team Header */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Rank */}
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0"
            style={{
              background: rank <= 3 ? "var(--accent-hot)" : "var(--bg-elevated)",
              color: rank <= 3 ? "var(--bg-base)" : "var(--text-muted)",
            }}
          >
            {rank}
          </div>

          {/* Club Logo */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            {team.clubLogoUrl ? (
              <img src={team.clubLogoUrl} alt={team.club} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            ) : (
              <div className="text-xl" style={{ color: "var(--text-muted)" }}>?</div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base truncate" style={{ color: "var(--text-primary)" }}>
                  {team.club}
                </h3>
                <span
                  className="inline-block px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold mt-0.5"
                  style={{
                    background: getLeagueColor(team.league),
                    color: team.league === "Ligue 1" ? "#000" : "#fff",
                  }}
                >
                  {team.league}
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-lg font-black" style={{ color: "var(--accent-hot)" }}>
                  {formatValueNum(team.totalValue)}
                </div>
                <div className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
                  {team.count} {team.count === 1 ? "player" : "players"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {displayPlayers.map((player) => (
            <a
              key={player.name}
              href={player.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] sm:text-xs hover:scale-[1.02] transition-transform"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              {player.imageUrl && !player.imageUrl.includes("data:image") && (
                <img src={player.imageUrl} alt={player.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
              )}
              <span className="truncate max-w-[80px] sm:max-w-[120px]" style={{ color: "var(--text-primary)" }}>{player.name}</span>
              <span style={{ color: "var(--accent-hot)" }}>{player.marketValue}</span>
            </a>
          ))}
          {team.players.length > 3 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--accent-blue)" }}
            >
              +{team.players.length - 3} more
            </button>
          )}
          {expanded && team.players.length > 3 && (
            <button
              onClick={() => setExpanded(false)}
              className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
            >
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-4 animate-pulse"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
            <div className="w-14 h-14 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-5 rounded w-1/3" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-4 rounded w-1/4" style={{ background: "var(--bg-elevated)" }} />
              <div className="h-4 rounded w-1/2" style={{ background: "var(--bg-elevated)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type ViewMode = "players" | "teams";

export function InjuredUI() {
  const [viewMode, setViewMode] = useState<ViewMode>("players");

  const { data, isLoading, error } = useQuery({
    queryKey: ["injured"],
    queryFn: fetchInjuredPlayers,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const totalValue = data?.players.reduce((sum, p) => sum + p.marketValueNum, 0) || 0;
  const formattedTotalValue = totalValue >= 1_000_000_000
    ? `€${(totalValue / 1_000_000_000).toFixed(2)}B`
    : `€${(totalValue / 1_000_000).toFixed(0)}M`;

  // Group players by team
  const teamGroups = useMemo(() => {
    if (!data?.players) return [];

    const groupMap = new Map<string, TeamInjuryGroup>();

    data.players.forEach((player) => {
      const existing = groupMap.get(player.club);
      if (existing) {
        existing.players.push(player);
        existing.totalValue += player.marketValueNum;
        existing.count++;
      } else {
        groupMap.set(player.club, {
          club: player.club,
          clubLogoUrl: player.clubLogoUrl,
          league: player.league,
          players: [player],
          totalValue: player.marketValueNum,
          count: 1,
        });
      }
    });

    // Sort by total value descending
    return Array.from(groupMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [data?.players]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Header />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2" style={{ color: "var(--text-primary)" }}>
            Injured Players
          </h1>
          <p className="text-sm sm:text-lg" style={{ color: "var(--text-muted)" }}>
            Highest value injured players across Europe&apos;s top 5 leagues
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 rounded-lg mb-4 sm:mb-6 w-fit" style={{ background: "var(--bg-elevated)" }}>
          <button
            onClick={() => setViewMode("players")}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
            style={{
              background: viewMode === "players" ? "var(--bg-card)" : "transparent",
              color: viewMode === "players" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: viewMode === "players" ? "var(--shadow-card)" : "none",
            }}
          >
            All Players
          </button>
          <button
            onClick={() => setViewMode("teams")}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
            style={{
              background: viewMode === "teams" ? "var(--bg-card)" : "transparent",
              color: viewMode === "teams" ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: viewMode === "teams" ? "var(--shadow-card)" : "none",
            }}
          >
            By Team
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {data.totalPlayers}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Players
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {teamGroups.length}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Teams
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {teamGroups[0]?.count || 0}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Most Injured
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {formattedTotalValue}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Total Value
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading && <LoadingSkeleton />}

        {error && (
          <div
            className="p-4 rounded-xl text-center"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
          >
            <p style={{ color: "#ef4444" }}>Failed to load injured players. Please try again.</p>
          </div>
        )}

        {data && viewMode === "players" && (
          <div className="space-y-3">
            {data.players.map((player, idx) => (
              <PlayerCard key={`${player.name}-${player.club}`} player={player} rank={idx + 1} />
            ))}
          </div>
        )}

        {data && viewMode === "teams" && (
          <div className="space-y-3">
            {teamGroups.map((team, idx) => (
              <TeamInjuryCard key={team.club} team={team} rank={idx + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
