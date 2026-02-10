"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getLeagueLogoUrl } from "@/lib/leagues";

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
  isNewSigning?: boolean;
}

interface PlayerFormResult {
  targetPlayer: PlayerStats;
  underperformers: PlayerStats[];
  outperformers: PlayerStats[];
  totalPlayers: number;
  error?: string;
  searchedName?: string;
}

interface UnderperformersResult {
  underperformers: PlayerStats[];
}

const QUERY_PARAM_KEYS = {
  name: "name",
  benchTop5: "bTop5",
  underLeague: "uLeague",
  underClub: "uClub",
  scorersSort: "sSort",
  scorersTop5: "sTop5",
  scorersNew: "sNew",
  scorersLeague: "sLeague",
  scorersClub: "sClub",
} as const;

async function fetchUnderperformers(signal?: AbortSignal): Promise<UnderperformersResult> {
  const res = await fetch("/api/underperformers", { signal });
  return res.json();
}

async function fetchPlayerForm(
  name: string,
  signal?: AbortSignal
): Promise<PlayerFormResult> {
  const params = new URLSearchParams({ name });
  const res = await fetch(`/api/player-form?${params}`, { signal });
  return res.json();
}

async function fetchPlayers(signal?: AbortSignal): Promise<PlayerStats[]> {
  const res = await fetch("/api/players", { signal });
  const data = await res.json();
  return data.players || [];
}

function getPlayerBenchmarkHref(name: string): string {
  return `/player-form?${new URLSearchParams({ [QUERY_PARAM_KEYS.name]: name }).toString()}`;
}

function filterPlayersByLeagueAndClub(
  players: PlayerStats[],
  leagueFilter: string,
  clubFilter: string
): PlayerStats[] {
  const normalizedClub = clubFilter.trim().toLowerCase();
  return players.filter((player) => {
    if (leagueFilter !== "all" && player.league !== leagueFilter) return false;
    if (normalizedClub && !player.club.toLowerCase().includes(normalizedClub)) return false;
    return true;
  });
}

function MinutesDisplay({
  minutes,
}: {
  minutes?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
        {minutes?.toLocaleString() || "—"}&apos;
      </span>
    </div>
  );
}

function TargetPlayerCard({
  player,
  minutes,
}: {
  player: PlayerStats;
  minutes?: number;
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
        <span className="text-base sm:text-lg font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>
          {minutes?.toLocaleString() || "—"}&apos;
        </span>
      </div>
    </div>
  );
}

function UnderperformerCard({
  player,
  targetPlayer,
  minutes,
  index = 0,
}: {
  player: PlayerStats;
  targetPlayer: PlayerStats;
  minutes?: number;
  index?: number;
}) {
  const valueDiff = player.marketValue - targetPlayer.marketValue;
  const valueDiffDisplay = valueDiff >= 1_000_000
    ? `+€${(valueDiff / 1_000_000).toFixed(1)}m`
    : `+€${(valueDiff / 1_000).toFixed(0)}k`;
  const pointsDiff = targetPlayer.points - player.points;

  return (
    <ComparisonCard
      player={player}
      index={index}
      minutes={minutes}
      variant="underperformer"
      valueDeltaLabel={valueDiffDisplay}
      pointsDeltaLabel={`−${pointsDiff}`}
    />
  );
}

type ComparisonCardVariant = "underperformer" | "outperformer";

const COMPARISON_CARD_THEME: Record<
  ComparisonCardVariant,
  {
    gradientStart: string;
    border: string;
    rankBackground: string;
    accentColor: string;
    accentMutedColor: string;
    imageBorder: string;
  }
> = {
  underperformer: {
    gradientStart: "var(--accent-cold-faint)",
    border: "var(--accent-cold-glow)",
    rankBackground: "var(--accent-cold-glow)",
    accentColor: "var(--accent-cold-soft)",
    accentMutedColor: "var(--accent-cold-muted)",
    imageBorder: "var(--accent-cold-border)",
  },
  outperformer: {
    gradientStart: "var(--accent-hot-faint)",
    border: "var(--accent-hot-glow)",
    rankBackground: "var(--accent-hot-glow)",
    accentColor: "var(--accent-hot)",
    accentMutedColor: "var(--accent-hot-muted)",
    imageBorder: "var(--accent-hot-border)",
  },
};

function ComparisonCard({
  player,
  index = 0,
  minutes,
  variant,
  valueDeltaLabel,
  pointsDeltaLabel,
}: {
  player: PlayerStats;
  index?: number;
  minutes?: number;
  variant: ComparisonCardVariant;
  valueDeltaLabel: string;
  pointsDeltaLabel: string;
}) {
  const theme = COMPARISON_CARD_THEME[variant];

  return (
    <div
      className="group rounded-xl p-3 sm:p-4 animate-slide-up hover-lift"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientStart} 0%, var(--bg-card) 100%)`,
        border: `1px solid ${theme.border}`,
        animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Rank indicator */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
          style={{
            background: theme.rankBackground,
            color: theme.accentColor,
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
                border: `1px solid ${theme.imageBorder}`,
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
          {variant === "underperformer" ? (
            <Link
              href={getPlayerBenchmarkHref(player.name)}
              className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {player.name}
            </Link>
          ) : (
            <a
              href={`https://www.transfermarkt.com${player.profileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors"
              style={{ color: "var(--text-primary)" }}
            >
              {player.name}
            </a>
          )}
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
            <div className="text-sm font-bold tabular-nums" style={{ color: theme.accentColor }}>
              {player.marketValueDisplay}
            </div>
            <div
              className="text-[10px] font-medium tabular-nums"
              style={{ color: theme.accentMutedColor }}
            >
              {valueDeltaLabel}
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
              style={{ color: theme.accentColor }}
            >
              {pointsDeltaLabel}
            </div>
          </div>

          {/* Minutes */}
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="min-w-[4.5rem]">
            <MinutesDisplay
              minutes={minutes}
            />
          </div>
        </div>

        {/* Mobile: just value */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: theme.accentColor }}>
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
          />
        </div>
        <span className="hidden sm:flex items-center gap-1 ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {getLeagueLogoUrl(player.league) && <img src={getLeagueLogoUrl(player.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
          {player.league}
        </span>
      </div>
    </div>
  );
}

function OutperformerCard({
  player,
  targetPlayer,
  index = 0,
}: {
  player: PlayerStats;
  targetPlayer: PlayerStats;
  index?: number;
}) {
  const valueSaved = targetPlayer.marketValue - player.marketValue;
  const valueSavedDisplay = valueSaved >= 1_000_000
    ? `€${(valueSaved / 1_000_000).toFixed(1)}m less`
    : valueSaved > 0
    ? `€${(valueSaved / 1_000).toFixed(0)}k less`
    : "Same value";
  const pointsMore = player.points - targetPlayer.points;

  return (
    <ComparisonCard
      player={player}
      index={index}
      minutes={player.minutes}
      variant="outperformer"
      valueDeltaLabel={valueSavedDisplay}
      pointsDeltaLabel={`+${pointsMore}`}
    />
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
          <Skeleton className="w-20 h-20 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-6">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-12" />
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
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-14" />
              <Skeleton className="h-10 w-16" />
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
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-14" />
              <Skeleton className="h-10 w-16" />
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
      className="group rounded-xl p-3 sm:p-4 animate-slide-up hover-lift"
      style={{
        background: "linear-gradient(135deg, rgba(255, 71, 87, 0.06) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(255, 71, 87, 0.15)",
        animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
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
          <Link
            href={getPlayerBenchmarkHref(player.name)}
            className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {player.name}
          </Link>
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
        <span className="hidden sm:flex items-center gap-1 ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {getLeagueLogoUrl(player.league) && <img src={getLeagueLogoUrl(player.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
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
  leagueFilter,
  clubFilter,
  onLeagueFilterChange,
  onClubFilterChange,
}: {
  title: string;
  candidates: PlayerStats[];
  isLoading: boolean;
  error: Error | null;
  leagueFilter: string;
  clubFilter: string;
  onLeagueFilterChange: (value: string) => void;
  onClubFilterChange: (value: string) => void;
}) {
  const leagueOptions = useMemo(
    () => Array.from(new Set(candidates.map((p) => p.league).filter(Boolean))).sort(),
    [candidates]
  );

  const filteredCandidates = useMemo(
    () => filterPlayersByLeagueAndClub(candidates, leagueFilter, clubFilter),
    [candidates, leagueFilter, clubFilter]
  );

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
        </div>
        {filteredCandidates.length > 0 && (
          <span
            className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums"
            style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
          >
            {filteredCandidates.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <SelectNative
          value={leagueFilter}
          onChange={(e) => onLeagueFilterChange(e.target.value)}
          className="h-10"
        >
          <option value="all">All leagues</option>
          {leagueOptions.map((league) => (
            <option key={league} value={league}>
              {league}
            </option>
          ))}
        </SelectNative>
        <Input
          value={clubFilter}
          onChange={(e) => onClubFilterChange(e.target.value)}
          placeholder="Filter by club"
          className="h-10"
        />
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

      {!isLoading && !error && filteredCandidates.length === 0 && (
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

      {filteredCandidates.length > 0 && (
        <div className="space-y-3">
          {filteredCandidates.map((player, index) => (
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

function ScorerRow({
  player,
  rank,
}: {
  player: PlayerStats;
  rank: number;
}) {
  return (
    <div
      className="flex items-center gap-3 sm:gap-4 py-2.5 sm:py-3 px-3 sm:px-4 transition-colors hover:bg-[var(--bg-card-hover)]"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <span
        className="w-6 text-center text-xs font-bold tabular-nums shrink-0"
        style={{ color: rank <= 3 ? "var(--accent-gold)" : "var(--text-muted)" }}
      >
        {rank}
      </span>

      {player.imageUrl ? (
        <img
          src={player.imageUrl}
          alt={player.name}
          className="w-8 h-8 rounded-md object-cover shrink-0"
          style={{ background: "var(--bg-elevated)" }}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          {player.name.charAt(0)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <a
          href={`https://www.transfermarkt.com${player.profileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sm hover:underline truncate block"
          style={{ color: "var(--text-primary)" }}
        >
          {player.name}
        </a>
        <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
          {player.position} · {player.club}
        </div>
      </div>

      {/* Desktop stats */}
      <div className="hidden sm:flex items-center gap-4 shrink-0 text-sm tabular-nums">
        <span style={{ color: "var(--text-secondary)" }}>{player.goals}G</span>
        <span style={{ color: "var(--text-secondary)" }}>{player.assists}A</span>
        <span className="font-bold min-w-[3rem] text-right" style={{ color: "var(--accent-hot)" }}>
          {player.points} pts
        </span>
        <span className="min-w-[4rem] text-right" style={{ color: "var(--accent-blue)" }}>
          {player.minutes?.toLocaleString() || "—"}&apos;
        </span>
        <span className="min-w-[4rem] text-right font-medium" style={{ color: "var(--text-secondary)" }}>
          {player.marketValueDisplay}
        </span>
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden text-right shrink-0">
        <div className="text-xs font-bold tabular-nums" style={{ color: "var(--accent-hot)" }}>
          {player.points} pts
        </div>
        <div className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {player.minutes?.toLocaleString() || "—"}&apos; · {player.marketValueDisplay}
        </div>
      </div>
    </div>
  );
}

type ScorerSortKey = "points" | "minutes";

const TOP_5_LEAGUES = ["Premier League", "LaLiga", "Bundesliga", "Serie A", "Ligue 1"];

function ScorersSection({
  players,
  isLoading,
  sortBy,
  onSortChange,
  top5Only,
  onTop5OnlyChange,
  newSigningsOnly,
  onNewSigningsOnlyChange,
  leagueFilter,
  onLeagueFilterChange,
  clubFilter,
  onClubFilterChange,
}: {
  players: PlayerStats[];
  isLoading: boolean;
  sortBy: ScorerSortKey;
  onSortChange: (value: ScorerSortKey) => void;
  top5Only: boolean;
  onTop5OnlyChange: (value: boolean) => void;
  newSigningsOnly: boolean;
  onNewSigningsOnlyChange: (value: boolean) => void;
  leagueFilter: string;
  onLeagueFilterChange: (value: string) => void;
  clubFilter: string;
  onClubFilterChange: (value: string) => void;
}) {
  const leagueOptions = useMemo(
    () => Array.from(new Set(players.map((p) => p.league).filter(Boolean))).sort(),
    [players]
  );

  const filtered = useMemo(() => {
    let list = filterPlayersByLeagueAndClub(players, leagueFilter, clubFilter);
    if (top5Only) {
      list = list.filter((p) => TOP_5_LEAGUES.includes(p.league));
    }
    if (newSigningsOnly) {
      list = list.filter((p) => p.isNewSigning);
    }
    const sorted = [...list].sort((a, b) => {
      if (sortBy === "points") return b.points - a.points || (b.minutes || 0) - (a.minutes || 0);
      return (b.minutes || 0) - (a.minutes || 0) || b.points - a.points;
    });
    return sorted;
  }, [players, sortBy, top5Only, newSigningsOnly, leagueFilter, clubFilter]);

  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: filtered.length,
    estimateSize: () => 60,
    overscan: 10,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  if (isLoading) return <DiscoverySkeleton />;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <ToggleGroup
          type="single"
          value={sortBy}
          onValueChange={(v) => v && onSortChange(v as ScorerSortKey)}
          size="sm"
          className="self-start"
        >
          <ToggleGroupItem value="points" className="rounded-lg px-3">
            <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Points
          </ToggleGroupItem>
          <ToggleGroupItem value="minutes" className="rounded-lg px-3">
            <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Minutes
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SelectNative
            value={leagueFilter}
            onChange={(e) => onLeagueFilterChange(e.target.value)}
            className="h-10"
          >
            <option value="all">All leagues</option>
            {leagueOptions.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </SelectNative>
          <Input
            value={clubFilter}
            onChange={(e) => onClubFilterChange(e.target.value)}
            placeholder="Filter by club"
            className="h-10"
          />
        </div>

        {/* Extra filters */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTop5OnlyChange(!top5Only)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: top5Only ? "rgba(88, 166, 255, 0.15)" : "var(--bg-elevated)",
              color: top5Only ? "var(--accent-blue)" : "var(--text-muted)",
              border: top5Only ? "1px solid rgba(88, 166, 255, 0.3)" : "1px solid var(--border-subtle)",
            }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Top 5 leagues
          </button>
          <button
            type="button"
            onClick={() => onNewSigningsOnlyChange(!newSigningsOnly)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{
              background: newSigningsOnly ? "rgba(0, 255, 135, 0.15)" : "var(--bg-elevated)",
              color: newSigningsOnly ? "#00ff87" : "var(--text-muted)",
              border: newSigningsOnly ? "1px solid rgba(0, 255, 135, 0.3)" : "1px solid var(--border-subtle)",
            }}
          >
            New signings
          </button>
        </div>
      </div>

      {/* Scorer list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
        >
          No players found for this filter combination
        </div>
      ) : (
        <div
          ref={listRef}
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const player = filtered[virtualRow.index];
              return (
                <div
                  key={player.playerId}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 w-full"
                  style={{ top: virtualRow.start - (virtualizer.options.scrollMargin || 0) }}
                >
                  <ScorerRow player={player} rank={virtualRow.index + 1} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Showing {filtered.length} players by {sortBy === "points" ? "goal contributions" : "minutes played"}
          {top5Only ? " (Top 5 leagues)" : ""}
        </p>
      )}
    </div>
  );
}

interface PlayerFormUIProps {
  initialAllPlayers: PlayerStats[];
}

export function PlayerFormUI({ initialAllPlayers }: PlayerFormUIProps) {
  const urlParams = useSearchParams();
  const router = useRouter();

  const urlName = urlParams.get(QUERY_PARAM_KEYS.name) || "";
  const [playerName, setPlayerName] = useState(urlName);
  const selectedName = urlName || null;

  useEffect(() => {
    setPlayerName(urlName);
  }, [urlName]);

  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(urlParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/player-form", { scroll: false });
  }, [router, urlParams]);

  const updateUrl = useCallback((name: string | null) => {
    updateQueryParams({ [QUERY_PARAM_KEYS.name]: name });
  }, [updateQueryParams]);

  const underLeagueFilter = urlParams.get(QUERY_PARAM_KEYS.underLeague) || "all";
  const underClubFilter = urlParams.get(QUERY_PARAM_KEYS.underClub) || "";
  const scorersSortBy = urlParams.get(QUERY_PARAM_KEYS.scorersSort) === "minutes" ? "minutes" : "points";
  const scorersTop5Only = urlParams.get(QUERY_PARAM_KEYS.scorersTop5) === "1";
  const scorersNewOnly = urlParams.get(QUERY_PARAM_KEYS.scorersNew) === "1";
  const scorersLeagueFilter = urlParams.get(QUERY_PARAM_KEYS.scorersLeague) || "all";
  const scorersClubFilter = urlParams.get(QUERY_PARAM_KEYS.scorersClub) || "";
  const benchTop5Only = urlParams.get(QUERY_PARAM_KEYS.benchTop5) === "1";

  // Fetch player list for autocomplete
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ["players"],
    queryFn: ({ signal }) => fetchPlayers(signal),
    staleTime: 5 * 60 * 1000,
    initialData: initialAllPlayers,
  });

  const discoveryQuery = useQuery({
    queryKey: ["underperformers"],
    queryFn: ({ signal }) => fetchUnderperformers(signal),
    staleTime: 5 * 60 * 1000,
    enabled: !selectedName,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["player-form", selectedName],
    queryFn: ({ signal }) => selectedName ? fetchPlayerForm(selectedName, signal) : null,
    enabled: !!selectedName,
    staleTime: 2 * 60 * 1000,
  });

  const hasResults = data?.targetPlayer && !data?.error;

  const targetMinutes = data?.targetPlayer?.minutes;

  const filteredUnderperformers = useMemo(() => {
    if (!data?.underperformers) return [];
    let list = data.underperformers;
    if (targetMinutes !== undefined) {
      list = list.filter((p) => p.minutes === undefined || p.minutes >= targetMinutes);
    }
    if (benchTop5Only) list = list.filter((p) => TOP_5_LEAGUES.includes(p.league));
    return list;
  }, [data?.underperformers, targetMinutes, benchTop5Only]);

  const filteredOutperformers = useMemo(() => {
    if (!data?.outperformers) return [];
    let list = data.outperformers;
    if (targetMinutes !== undefined) {
      list = list.filter((p) => p.minutes === undefined || p.minutes <= targetMinutes);
    }
    if (benchTop5Only) list = list.filter((p) => TOP_5_LEAGUES.includes(p.league));
    return list;
  }, [data?.outperformers, targetMinutes, benchTop5Only]);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Page title */}
        <div className="mb-4 sm:mb-6">
          <h2
            className="text-lg sm:text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Player <span style={{ color: "var(--accent-blue)" }}>Output</span> vs Value
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Overpriced flops and hidden gems across top European leagues
          </p>
        </div>
        {/* Search Form */}
        <div className="mb-6 sm:mb-8">
          <div className="flex-1">
            <PlayerAutocomplete
              players={playersData || []}
              value={playerName}
              onChange={(val) => {
                setPlayerName(val);
                if (!val.trim()) {
                  updateUrl(null);
                }
              }}
              onSelect={(player) => {
                setPlayerName(player.name);
                updateUrl(player.name);
              }}
              placeholder="Search player (e.g. Kenan Yildiz)"
              renderTrailing={(player) => (
                <div className="text-xs tabular-nums shrink-0" style={{ color: "#00ff87" }}>
                  {player.points} pts
                </div>
              )}
            />
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

        {/* Search Results */}
        {hasResults && (
          <div className="space-y-6">
            {/* Benchmark Player */}
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
                minutes={targetMinutes}
              />
            </section>

            {/* Benchmark filters */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.benchTop5]: benchTop5Only ? null : "1",
                  })
                }
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                style={{
                  background: benchTop5Only ? "rgba(88, 166, 255, 0.15)" : "var(--bg-elevated)",
                  color: benchTop5Only ? "var(--accent-blue)" : "var(--text-muted)",
                  border: benchTop5Only ? "1px solid rgba(88, 166, 255, 0.3)" : "1px solid var(--border-subtle)",
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Top 5 leagues
              </button>
            </div>

            {/* Tabs: Overpriced / Better Value */}
            <Tabs defaultValue="overpriced">
              <TabsList className="w-full">
                <TabsTrigger value="overpriced" className="flex-1 gap-2">
                  Overpriced
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                    style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
                  >
                    {filteredUnderperformers.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="better-value" className="flex-1 gap-2">
                  Better Value
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                    style={{ background: "rgba(0, 255, 135, 0.15)", color: "#00ff87" }}
                  >
                    {filteredOutperformers.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Overpriced Tab */}
              <TabsContent value="overpriced">
                {filteredUnderperformers.length === 0 ? (
                  <div
                    className="rounded-xl p-6 sm:p-8 animate-fade-in"
                    style={{ background: "rgba(255, 71, 87, 0.06)", border: "1px solid rgba(255, 71, 87, 0.2)" }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(255, 71, 87, 0.15)" }}
                      >
                        <svg className="w-5 h-5" style={{ color: "#ff6b7a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-base" style={{ color: "#ff6b7a" }}>
                          {data.targetPlayer.name} is the biggest underperformer
                        </p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                          Every player worth {data.targetPlayer.marketValueDisplay} or more has better goal contributions.
                          At {data.targetPlayer.points} points and {data.targetPlayer.marketValueDisplay}, {data.targetPlayer.name} has the worst output relative to their price tag.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.underperformers.length !== filteredUnderperformers.length && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {data.underperformers.length - filteredUnderperformers.length} players filtered (fewer minutes than benchmark)
                      </p>
                    )}
                    {filteredUnderperformers.map((player, index) => (
                      <UnderperformerCard
                        key={player.playerId}
                        player={player}
                        targetPlayer={data.targetPlayer}
                        minutes={player.minutes}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Better Value Tab */}
              <TabsContent value="better-value">
                {filteredOutperformers.length === 0 ? (
                  <div
                    className="rounded-xl p-6 sm:p-8 animate-fade-in"
                    style={{ background: "rgba(0, 255, 135, 0.06)", border: "1px solid rgba(0, 255, 135, 0.2)" }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(0, 255, 135, 0.15)" }}
                      >
                        <svg className="w-5 h-5" style={{ color: "#00ff87" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-base" style={{ color: "#00ff87" }}>
                          {data.targetPlayer.name} is a top performer for their price
                        </p>
                        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                          No player at the same or lower market value
                          {targetMinutes !== undefined ? " with the same or fewer minutes" : ""}
                          {" "}has produced more goal contributions.
                          At {data.targetPlayer.points} points for {data.targetPlayer.marketValueDisplay}, {data.targetPlayer.name} offers excellent value.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.outperformers.length !== filteredOutperformers.length && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {data.outperformers.length - filteredOutperformers.length} players filtered (more minutes than benchmark)
                      </p>
                    )}
                    {filteredOutperformers.map((player, index) => (
                      <OutperformerCard
                        key={player.playerId}
                        player={player}
                        targetPlayer={data.targetPlayer}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

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
          <Tabs defaultValue="underperformers">
            <TabsList className="w-full mb-2">
              <TabsTrigger value="underperformers" className="flex-1">
                Underperformers
              </TabsTrigger>
              <TabsTrigger value="scorers" className="flex-1">
                Top Scorers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="underperformers">
              <UnderperformersSection
                title="Underperformers"
                candidates={discoveryQuery.data?.underperformers || []}
                isLoading={discoveryQuery.isLoading}
                error={(discoveryQuery.error as Error | null) ?? null}
                leagueFilter={underLeagueFilter}
                clubFilter={underClubFilter}
                onLeagueFilterChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.underLeague]: value === "all" ? null : value,
                  })
                }
                onClubFilterChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.underClub]: value || null,
                  })
                }
              />
            </TabsContent>

            <TabsContent value="scorers">
              <ScorersSection
                players={playersData || []}
                isLoading={playersLoading}
                sortBy={scorersSortBy}
                onSortChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.scorersSort]: value === "points" ? null : value,
                  })
                }
                top5Only={scorersTop5Only}
                onTop5OnlyChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.scorersTop5]: value ? "1" : null,
                  })
                }
                newSigningsOnly={scorersNewOnly}
                onNewSigningsOnlyChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.scorersNew]: value ? "1" : null,
                  })
                }
                leagueFilter={scorersLeagueFilter}
                onLeagueFilterChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.scorersLeague]: value === "all" ? null : value,
                  })
                }
                clubFilter={scorersClubFilter}
                onClubFilterChange={(value) =>
                  updateQueryParams({
                    [QUERY_PARAM_KEYS.scorersClub]: value || null,
                  })
                }
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
