"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Header } from "../components/Header";

interface PlayerStats {
  name: string;
  position: string;
  age: number;
  club: string;
  league: string;
  matches: number;
  goals: number;
  assists: number;
  points: number;
  marketValue: number;
  marketValueDisplay: string;
  profileUrl: string;
  imageUrl: string;
  playerId: string;
  minutes?: number;
}

interface PlayerFormResult {
  targetPlayer: PlayerStats;
  underperformers: PlayerStats[];
  totalPlayers: number;
  error?: string;
  searchedName?: string;
}

interface UnderperformersResult {
  underperformers: PlayerStats[];
  cached: boolean;
  cacheAge?: number;
}

async function fetchUnderperformers(position: string, signal?: AbortSignal): Promise<UnderperformersResult> {
  const res = await fetch(`/api/underperformers?position=${position}`, { signal });
  return res.json();
}

async function fetchPlayerForm(
  name: string,
  position: string,
  signal?: AbortSignal
): Promise<PlayerFormResult> {
  const params = new URLSearchParams({ name, position });
  const res = await fetch(`/api/player-form?${params}`, { signal });
  return res.json();
}

async function fetchPlayerMinutes(playerId: string, signal?: AbortSignal): Promise<number> {
  const res = await fetch(`/api/player-minutes/${playerId}`, { signal });
  const data = await res.json();
  return data.minutes || 0;
}

function MinutesDisplay({
  minutes,
  isLoading,
  isFiltered,
}: {
  minutes?: number;
  isLoading?: boolean;
  isFiltered?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {isLoading ? (
        <div className="skeleton h-4 w-14" />
      ) : (
        <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {minutes?.toLocaleString() || "—"}&apos;
        </span>
      )}
      {isFiltered === false && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium uppercase tracking-wide"
          style={{ background: "rgba(255, 71, 87, 0.2)", color: "#ff6b7a" }}
        >
          fewer
        </span>
      )}
    </div>
  );
}

function TargetPlayerCard({
  player,
  minutes,
  minutesLoading,
}: {
  player: PlayerStats;
  minutes?: number;
  minutesLoading?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-6 animate-scale-in"
      style={{
        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)",
        border: "1px solid rgba(255, 215, 0, 0.3)",
        boxShadow: "0 0 60px rgba(255, 215, 0, 0.08), inset 0 1px 0 rgba(255, 215, 0, 0.1)",
      }}
    >
      {/* Decorative corner accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-20"
        style={{
          background: "radial-gradient(circle at top right, rgba(255, 215, 0, 0.4), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        {/* Player image with gold ring and mobile key metrics */}
        <div className="flex items-start gap-4 sm:block">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-xl opacity-60"
              style={{
                background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                filter: "blur(4px)",
              }}
            />
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover"
                style={{ border: "2px solid rgba(255, 215, 0, 0.5)" }}
              />
            ) : (
              <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold"
                style={{
                  background: "var(--bg-elevated)",
                  color: "#ffd700",
                  border: "2px solid rgba(255, 215, 0, 0.5)",
                }}
              >
                {player.name.charAt(0)}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs"
              style={{
                background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                color: "#000",
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(255, 215, 0, 0.4)",
              }}
            >
              ★
            </div>
          </div>

          {/* Mobile-only: player name and position */}
          <div className="flex-1 min-w-0 sm:hidden">
            <a
              href={`https://www.transfermarkt.com${player.profileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-lg hover:underline block truncate"
              style={{ color: "#ffd700" }}
            >
              {player.name}
            </a>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="font-medium">{player.position}</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span className="truncate opacity-80">{player.club}</span>
            </div>
          </div>
        </div>

        {/* Player info - desktop */}
        <div className="hidden sm:block flex-1 min-w-0">
          <a
            href={`https://www.transfermarkt.com${player.profileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-xl hover:underline block truncate"
            style={{ color: "#ffd700" }}
          >
            {player.name}
          </a>
          <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-medium">{player.position}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span className="truncate opacity-80">{player.club}</span>
          </div>

          {/* Stats row - desktop */}
          <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="tabular-nums">{player.goals}G</span>
            <span className="tabular-nums">{player.assists}A</span>
            <span className="tabular-nums">{player.matches} apps</span>
            <span className="opacity-60">Age {player.age}</span>
          </div>
        </div>

        {/* Key metrics - desktop */}
        <div className="hidden sm:flex gap-6 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums" style={{ color: "#ffd700" }}>
              {player.marketValueDisplay}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>
              Value
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums" style={{ color: "#00ff87" }}>
              {player.points}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>
              Points
            </div>
          </div>
        </div>

        {/* Mobile: stats and key metrics row */}
        <div className="sm:hidden flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.15)" }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="tabular-nums">{player.goals}G</span>
            <span className="tabular-nums">{player.assists}A</span>
            <span className="tabular-nums">{player.matches} apps</span>
            <span className="opacity-60">Age {player.age}</span>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-center">
              <div className="text-lg font-black tabular-nums" style={{ color: "#ffd700" }}>
                {player.marketValueDisplay}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black tabular-nums" style={{ color: "#00ff87" }}>
                {player.points}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minutes row */}
      <div
        className="mt-3 sm:mt-4 pt-3 sm:pt-4 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255, 215, 0, 0.15)" }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Minutes Played
        </span>
        {minutesLoading ? (
          <div className="skeleton h-5 w-16" />
        ) : (
          <span className="text-base sm:text-lg font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>
            {minutes?.toLocaleString() || "—"}&apos;
          </span>
        )}
      </div>
    </div>
  );
}

function UnderperformerCard({
  player,
  targetPlayer,
  minutes,
  minutesLoading,
  passesMinutesFilter,
  index = 0,
}: {
  player: PlayerStats;
  targetPlayer: PlayerStats;
  minutes?: number;
  minutesLoading?: boolean;
  passesMinutesFilter?: boolean;
  index?: number;
}) {
  const valueDiff = player.marketValue - targetPlayer.marketValue;
  const valueDiffDisplay = valueDiff >= 1_000_000
    ? `+€${(valueDiff / 1_000_000).toFixed(1)}m`
    : `+€${(valueDiff / 1_000).toFixed(0)}k`;
  const pointsDiff = targetPlayer.points - player.points;

  return (
    <div
      className="group rounded-xl p-3 sm:p-4 transition-all duration-200 animate-slide-up hover:translate-x-1"
      style={{
        background: "linear-gradient(135deg, rgba(255, 71, 87, 0.06) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(255, 71, 87, 0.15)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank indicator */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
          style={{
            background: "rgba(255, 71, 87, 0.15)",
            color: "#ff6b7a",
          }}
        >
          {index + 1}
        </div>

        {/* Player image */}
        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid rgba(255, 71, 87, 0.2)",
              }}
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <a
            href={`https://www.transfermarkt.com${player.profileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {player.name}
          </a>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mt-0.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span>{player.position}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span className="truncate max-w-[100px] sm:max-w-none">{player.club}</span>
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>•</span>
            <span className="hidden sm:inline">{player.age}y</span>
          </div>
        </div>

        {/* Comparison metrics - desktop */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* Value comparison */}
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: "#ff6b7a" }}>
              {player.marketValueDisplay}
            </div>
            <div
              className="text-[10px] font-medium tabular-nums"
              style={{ color: "rgba(255, 107, 122, 0.7)" }}
            >
              {valueDiffDisplay}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />

          {/* Points comparison */}
          <div className="text-right min-w-[3rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {player.points} pts
            </div>
            <div
              className="text-[10px] font-medium tabular-nums"
              style={{ color: "#ff6b7a" }}
            >
              −{pointsDiff}
            </div>
          </div>

          {/* Minutes */}
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="min-w-[4.5rem]">
            <MinutesDisplay
              minutes={minutes}
              isLoading={minutesLoading}
              isFiltered={passesMinutesFilter}
            />
          </div>
        </div>

        {/* Mobile: just value */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: "#ff6b7a" }}>
            {player.marketValueDisplay}
          </div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--text-primary)" }}>
            {player.points} pts
          </div>
        </div>
      </div>

      {/* Stats row - more info on mobile */}
      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 text-[10px] sm:text-xs" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.matches} apps</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-muted)" }}>{player.age}y</span>
        {/* Mobile: show minutes inline */}
        <div className="sm:hidden ml-auto">
          <MinutesDisplay
            minutes={minutes}
            isLoading={minutesLoading}
            isFiltered={passesMinutesFilter}
          />
        </div>
        <span className="hidden sm:block ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {player.league}
        </span>
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Target skeleton */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-start gap-5">
          <div className="skeleton w-20 h-20 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-40" />
          </div>
          <div className="flex gap-6">
            <div className="skeleton h-12 w-20" />
            <div className="skeleton h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Underperformer skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            opacity: 1 - i * 0.15,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="skeleton w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-3 w-48" />
            </div>
            <div className="flex gap-3">
              <div className="skeleton h-10 w-16" />
              <div className="skeleton h-10 w-14" />
              <div className="skeleton h-10 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DiscoverySkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            opacity: 1 - i * 0.1,
          }}
        >
          <div className="flex items-center gap-4">
            <div className="skeleton w-8 h-8 rounded-lg" />
            <div className="skeleton w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-3 w-48" />
            </div>
            <div className="flex gap-3">
              <div className="skeleton h-10 w-16" />
              <div className="skeleton h-10 w-14" />
              <div className="skeleton h-10 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnderperformerListCard({
  player,
  index = 0,
}: {
  player: PlayerStats;
  index?: number;
}) {
  return (
    <div
      className="group rounded-xl p-3 sm:p-4 transition-all duration-200 animate-slide-up hover:translate-x-1"
      style={{
        background: "linear-gradient(135deg, rgba(255, 71, 87, 0.06) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(255, 71, 87, 0.15)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank indicator */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
          style={{
            background: "rgba(255, 71, 87, 0.15)",
            color: "#ff6b7a",
          }}
        >
          {index + 1}
        </div>

        {/* Player image */}
        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid rgba(255, 71, 87, 0.2)",
              }}
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <a
            href={`https://www.transfermarkt.com${player.profileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {player.name}
          </a>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mt-0.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span>{player.position}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span className="truncate max-w-[100px] sm:max-w-none">{player.club}</span>
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>•</span>
            <span className="hidden sm:inline">{player.age}y</span>
          </div>
        </div>

        {/* Metrics - desktop */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: "#ff6b7a" }}>
              {player.marketValueDisplay}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              value
            </div>
          </div>

          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />

          <div className="text-right min-w-[3rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {player.points} pts
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              G+A
            </div>
          </div>

          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />

          <div className="text-right min-w-[4rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>
              {player.minutes?.toLocaleString() || "—"}&apos;
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              mins
            </div>
          </div>
        </div>

        {/* Metrics - mobile */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: "#ff6b7a" }}>
            {player.marketValueDisplay}
          </div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--text-primary)" }}>
            {player.points} pts
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 text-[10px] sm:text-xs" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.matches} apps</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-muted)" }}>{player.age}y</span>
        {/* Mobile: show minutes */}
        <span className="sm:hidden ml-auto tabular-nums" style={{ color: "var(--accent-blue)" }}>
          {player.minutes?.toLocaleString() || "—"}&apos;
        </span>
        <span className="hidden sm:block ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {player.league}
        </span>
      </div>
    </div>
  );
}

function UnderperformersSection({
  title,
  candidates,
  isLoading,
  error,
}: {
  title: string;
  candidates: PlayerStats[];
  isLoading: boolean;
  error: Error | null;
}) {
  const playerIds = candidates.map((p) => p.playerId);

  // Fetch minutes for all candidates in parallel
  const minutesQueries = useQueries({
    queries: playerIds.map((playerId) => ({
      queryKey: ["player-minutes", playerId],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchPlayerMinutes(playerId, signal),
      enabled: !!playerId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Build minutes map and filter to real underperformers
  const { playersWithMinutes, realUnderperformers, isFiltering } = useMemo(() => {
    const withMinutes = candidates.map((player, idx) => ({
      ...player,
      minutes: minutesQueries[idx]?.data,
      minutesLoading: minutesQueries[idx]?.isLoading ?? true,
    }));

    // Check if still loading any minutes
    const stillLoading = withMinutes.some((p) => p.minutesLoading);

    // Filter to real underperformers: no one with >= value AND >= minutes has fewer points
    const filtered = withMinutes.filter((player) => {
      const playerMins = player.minutes;
      if (playerMins === undefined) return true; // Keep while loading
      const dominated = withMinutes.some(
        (other) =>
          other.playerId !== player.playerId &&
          other.minutes !== undefined &&
          other.marketValue >= player.marketValue &&
          other.minutes >= playerMins &&
          other.points < player.points
      );
      return !dominated;
    });

    return {
      playersWithMinutes: withMinutes,
      realUnderperformers: filtered,
      isFiltering: stillLoading,
    };
  }, [candidates, minutesQueries]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: "#ff4757" }}
          />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#ff6b7a" }}>
            {title}
          </h2>
          {isFiltering && !isLoading && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full border-2 animate-spin"
                style={{ borderColor: "transparent", borderTopColor: "var(--accent-blue)" }}
              />
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                filtering...
              </span>
            </div>
          )}
        </div>
        {realUnderperformers.length > 0 && (
          <span
            className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums"
            style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
          >
            {realUnderperformers.length}
          </span>
        )}
      </div>

      {isLoading && <DiscoverySkeleton />}

      {error && (
        <div
          className="rounded-xl p-5 animate-fade-in"
          style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}
        >
          <p className="font-medium" style={{ color: "#ff6b7a" }}>
            Error loading data. Please refresh.
          </p>
        </div>
      )}

      {!isLoading && !error && realUnderperformers.length === 0 && !isFiltering && (
        <div
          className="rounded-xl p-8 text-center animate-fade-in"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            No underperformers found
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            All players are performing as expected for their market value
          </p>
        </div>
      )}

      {realUnderperformers.length > 0 && (
        <div className="space-y-3">
          {realUnderperformers.map((player, index) => (
            <UnderperformerListCard
              key={player.playerId}
              player={player}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const DISCOVERY_POSITIONS = [
  { key: "forward", title: "All Forwards" },
  { key: "cf", title: "Centre-Forwards" },
] as const;

export function PlayerFormUI() {
  const [playerName, setPlayerName] = useState("");
  const [position, setPosition] = useState("forward");
  const [searchParams, setSearchParams] = useState<{ name: string; position: string } | null>(null);

  // Fetch both positions in parallel for discovery view
  const discoveryQueries = useQueries({
    queries: DISCOVERY_POSITIONS.map((pos) => ({
      queryKey: ["underperformers", pos.key],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchUnderperformers(pos.key, signal),
      staleTime: 5 * 60 * 1000,
      enabled: !searchParams, // Only fetch when not searching
    })),
  });

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["player-form", searchParams],
    queryFn: ({ signal }) => searchParams ? fetchPlayerForm(searchParams.name, searchParams.position, signal) : null,
    enabled: !!searchParams,
    staleTime: 2 * 60 * 1000,
  });

  const hasResults = data?.targetPlayer && !data?.error;

  const targetMinutesQuery = useQuery({
    queryKey: ["player-minutes", data?.targetPlayer?.playerId],
    queryFn: ({ signal }) => fetchPlayerMinutes(data!.targetPlayer.playerId, signal),
    enabled: hasResults && !!data?.targetPlayer?.playerId,
    staleTime: 5 * 60 * 1000,
  });

  const underperformerIds = data?.underperformers?.map((p) => p.playerId) || [];
  const underperformerMinutesQueries = useQueries({
    queries: underperformerIds.map((playerId) => ({
      queryKey: ["player-minutes", playerId],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchPlayerMinutes(playerId, signal),
      enabled: hasResults && !!playerId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const minutesFilterActive = targetMinutesQuery.data !== undefined;

  const minutesMap = useMemo(() => {
    const map: Record<string, { minutes?: number; isLoading: boolean; passesFilter?: boolean }> = {};
    const targetMinutes = targetMinutesQuery.data;

    underperformerIds.forEach((playerId, index) => {
      const query = underperformerMinutesQueries[index];
      const minutes = query?.data;
      const isLoading = query?.isLoading ?? true;

      let passesFilter: boolean | undefined;
      if (targetMinutes !== undefined && minutes !== undefined) {
        passesFilter = minutes >= targetMinutes;
      }

      map[playerId] = { minutes, isLoading, passesFilter };
    });

    return map;
  }, [underperformerIds, underperformerMinutesQueries, targetMinutesQuery.data]);

  const filteredUnderperformers = useMemo(() => {
    if (!data?.underperformers) return [];
    const targetMinutes = targetMinutesQuery.data;
    if (targetMinutes === undefined) return data.underperformers;
    return data.underperformers.filter((player) => {
      const info = minutesMap[player.playerId];
      return info?.isLoading || info?.passesFilter !== false;
    });
  }, [data?.underperformers, targetMinutesQuery.data, minutesMap]);

  const handleSearch = useCallback(() => {
    if (playerName.trim()) {
      setSearchParams({ name: playerName.trim(), position });
    }
  }, [playerName, position]);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Header />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Page title */}
        <div className="mb-4 sm:mb-6">
          <h2
            className="text-lg sm:text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Under<span style={{ color: "#ff6b7a" }}>performers</span>
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Expensive players underdelivering on goal contributions
          </p>
        </div>
        {/* Search Form */}
        <div
          className="rounded-xl p-3 sm:p-4 mb-6 sm:mb-8"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search player (e.g. Kenan Yildiz)"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 animate-spin" style={{ color: "#ffd700" }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm transition-colors focus:outline-none"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)"
                }}
              >
                <option value="forward">All Forwards</option>
                <option value="cf">Centre-Forward</option>
                <option value="midfielder">Midfielders</option>
              </select>

              <button
                onClick={handleSearch}
                disabled={!playerName.trim() || isLoading}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #ffd700, #ff8c00)",
                  color: "#000",
                  boxShadow: !playerName.trim() || isLoading ? "none" : "0 4px 20px rgba(255, 215, 0, 0.3)",
                }}
              >
                Scout
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <SearchSkeleton />}

        {/* Error States */}
        {error && (
          <div
            className="rounded-xl p-5 mb-6 animate-fade-in"
            style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}
          >
            <p className="font-medium" style={{ color: "#ff6b7a" }}>
              Error fetching data. Please try again.
            </p>
          </div>
        )}

        {data?.error && (
          <div
            className="rounded-xl p-5 mb-6 animate-fade-in"
            style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}
          >
            <p className="font-medium" style={{ color: "#ff6b7a" }}>
              {data.error}
            </p>
            {data.searchedName && (
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Searched for &ldquo;{data.searchedName}&rdquo; across {data.totalPlayers} players
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-8">
            {/* Target Player */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ background: "#ffd700" }}
                />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ffd700" }}>
                  Benchmark Player
                </h2>
              </div>
              <TargetPlayerCard
                player={data.targetPlayer}
                minutes={targetMinutesQuery.data}
                minutesLoading={targetMinutesQuery.isLoading}
              />
            </section>

            {/* Underperformers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#ff4757" }}
                  />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ff6b7a" }}>
                    Overpriced &amp; Underperforming
                  </h2>
                  {!minutesFilterActive && hasResults && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full border-2 animate-spin"
                        style={{ borderColor: "transparent", borderTopColor: "var(--accent-blue)" }}
                      />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        filtering by minutes...
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {data.underperformers.length !== filteredUnderperformers.length && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {data.underperformers.length - filteredUnderperformers.length} filtered
                    </span>
                  )}
                  <span
                    className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums"
                    style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
                  >
                    {filteredUnderperformers.length}
                  </span>
                </div>
              </div>

              {filteredUnderperformers.length === 0 ? (
                <div
                  className="rounded-xl p-10 text-center animate-fade-in"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="text-5xl mb-3">📊</div>
                  <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                    No Underperformers Found
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    All higher-valued players are producing more points than {data.targetPlayer.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUnderperformers.map((player, index) => {
                    const minutesInfo = minutesMap[player.playerId];
                    return (
                      <UnderperformerCard
                        key={player.playerId}
                        player={player}
                        targetPlayer={data.targetPlayer}
                        minutes={minutesInfo?.minutes}
                        minutesLoading={minutesInfo?.isLoading}
                        passesMinutesFilter={minutesInfo?.passesFilter}
                        index={index}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Footer */}
            <div
              className="text-center py-6 text-xs animate-fade-in"
              style={{ color: "var(--text-muted)", animationDelay: "0.3s" }}
            >
              Analyzed {data.totalPlayers.toLocaleString()} players across top European leagues
            </div>
          </div>
        )}

        {/* Default Discovery View */}
        {!isLoading && !data && (
          <div className="space-y-10">
            {DISCOVERY_POSITIONS.map((pos, idx) => (
              <UnderperformersSection
                key={pos.key}
                title={pos.title}
                candidates={discoveryQueries[idx]?.data?.underperformers || []}
                isLoading={discoveryQueries[idx]?.isLoading ?? true}
                error={discoveryQueries[idx]?.error ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
