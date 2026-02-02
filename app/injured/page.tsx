"use client";

import { useQuery } from "@tanstack/react-query";
import { Header } from "@/app/components/Header";
import type { InjuredPlayer } from "@/app/types";

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
      className="rounded-xl p-4 transition-all hover:scale-[1.01]"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            background: rank <= 3 ? "var(--accent-hot)" : "var(--bg-elevated)",
            color: rank <= 3 ? "var(--bg-base)" : "var(--text-muted)",
          }}
        >
          {rank}
        </div>

        {/* Player Image */}
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-elevated)" }}>
          {player.imageUrl && !player.imageUrl.includes("data:image") ? (
            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: "var(--text-muted)" }}>
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
                className="font-bold text-base hover:underline block truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {player.name}
              </a>
              <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                {player.position}
              </p>
            </div>
            <div
              className="text-lg font-black shrink-0"
              style={{ color: "var(--accent-hot)" }}
            >
              {formatValue(player.marketValue)}
            </div>
          </div>

          {/* Club & League */}
          <div className="flex items-center gap-2 mt-2">
            {player.clubLogoUrl && (
              <img src={player.clubLogoUrl} alt={player.club} className="w-5 h-5 object-contain" />
            )}
            <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
              {player.club}
            </span>
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
              style={{
                background: getLeagueColor(player.league),
                color: player.league === "Ligue 1" ? "#000" : "#fff",
              }}
            >
              {player.league}
            </span>
          </div>

          {/* Injury Info */}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" style={{ color: "#ef4444" }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span style={{ color: "var(--text-secondary)" }}>{player.injury}</span>
            </span>
            {player.returnDate && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                Until {player.returnDate}
              </span>
            )}
          </div>
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

export default function InjuredPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["injured"],
    queryFn: fetchInjuredPlayers,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const totalValue = data?.players.reduce((sum, p) => sum + p.marketValueNum, 0) || 0;
  const formattedTotalValue = totalValue >= 1_000_000_000
    ? `${(totalValue / 1_000_000_000).toFixed(2)}B`
    : `${(totalValue / 1_000_000).toFixed(0)}M`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
            Injured Players
          </h1>
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            Highest value injured players across Europe&apos;s top 5 leagues
          </p>
        </div>

        {/* Stats */}
        {data && (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 p-4 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {data.totalPlayers}
              </div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Players
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {data.leagues.length}
              </div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Leagues
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {data.players[0]?.marketValue || "-"}
              </div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Highest
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: "var(--accent-hot)" }}>
                {formattedTotalValue}
              </div>
              <div className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
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

        {data && (
          <div className="space-y-3">
            {data.players.map((player, idx) => (
              <PlayerCard key={`${player.name}-${player.club}`} player={player} rank={idx + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
