"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { DebouncedInput } from "@/components/DebouncedInput";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectNative } from "@/components/ui/select-native";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getLeagueLogoUrl } from "@/lib/leagues";
import { filterPlayersByLeagueAndClub, TOP_5_LEAGUES } from "@/lib/filter-players";
import { canBeOutperformerAgainst } from "@/lib/positions";
import { formatReturnInfo, PROFIL_RE } from "@/lib/format";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { BenchmarkCard, BigNumber } from "./BenchmarkCard";
import type { PlayerStats, MinutesValuePlayer, InjuryMap } from "@/app/types";

type Mode = "ga" | "mins";
type CompareTab = "less" | "more";
type UnderperformerSortKey = "value" | "most-outperformed";

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

const EMPTY_MV: MinutesValuePlayer[] = [];

function formatValue(v: number): string {
  if (v >= 1_000_000) return `\u20AC${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `\u20AC${(v / 1_000).toFixed(0)}k`;
  return `\u20AC${v}`;
}

function getPlayerBenchmarkHref(name: string): string {
  return `/underperformers?${new URLSearchParams({ name }).toString()}`;
}

async function fetchUnderperformers(signal?: AbortSignal): Promise<UnderperformersResult> {
  const res = await fetch("/api/underperformers", { signal });
  return res.json();
}

async function fetchPlayerForm(name: string, signal?: AbortSignal): Promise<PlayerFormResult> {
  const params = new URLSearchParams({ name });
  const res = await fetch(`/api/player-form?${params}`, { signal });
  return res.json();
}

/* ── G+A Components ── */

function MinutesDisplay({ minutes }: { minutes?: number }) {
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

function TargetPlayerCard({ player, minutes }: { player: PlayerStats; minutes?: number }) {
  return (
    <BenchmarkCard
      name={player.name}
      imageUrl={player.imageUrl}
      href={`https://www.transfermarkt.com${player.profileUrl}`}
      subtitle={<><span className="font-medium">{player.position}</span><span style={{ opacity: 0.4 }}>•</span><span className="truncate opacity-80">{player.club}</span></>}
      desktopStats={<><span className="tabular-nums">{player.goals}G</span><span className="tabular-nums">{player.assists}A</span><span className="tabular-nums">{player.matches} apps</span><span className="opacity-60">Age {player.age}</span></>}
      mobileStats={<><span className="tabular-nums">{player.goals}G</span><span className="tabular-nums">{player.assists}A</span><span className="tabular-nums">{player.matches} apps</span><span className="opacity-60">Age {player.age}</span></>}
      desktopBigNumbers={<><BigNumber value={player.marketValueDisplay} label="Value" color="#ffd700" /><BigNumber value={String(player.points)} label="Points" color="#00ff87" /></>}
      mobileBigNumbers={<><div className="text-lg font-black tabular-nums" style={{ color: "#ffd700" }}>{player.marketValueDisplay}</div><div className="text-lg font-black tabular-nums" style={{ color: "#00ff87" }}>{player.points}</div></>}
      footer={<><span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Minutes Played</span><span className="text-base sm:text-lg font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{minutes?.toLocaleString() || "—"}&apos;</span></>}
    />
  );
}

type ComparisonCardVariant = "underperformer" | "outperformer";

const COMPARISON_CARD_THEME: Record<ComparisonCardVariant, { gradientStart: string; border: string; rankBackground: string; accentColor: string; accentMutedColor: string; imageBorder: string }> = {
  underperformer: {
    gradientStart: "var(--accent-cold-faint)", border: "var(--accent-cold-glow)", rankBackground: "var(--accent-cold-glow)",
    accentColor: "var(--accent-cold-soft)", accentMutedColor: "var(--accent-cold-muted)", imageBorder: "var(--accent-cold-border)",
  },
  outperformer: {
    gradientStart: "var(--accent-hot-faint)", border: "var(--accent-hot-glow)", rankBackground: "var(--accent-hot-glow)",
    accentColor: "var(--accent-hot)", accentMutedColor: "var(--accent-hot-muted)", imageBorder: "var(--accent-hot-border)",
  },
};

function ComparisonCard({ player, index = 0, minutes, variant, valueDeltaLabel, pointsDeltaLabel }: {
  player: PlayerStats; index?: number; minutes?: number; variant: ComparisonCardVariant; valueDeltaLabel: string; pointsDeltaLabel: string;
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
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0" style={{ background: theme.rankBackground, color: theme.accentColor }}>
          {index + 1}
        </div>
        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img src={player.imageUrl} alt={player.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover" style={{ background: "var(--bg-elevated)", border: `1px solid ${theme.imageBorder}` }} />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {player.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {variant === "underperformer" ? (
            <Link href={getPlayerBenchmarkHref(player.name)} className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors" style={{ color: "var(--text-primary)" }}>
              {player.name}
            </Link>
          ) : (
            <a href={`https://www.transfermarkt.com${player.profileUrl}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors" style={{ color: "var(--text-primary)" }}>
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
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: theme.accentColor }}>{player.marketValueDisplay}</div>
            <div className="text-[10px] font-medium tabular-nums" style={{ color: theme.accentMutedColor }}>{valueDeltaLabel}</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[3rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
            <div className="text-[10px] font-medium tabular-nums" style={{ color: theme.accentColor }}>{pointsDeltaLabel}</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="min-w-[4.5rem]"><MinutesDisplay minutes={minutes} /></div>
        </div>
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: theme.accentColor }}>{player.marketValueDisplay}</div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 text-[10px] sm:text-xs" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.matches} apps</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-muted)" }}>{player.age}y</span>
        <div className="sm:hidden ml-auto"><MinutesDisplay minutes={minutes} /></div>
        <span className="hidden sm:flex items-center gap-1 ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {getLeagueLogoUrl(player.league) && <img src={getLeagueLogoUrl(player.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
          {player.league}
        </span>
      </div>
    </div>
  );
}

function UnderperformerCard({ player, targetPlayer, minutes, index = 0 }: { player: PlayerStats; targetPlayer: PlayerStats; minutes?: number; index?: number }) {
  const valueDiff = player.marketValue - targetPlayer.marketValue;
  const valueDiffDisplay = valueDiff >= 1_000_000 ? `+€${(valueDiff / 1_000_000).toFixed(1)}m` : `+€${(valueDiff / 1_000).toFixed(0)}k`;
  const pointsDiff = targetPlayer.points - player.points;
  return <ComparisonCard player={player} index={index} minutes={minutes} variant="underperformer" valueDeltaLabel={valueDiffDisplay} pointsDeltaLabel={`−${pointsDiff}`} />;
}

function OutperformerCard({ player, targetPlayer, index = 0 }: { player: PlayerStats; targetPlayer: PlayerStats; index?: number }) {
  const valueSaved = targetPlayer.marketValue - player.marketValue;
  const valueSavedDisplay = valueSaved >= 1_000_000 ? `€${(valueSaved / 1_000_000).toFixed(1)}m less` : valueSaved > 0 ? `€${(valueSaved / 1_000).toFixed(0)}k less` : "Same value";
  const pointsMore = player.points - targetPlayer.points;
  return <ComparisonCard player={player} index={index} minutes={player.minutes} variant="outperformer" valueDeltaLabel={valueSavedDisplay} pointsDeltaLabel={`+${pointsMore}`} />;
}

function CardSkeletonList({ count = 5, fadeStep = 0.1 }: { count?: number; fadeStep?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", opacity: 1 - (i + 1) * fadeStep }}>
          <div className="flex items-center gap-4">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-3 w-48" /></div>
            <div className="flex gap-3"><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-14" /><Skeleton className="h-10 w-16" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-start gap-5">
          <Skeleton className="w-20 h-20 rounded-xl" />
          <div className="flex-1 space-y-3"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-40" /></div>
          <div className="flex gap-6"><Skeleton className="h-12 w-20" /><Skeleton className="h-12 w-12" /></div>
        </div>
      </div>
      <CardSkeletonList count={4} fadeStep={0.15} />
    </div>
  );
}

function UnderperformerListCard({ player, index = 0 }: { player: PlayerStats; index?: number }) {
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
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0" style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}>
          {index + 1}
        </div>
        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img src={player.imageUrl} alt={player.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover" style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255, 71, 87, 0.2)" }} />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {player.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={getPlayerBenchmarkHref(player.name)} className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors" style={{ color: "var(--text-primary)" }}>
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
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {player.outperformedByCount !== undefined && player.outperformedByCount > 0 && (
            <>
              <div className="text-right min-w-[4rem]">
                <div className="text-sm font-bold tabular-nums" style={{ color: "#00ff87" }}>{player.outperformedByCount}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>doing better</div>
              </div>
              <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
            </>
          )}
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: "#ff6b7a" }}>{player.marketValueDisplay}</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>value</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[3rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>G+A</div>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[4rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes?.toLocaleString() || "—"}&apos;</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>mins</div>
          </div>
        </div>
        <div className="sm:hidden text-right shrink-0">
          {player.outperformedByCount !== undefined && player.outperformedByCount > 0 && (
            <div className="text-[10px] font-bold tabular-nums mb-0.5" style={{ color: "#00ff87" }}>{player.outperformedByCount} doing better</div>
          )}
          <div className="text-xs font-bold tabular-nums" style={{ color: "#ff6b7a" }}>{player.marketValueDisplay}</div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 text-[10px] sm:text-xs" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.matches} apps</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-muted)" }}>{player.age}y</span>
        <span className="sm:hidden ml-auto tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes?.toLocaleString() || "—"}&apos;</span>
        <span className="hidden sm:flex items-center gap-1 ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {getLeagueLogoUrl(player.league) && <img src={getLeagueLogoUrl(player.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
          {player.league}
        </span>
      </div>
    </div>
  );
}

function UnderperformersSection({ candidates, allPlayers, isLoading, error, sortBy, onSortChange, leagueFilter, clubFilter, onLeagueFilterChange, onClubFilterChange, top5Only, onTop5Change }: {
  candidates: PlayerStats[]; allPlayers: PlayerStats[]; isLoading: boolean; error: Error | null;
  sortBy: UnderperformerSortKey; onSortChange: (value: UnderperformerSortKey) => void;
  leagueFilter: string; clubFilter: string; onLeagueFilterChange: (value: string) => void; onClubFilterChange: (value: string) => void;
  top5Only: boolean; onTop5Change: (value: boolean) => void;
}) {
  const leagueOptions = useMemo(() => Array.from(new Set(candidates.map((p) => p.league).filter(Boolean))).sort(), [candidates]);

  const top5Players = useMemo(
    () => top5Only ? allPlayers.filter((p) => TOP_5_LEAGUES.includes(p.league)) : [],
    [allPlayers, top5Only]
  );

  const filteredCandidates = useMemo(() => {
    let filtered = filterPlayersByLeagueAndClub(candidates, leagueFilter, clubFilter);
    if (top5Only) {
      filtered = filtered.filter((p) => TOP_5_LEAGUES.includes(p.league));
      filtered = filtered.map((player) => {
        const count = top5Players.filter((p) =>
          p.marketValue < player.marketValue &&
          p.points > player.points &&
          canBeOutperformerAgainst(p.position, player.position) &&
          (p.minutes === undefined || player.minutes === undefined || p.minutes <= player.minutes)
        ).length;
        return { ...player, outperformedByCount: count };
      });
    }
    if (sortBy === "most-outperformed") return [...filtered].sort((a, b) => (b.outperformedByCount || 0) - (a.outperformedByCount || 0));
    return filtered;
  }, [candidates, top5Players, leagueFilter, clubFilter, sortBy, top5Only]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#ff4757" }} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#ff6b7a" }}>Underdelivering</h2>
        </div>
        {filteredCandidates.length > 0 && (
          <span className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums" style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}>{filteredCandidates.length}</span>
        )}
      </div>
      <div className="flex flex-col gap-3 mb-4">
        <ToggleGroup type="single" value={sortBy} onValueChange={(v) => v && onSortChange(v as UnderperformerSortKey)} size="sm" className="self-start">
          <ToggleGroupItem value="value" className="rounded-lg px-3">
            <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m4 0l4 4m0 0l4-4m-4 4V4" /></svg>
            Value
          </ToggleGroupItem>
          <ToggleGroupItem value="most-outperformed" className="rounded-lg px-3">
            <svg className="w-3 h-3 mr-1 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            Most underperforming
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <SelectNative value={leagueFilter} onChange={(e) => onLeagueFilterChange(e.target.value)} className="h-10">
            <option value="all">All leagues</option>
            {leagueOptions.map((league) => (<option key={league} value={league}>{league}</option>))}
          </SelectNative>
          <DebouncedInput value={clubFilter} onChange={onClubFilterChange} placeholder="Filter by club" className="h-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTop5Change(!top5Only)}
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
            vs Top 5 leagues
          </button>
        </div>
      </div>
      {isLoading && <CardSkeletonList />}
      {error && (
        <div className="rounded-xl p-5 animate-fade-in" style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}>
          <p className="font-medium" style={{ color: "#ff6b7a" }}>Error loading data. Please refresh.</p>
        </div>
      )}
      {!isLoading && !error && filteredCandidates.length === 0 && (
        <div className="rounded-xl p-8 text-center animate-fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No underdelivering players found</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Everyone is producing as expected for their price tag</p>
        </div>
      )}
      {filteredCandidates.length > 0 && (
        <div className="space-y-3">
          {filteredCandidates.map((player, index) => (<UnderperformerListCard key={player.playerId} player={player} index={index} />))}
        </div>
      )}
    </section>
  );
}

/* ── Minutes Components ── */

const MINS_THEME = {
  less: { bg: "rgba(255, 71, 87, 0.06)", border: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a", rankBg: "rgba(255, 71, 87, 0.15)", imgBorder: "1px solid rgba(255, 71, 87, 0.2)" },
  more: { bg: "rgba(34, 197, 94, 0.06)", border: "rgba(34, 197, 94, 0.15)", color: "#22c55e", rankBg: "rgba(34, 197, 94, 0.15)", imgBorder: "1px solid rgba(34, 197, 94, 0.2)" },
} as const;

function MvBenchmarkCard({ player }: { player: MinutesValuePlayer }) {
  return (
    <BenchmarkCard
      name={player.name}
      imageUrl={player.imageUrl}
      href={`https://www.transfermarkt.com${player.profileUrl.replace(PROFIL_RE, "/leistungsdaten/")}`}
      subtitle={<><span className="font-medium">{player.position}</span>{player.nationality && <><span style={{ opacity: 0.4 }}>·</span><span>{player.nationality}</span></>}</>}
      desktopStats={<><span className="tabular-nums">{player.totalMatches} games</span><span className="tabular-nums">{player.goals} goals</span><span className="tabular-nums">{player.assists} assists</span><span className="opacity-60">Age {player.age}</span></>}
      mobileStats={<><span className="tabular-nums">{player.totalMatches} games</span><span className="tabular-nums">{player.goals}G {player.assists}A</span><span className="opacity-60">Age {player.age}</span></>}
      desktopBigNumbers={<><BigNumber value={player.marketValueDisplay} label="Value" color="#ffd700" /><BigNumber value={`${player.minutes.toLocaleString()}'`} label="Minutes" color="var(--accent-blue)" /></>}
      mobileBigNumbers={<div className="text-lg font-black tabular-nums" style={{ color: "#ffd700" }}>{player.marketValueDisplay}</div>}
    />
  );
}

function MvPlayerCard({ player, target, index, variant = "less", onSelect, injuryMap }: {
  player: MinutesValuePlayer; target?: MinutesValuePlayer; index: number; variant?: CompareTab; onSelect?: (p: MinutesValuePlayer) => void; injuryMap?: InjuryMap;
}) {
  const t = MINS_THEME[variant];
  const valueDiff = target ? player.marketValue - target.marketValue : 0;
  const valueDiffDisplay = valueDiff > 0 ? `+${formatValue(valueDiff)}` : formatValue(valueDiff);
  const minsDiff = target ? player.minutes - target.minutes : 0;

  return (
    <div
      className="group rounded-xl p-3 sm:p-4 animate-slide-up hover-lift"
      style={{
        background: `linear-gradient(135deg, ${t.bg} 0%, var(--bg-card) 100%)`,
        border: `1px solid ${t.border}`,
        animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0" style={{ background: t.rankBg, color: t.color }}>
          {index + 1}
        </div>
        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img src={player.imageUrl} alt={player.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover" style={{ background: "var(--bg-elevated)", border: t.imgBorder }} />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {player.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <button type="button" onClick={() => onSelect?.(player)} className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors text-left" style={{ color: "var(--text-primary)" }}>
            {player.name}
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mt-0.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span>{player.position}</span>
            {variant === "less" && injuryMap?.[player.playerId] && (() => {
              const info = injuryMap[player.playerId];
              const ret = formatReturnInfo(info.returnDate);
              return (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,71,87,0.12)] text-[#ff6b7a]">
                    {info.injury}{ret ? ` · ${ret.label}` : ""}
                  </span>
                </>
              );
            })()}
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>·</span>
            <span className="hidden sm:inline">{player.age}y</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: t.color }}>{player.marketValueDisplay}</div>
            {target && <div className="text-[10px] font-medium tabular-nums" style={{ color: t.color, opacity: 0.7 }}>{valueDiffDisplay}</div>}
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[4rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes.toLocaleString()}&apos;</div>
            {target && <div className="text-[10px] font-medium tabular-nums" style={{ color: t.color }}>{variant === "more" ? "+" : "\u2212"}{Math.abs(minsDiff).toLocaleString()}&apos;</div>}
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.totalMatches}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>games</div>
            </div>
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.goals}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>goals</div>
            </div>
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.assists}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>assists</div>
            </div>
          </div>
        </div>
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: t.color }}>{player.marketValueDisplay}</div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes.toLocaleString()}&apos;</div>
        </div>
      </div>
    </div>
  );
}

const ROW_HEIGHT = 100;
const GAP = 12;

function MvVirtualPlayerList({ items, target, variant = "less", onSelect, injuryMap }: {
  items: MinutesValuePlayer[]; target?: MinutesValuePlayer; variant?: CompareTab; onSelect?: (p: MinutesValuePlayer) => void; injuryMap?: InjuryMap;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    gap: GAP,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <div ref={listRef}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={items[virtualRow.index].playerId}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 w-full"
            style={{ top: virtualRow.start - (virtualizer.options.scrollMargin || 0) }}
          >
            <MvPlayerCard player={items[virtualRow.index]} target={target} index={virtualRow.index} variant={variant} onSelect={onSelect} injuryMap={injuryMap} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ── */

interface UnderperformersUIProps {
  initialAllPlayers: PlayerStats[];
  initialData: MinutesValuePlayer[];
  injuryMap?: InjuryMap;
}

export function UnderperformersUI({ initialAllPlayers, initialData, injuryMap }: UnderperformersUIProps) {
  const { params, update, push } = useQueryParams("/underperformers");

  // Mode
  const mode: Mode = params.get("mode") === "mins" ? "mins" : "ga";
  const urlName = params.get("name") || "";
  const [query, setQuery] = useState(urlName);
  useEffect(() => { setQuery(urlName); }, [urlName]);

  const handleSelect = useCallback((name: string) => { push({ name }); }, [push]);
  const handleClear = useCallback(() => { push({ name: null, tab: null }); }, [push]);

  // ── G+A state ──
  const underLeagueFilter = params.get("uLeague") || "all";
  const underClubFilter = params.get("uClub") || "";
  const underSortBy: UnderperformerSortKey = params.get("uSort") === "most-outperformed" ? "most-outperformed" : "value";
  const underTop5Only = params.get("uTop5") === "1";
  const benchTop5Only = params.get("bTop5") === "1";

  // ── Shared tab state (both modes use `tab` param since they're mutually exclusive) ──
  const gaTab = params.get("tab") === "better-value" ? "better-value" : "underdelivering";
  const minsTab: CompareTab = params.get("tab") === "more" ? "more" : "less";
  const minsLeagueFilter = params.get("mLeague") || "all";
  const minsClubFilter = params.get("mClub") || "";
  const minsHideInjured = params.get("noInj") === "1";

  // ── G+A queries ──
  const discoveryQuery = useQuery({
    queryKey: ["underperformers"],
    queryFn: ({ signal }) => fetchUnderperformers(signal),
    staleTime: 5 * 60 * 1000,
    enabled: mode === "ga" && !urlName,
  });

  const { data: gaData, isLoading: gaLoading, error: gaError } = useQuery({
    queryKey: ["player-form", urlName],
    queryFn: ({ signal }) => fetchPlayerForm(urlName, signal),
    enabled: mode === "ga" && !!urlName,
    staleTime: 2 * 60 * 1000,
  });

  const gaHasResults = !!gaData?.targetPlayer && !gaData?.error;
  const targetMinutes = gaData?.targetPlayer?.minutes;

  const filteredUnderperformers = useMemo(() => {
    if (!gaData?.underperformers) return [];
    let list = gaData.underperformers;
    if (targetMinutes !== undefined) list = list.filter((p) => p.minutes === undefined || p.minutes >= targetMinutes);
    if (benchTop5Only) list = list.filter((p) => TOP_5_LEAGUES.includes(p.league));
    return list;
  }, [gaData?.underperformers, targetMinutes, benchTop5Only]);

  const filteredOutperformers = useMemo(() => {
    if (!gaData?.outperformers) return [];
    let list = gaData.outperformers;
    if (targetMinutes !== undefined) list = list.filter((p) => p.minutes === undefined || p.minutes <= targetMinutes);
    if (benchTop5Only) list = list.filter((p) => TOP_5_LEAGUES.includes(p.league));
    return list;
  }, [gaData?.outperformers, targetMinutes, benchTop5Only]);

  // ── Minutes player selection ──
  const minsSelected = useMemo(() => {
    if (!urlName) return null;
    return initialData.find((p) => p.name === urlName) ?? null;
  }, [urlName, initialData]);

  const playingLess = useMemo(() => {
    if (!minsSelected) return [];
    return initialData.filter((p) => p.playerId !== minsSelected.playerId && p.marketValue >= minsSelected.marketValue && p.minutes <= minsSelected.minutes);
  }, [minsSelected, initialData]);

  const playingMore = useMemo(() => {
    if (!minsSelected) return [];
    return initialData.filter((p) => p.playerId !== minsSelected.playerId && p.marketValue >= minsSelected.marketValue && p.minutes > minsSelected.minutes);
  }, [minsSelected, initialData]);

  // ── Minutes discovery list ──
  const minsLeagueOptions = useMemo(
    () => Array.from(new Set(initialData.map((p) => p.league).filter(Boolean))).sort(),
    [initialData]
  );

  const minsDiscoveryList = useMemo(() => {
    let list = filterPlayersByLeagueAndClub(initialData, minsLeagueFilter, minsClubFilter);
    if (minsHideInjured && injuryMap) list = list.filter((p) => !injuryMap[p.playerId]);
    return [...list].sort((a, b) => a.minutes - b.minutes);
  }, [initialData, minsLeagueFilter, minsClubFilter, minsHideInjured, injuryMap]);

  const handleMvSelect = useCallback((p: MinutesValuePlayer) => {
    setQuery(p.name);
    handleSelect(p.name);
  }, [handleSelect]);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            <span style={{ color: "#ff6b7a" }}>Under</span>performers
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {mode === "ga"
              ? "Are expensive players producing enough goals and assists?"
              : "Which expensive players are getting the fewest minutes?"}
          </p>
        </div>

        {/* Mode toggle */}
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => {
            if (!v) return;
            push({ mode: v === "ga" ? null : v, name: null, tab: null, bTop5: null });
          }}
          className="mb-4"
        >
          <ToggleGroupItem value="ga" className="px-4">G+A</ToggleGroupItem>
          <ToggleGroupItem value="mins" className="px-4">Minutes</ToggleGroupItem>
        </ToggleGroup>

        {/* Search */}
        <div className="mb-6 sm:mb-8">
          {mode === "ga" ? (
            <PlayerAutocomplete<PlayerStats>
              players={initialAllPlayers}
              value={query}
              onChange={(val) => {
                setQuery(val);
                if (!val.trim()) handleClear();
              }}
              onSelect={(player) => {
                setQuery(player.name);
                handleSelect(player.name);
              }}
              placeholder="Search player (e.g. Kenan Yildiz)"
              renderTrailing={(player) => (
                <div className="text-xs tabular-nums shrink-0" style={{ color: "#00ff87" }}>{player.points} pts</div>
              )}
            />
          ) : (
            <PlayerAutocomplete<MinutesValuePlayer>
              players={minsSelected ? EMPTY_MV : initialData}
              value={query}
              onChange={(val) => {
                setQuery(val);
                if (!val.trim() || val !== minsSelected?.name) handleClear();
              }}
              onSelect={(player) => {
                setQuery(player.name);
                handleSelect(player.name);
              }}
              placeholder="Search player (e.g. Kenan Yildiz)"
              renderTrailing={(player) => (
                <div className="text-xs tabular-nums shrink-0" style={{ color: "var(--accent-blue)" }}>{player.minutes.toLocaleString()}&apos;</div>
              )}
            />
          )}
        </div>

        {/* ══════════════════ G+A MODE ══════════════════ */}
        {mode === "ga" && (
          <>
            {/* Loading */}
            {gaLoading && <SearchSkeleton />}

            {/* Error */}
            {gaError && (
              <div className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}>
                <p className="font-medium" style={{ color: "#ff6b7a" }}>Error fetching data. Please try again.</p>
              </div>
            )}
            {gaData?.error && (
              <div className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}>
                <p className="font-medium" style={{ color: "#ff6b7a" }}>{gaData.error}</p>
                {gaData.searchedName && (
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Searched for &ldquo;{gaData.searchedName}&rdquo; across {gaData.totalPlayers} players
                  </p>
                )}
              </div>
            )}

            {/* Benchmark */}
            {gaHasResults && (
              <div className="space-y-6">
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full" style={{ background: "#ffd700" }} />
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ffd700" }}>Benchmark Player</h2>
                  </div>
                  <TargetPlayerCard player={gaData!.targetPlayer} minutes={targetMinutes} />
                </section>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => update({ bTop5: benchTop5Only ? null : "1" })}
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

                <Tabs value={gaTab} onValueChange={(v) => push({ tab: v === "underdelivering" ? null : v })}>
                  <TabsList className="w-full">
                    <TabsTrigger value="underdelivering" className="flex-1 gap-2">
                      Underdelivering
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}>{filteredUnderperformers.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="better-value" className="flex-1 gap-2">
                      Better Value
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "rgba(0, 255, 135, 0.15)", color: "#00ff87" }}>{filteredOutperformers.length}</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="underdelivering">
                    {filteredUnderperformers.length === 0 ? (
                      <div className="rounded-xl p-6 sm:p-8 animate-fade-in" style={{ background: "rgba(255, 71, 87, 0.06)", border: "1px solid rgba(255, 71, 87, 0.2)" }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255, 71, 87, 0.15)" }}>
                            <svg className="w-5 h-5" style={{ color: "#ff6b7a" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-base" style={{ color: "#ff6b7a" }}>Nobody more expensive is doing worse</p>
                            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                              Every player worth {gaData!.targetPlayer.marketValueDisplay} or more has produced more G+A.
                              At {gaData!.targetPlayer.points} points for {gaData!.targetPlayer.marketValueDisplay}, {gaData!.targetPlayer.name} has the lowest output at this price range.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gaData!.underperformers.length !== filteredUnderperformers.length && (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{gaData!.underperformers.length - filteredUnderperformers.length} players filtered (fewer minutes than benchmark)</p>
                        )}
                        {filteredUnderperformers.map((player, index) => (
                          <UnderperformerCard key={player.playerId} player={player} targetPlayer={gaData!.targetPlayer} minutes={player.minutes} index={index} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="better-value">
                    {filteredOutperformers.length === 0 ? (
                      <div className="rounded-xl p-6 sm:p-8 animate-fade-in" style={{ background: "rgba(0, 255, 135, 0.06)", border: "1px solid rgba(0, 255, 135, 0.2)" }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0, 255, 135, 0.15)" }}>
                            <svg className="w-5 h-5" style={{ color: "#00ff87" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-base" style={{ color: "#00ff87" }}>{gaData!.targetPlayer.name} is a top performer for their price</p>
                            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                              No player at the same or lower market value
                              {targetMinutes !== undefined ? " with the same or fewer minutes" : ""}
                              {" "}has produced more goal contributions.
                              At {gaData!.targetPlayer.points} points for {gaData!.targetPlayer.marketValueDisplay}, {gaData!.targetPlayer.name} offers excellent value.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gaData!.outperformers.length !== filteredOutperformers.length && (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{gaData!.outperformers.length - filteredOutperformers.length} players filtered (more minutes than benchmark)</p>
                        )}
                        {filteredOutperformers.map((player, index) => (
                          <OutperformerCard key={player.playerId} player={player} targetPlayer={gaData!.targetPlayer} index={index} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="text-center py-6 text-xs animate-fade-in" style={{ color: "var(--text-muted)", animationDelay: "0.3s" }}>
                  Analyzed {gaData!.totalPlayers.toLocaleString()} players across top European leagues
                </div>
              </div>
            )}

            {/* Discovery */}
            {!gaLoading && !gaData && (
              <UnderperformersSection
                candidates={discoveryQuery.data?.underperformers || []}
                allPlayers={initialAllPlayers}
                isLoading={discoveryQuery.isLoading}
                error={(discoveryQuery.error as Error | null) ?? null}
                sortBy={underSortBy}
                onSortChange={(value) => update({ uSort: value === "value" ? null : value })}
                leagueFilter={underLeagueFilter}
                clubFilter={underClubFilter}
                onLeagueFilterChange={(value) => update({ uLeague: value === "all" ? null : value })}
                onClubFilterChange={(value) => update({ uClub: value || null })}
                top5Only={underTop5Only}
                onTop5Change={(on) => update({ uTop5: on ? "1" : null })}
              />
            )}
          </>
        )}

        {/* ══════════════════ MINUTES MODE ══════════════════ */}
        {mode === "mins" && (
          <>
            {/* Benchmark */}
            {minsSelected && (
              <div className="space-y-8">
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 rounded-full" style={{ background: "#ffd700" }} />
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ffd700" }}>Benchmark Player</h2>
                  </div>
                  <MvBenchmarkCard player={minsSelected} />
                </section>

                <section>
                  <Tabs value={minsTab} onValueChange={(v) => push({ tab: v === "less" ? null : v })}>
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="less" className="flex-1 gap-2">
                        Playing Less
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}>{playingLess.length}</span>
                      </TabsTrigger>
                      <TabsTrigger value="more" className="flex-1 gap-2">
                        Playing More
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>{playingMore.length}</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="less">
                      {playingLess.length === 0 ? (
                        <div className="rounded-xl p-10 text-center animate-fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                          <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>No results</p>
                          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>No higher-valued players have fewer minutes than {minsSelected.name}</p>
                        </div>
                      ) : (
                        <MvVirtualPlayerList items={playingLess} target={minsSelected} variant="less" onSelect={handleMvSelect} injuryMap={injuryMap} />
                      )}
                    </TabsContent>
                    <TabsContent value="more">
                      {playingMore.length === 0 ? (
                        <div className="rounded-xl p-10 text-center animate-fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                          <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>No results</p>
                          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>No higher-valued players have more minutes than {minsSelected.name}</p>
                        </div>
                      ) : (
                        <MvVirtualPlayerList items={playingMore} target={minsSelected} variant="more" onSelect={handleMvSelect} />
                      )}
                    </TabsContent>
                  </Tabs>
                </section>

                <div className="text-center py-6 text-xs animate-fade-in" style={{ color: "var(--text-muted)", animationDelay: "0.3s" }}>
                  Analyzed {initialData.length.toLocaleString()} players by market value
                </div>
              </div>
            )}

            {/* Discovery */}
            {!minsSelected && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full" style={{ background: "#ff4757" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#ff6b7a" }}>Fewest Minutes</h2>
                  </div>
                  {minsDiscoveryList.length > 0 && (
                    <span className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums" style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}>{minsDiscoveryList.length}</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <SelectNative value={minsLeagueFilter} onChange={(e) => update({ mLeague: e.target.value === "all" ? null : e.target.value })} className="h-10">
                      <option value="all">All leagues</option>
                      {minsLeagueOptions.map((league) => (<option key={league} value={league}>{league}</option>))}
                    </SelectNative>
                    <DebouncedInput value={minsClubFilter} onChange={(value) => update({ mClub: value || null })} placeholder="Filter by club" className="h-10" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => update({ noInj: minsHideInjured ? null : "1" })}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      style={{
                        background: minsHideInjured ? "rgba(255, 71, 87, 0.15)" : "var(--bg-elevated)",
                        color: minsHideInjured ? "#ff6b7a" : "var(--text-muted)",
                        border: minsHideInjured ? "1px solid rgba(255, 71, 87, 0.3)" : "1px solid var(--border-subtle)",
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Exclude injured
                    </button>
                  </div>
                </div>

                <MvVirtualPlayerList items={minsDiscoveryList} variant="less" onSelect={handleMvSelect} injuryMap={injuryMap} />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
