"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Header } from "@/app/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

function getLeagueStyle(league: string): { bg: string; text: string } {
  const styles: Record<string, { bg: string; text: string }> = {
    Bundesliga: { bg: "bg-red-600", text: "text-white" },
    "Premier League": { bg: "bg-purple-900", text: "text-white" },
    "La Liga": { bg: "bg-orange-500", text: "text-white" },
    "Serie A": { bg: "bg-blue-700", text: "text-white" },
    "Ligue 1": { bg: "bg-yellow-400", text: "text-black" },
  };
  return styles[league] || { bg: "bg-gray-600", text: "text-white" };
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

function RankBadge({ rank }: { rank: number }) {
  return (
    <div
      className={cn(
        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0",
        rank <= 3
          ? "bg-[var(--accent-hot)] text-[var(--bg-base)]"
          : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
      )}
    >
      {rank}
    </div>
  );
}

function PlayerCard({ player, rank }: { player: InjuredPlayer; rank: number }) {
  const leagueStyle = getLeagueStyle(player.league);

  return (
    <Card className="transition-all hover:scale-[1.005] hover:shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <RankBadge rank={rank} />

          {/* Player Image */}
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
            {player.imageUrl && !player.imageUrl.includes("data:image") ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl text-[var(--text-muted)]">
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
                  className="font-bold text-sm sm:text-base hover:underline block truncate text-[var(--text-primary)]"
                >
                  {player.name}
                </a>
                <p className="text-xs sm:text-sm truncate text-[var(--text-muted)]">
                  {player.position}
                </p>
              </div>
              <span className="text-sm sm:text-lg font-black shrink-0 text-[var(--accent-hot)]">
                {formatValue(player.marketValue)}
              </span>
            </div>

            {/* Club & League */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
              {player.clubLogoUrl && (
                <img src={player.clubLogoUrl} alt={player.club} className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
              )}
              <span className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none text-[var(--text-secondary)]">
                {player.club}
              </span>
              <Badge className={cn("text-[10px] sm:text-xs", leagueStyle.bg, leagueStyle.text)}>
                {player.league}
              </Badge>
            </div>

            {/* Injury Info */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm">
              <Badge variant="destructive" className="gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="truncate max-w-[150px] sm:max-w-none">{player.injury}</span>
              </Badge>
              {player.returnDate && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  Until {player.returnDate}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamInjuryCard({ team, rank }: { team: TeamInjuryGroup; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const displayPlayers = expanded ? team.players : team.players.slice(0, 3);
  const leagueStyle = getLeagueStyle(team.league);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <RankBadge rank={rank} />

          {/* Club Logo */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-[var(--bg-elevated)]">
            {team.clubLogoUrl ? (
              <img src={team.clubLogoUrl} alt={team.club} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            ) : (
              <div className="text-xl text-[var(--text-muted)]">?</div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base truncate text-[var(--text-primary)]">
                  {team.club}
                </h3>
                <Badge className={cn("mt-0.5 text-[10px] sm:text-xs", leagueStyle.bg, leagueStyle.text)}>
                  {team.league}
                </Badge>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-lg font-black text-[var(--accent-hot)]">
                  {formatValueNum(team.totalValue)}
                </div>
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
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
              key={player.profileUrl || player.name}
              href={player.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] sm:text-xs hover:scale-[1.02] transition-transform bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
            >
              {player.imageUrl && !player.imageUrl.includes("data:image") && (
                <img src={player.imageUrl} alt={player.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
              )}
              <span className="truncate max-w-[80px] sm:max-w-[120px] text-[var(--text-primary)]">{player.name}</span>
              <span className="text-[var(--accent-hot)] font-medium">{player.marketValue}</span>
            </a>
          ))}
          {team.players.length > 3 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-[var(--bg-elevated)] text-[var(--accent-blue)] hover:bg-[var(--bg-card)] transition-colors"
            >
              +{team.players.length - 3} more
            </button>
          )}
          {expanded && team.players.length > 3 && (
            <button
              onClick={() => setExpanded(false)}
              className="px-2 py-1 rounded-lg text-[11px] sm:text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="w-14 h-14 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 rounded w-1/3 bg-[var(--bg-elevated)]" />
                <div className="h-4 rounded w-1/4 bg-[var(--bg-elevated)]" />
                <div className="h-4 rounded w-1/2 bg-[var(--bg-elevated)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl sm:text-2xl font-black text-[var(--accent-hot)]">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </div>
    </div>
  );
}

export function InjuredUI() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["injured"],
    queryFn: fetchInjuredPlayers,
    staleTime: 1000 * 60 * 30,
  });

  const totalValue = data?.players.reduce((sum, p) => sum + p.marketValueNum, 0) || 0;
  const formattedTotalValue = totalValue >= 1_000_000_000
    ? `€${(totalValue / 1_000_000_000).toFixed(2)}B`
    : `€${(totalValue / 1_000_000).toFixed(0)}M`;

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

    return Array.from(groupMap.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [data?.players]);

  const mostInjuredTeam = useMemo(() => {
    if (!teamGroups.length) return null;
    return teamGroups.reduce((max, team) => (team.count > max.count ? team : max), teamGroups[0]);
  }, [teamGroups]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Header />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[var(--text-primary)]">
            Injured Players
          </h1>
          <p className="text-sm sm:text-lg text-[var(--text-muted)]">
            Highest value injured players across Europe&apos;s top 5 leagues
          </p>
        </div>

        {/* Stats */}
        {data && (
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <StatCard value={data.totalPlayers} label="Players" />
                <StatCard value={teamGroups.length} label="Teams" />
                <StatCard value={mostInjuredTeam?.count || 0} label="Most Injured" />
                <StatCard value={formattedTotalValue} label="Total Value" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="mb-4 sm:mb-6">
            <TabsTrigger value="players">All Players</TabsTrigger>
            <TabsTrigger value="teams">By Team</TabsTrigger>
          </TabsList>

          {isLoading && <LoadingSkeleton />}

          {error && (
            <Card className="border-red-500/30 bg-red-500/10">
              <CardContent className="p-4 text-center">
                <p className="text-red-500">Failed to load injured players. Please try again.</p>
              </CardContent>
            </Card>
          )}

          <TabsContent value="players">
            {data && (
              <div className="space-y-3">
                {data.players.map((player, idx) => (
                  <PlayerCard key={`${player.name}-${player.club}`} player={player} rank={idx + 1} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams">
            {data && (
              <div className="space-y-3">
                {teamGroups.map((team, idx) => (
                  <TeamInjuryCard key={team.club} team={team} rank={idx + 1} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
