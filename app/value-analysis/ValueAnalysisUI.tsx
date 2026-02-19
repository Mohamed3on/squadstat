"use client";

import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { Combobox } from "@/components/Combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ExternalLink } from "lucide-react";
import { getLeagueLogoUrl } from "@/lib/leagues";
import { FilterButton } from "@/components/FilterButton";
import { filterPlayersByLeagueAndClub, TOP_5_LEAGUES } from "@/lib/filter-players";
import { canBeOutperformerAgainst, canBeUnderperformerAgainst, strictlyOutperforms } from "@/lib/positions";
import { formatReturnInfo, formatInjuryDuration, PROFIL_RE } from "@/lib/format";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { BenchmarkCard, BigNumber } from "./BenchmarkCard";
import type { PlayerStats, MinutesValuePlayer, InjuryMap } from "@/app/types";

type Mode = "ga" | "mins";
type CompareTab = "less" | "more";
type DiscoverySortKey = "count" | "value-asc" | "value-desc" | "ga-desc" | "ga-asc";
const DISCOVERY_SORT_KEYS = new Set<string>(["count", "value-asc", "value-desc", "ga-desc", "ga-asc"]);
function parseDiscoverySort(value: string | null): DiscoverySortKey {
  return value && DISCOVERY_SORT_KEYS.has(value) ? (value as DiscoverySortKey) : "count";
}
type DiscoveryTab = "overpriced" | "bargains";
type DiscoveryCandidate = PlayerStats & { comparisonCount: number };

interface PlayerFormResult {
  targetPlayer: PlayerStats;
  underperformers: PlayerStats[];
  outperformers: PlayerStats[];
  totalPlayers: number;
  error?: string;
  searchedName?: string;
}

const EMPTY_MV: MinutesValuePlayer[] = [];

function formatValue(v: number): string {
  if (v >= 1_000_000) return `\u20AC${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `\u20AC${(v / 1_000).toFixed(0)}k`;
  return `\u20AC${v}`;
}

function getPlayerBenchmarkHref(id: string, name: string, top5?: boolean): string {
  const p = new URLSearchParams({ id, name });
  if (top5) p.set("bTop5", "1");
  return `/value-analysis?${p.toString()}`;
}

function getLeistungsdatenUrl(profileUrl: string): string {
  const now = new Date();
  const season = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `https://www.transfermarkt.com${profileUrl.replace(PROFIL_RE, "/leistungsdaten/")}/saison/${season}/plus/1`;
}

async function fetchPlayerForm(id: string, name: string, opts?: { pen?: boolean; intl?: boolean }, signal?: AbortSignal): Promise<PlayerFormResult> {
  const params = new URLSearchParams();
  if (id) params.set("id", id);
  if (name) params.set("name", name);
  if (opts?.pen) params.set("pen", "1");
  if (opts?.intl) params.set("intl", "1");
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
      href={getLeistungsdatenUrl(player.profileUrl)}
      subtitle={<><span className="font-medium">{player.position}</span><span className="opacity-40">•</span><span className="truncate opacity-80 inline-flex items-center gap-1">{player.clubLogoUrl && <img src={player.clubLogoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />}{player.club}</span></>}
      desktopStats={<><span className="tabular-nums">{player.goals}G</span><span className="tabular-nums">{player.assists}A</span><span className="tabular-nums">{player.matches} apps</span><span className="opacity-60">Age {player.age}</span></>}
      mobileStats={<><span className="tabular-nums">{player.goals}G</span><span className="tabular-nums">{player.assists}A</span><span className="tabular-nums">{player.matches} apps</span><span className="opacity-60">Age {player.age}</span></>}
      desktopBigNumbers={<><BigNumber value={player.marketValueDisplay} label="Value" color="var(--accent-gold)" /><BigNumber value={String(player.points)} label="Points" color="var(--accent-hot)" /></>}
      mobileBigNumbers={<><div className="text-lg font-black tabular-nums" style={{ color: "var(--accent-gold)" }}>{player.marketValueDisplay}</div><div className="text-lg font-black tabular-nums" style={{ color: "var(--accent-hot)" }}>{player.points}</div></>}
      footer={<><span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Minutes Played</span><span className="text-base sm:text-lg font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{minutes?.toLocaleString() || "—"}&apos;</span></>}
    />
  );
}

interface CardTheme {
  gradientStart: string; border: string;
  rankBg: string; rankColor: string; imageBorder: string;
}

const CARD_THEMES = {
  cold: { gradientStart: "var(--accent-cold-faint)", border: "var(--accent-cold-glow)", rankBg: "var(--accent-cold-glow)", rankColor: "var(--accent-cold-soft)", imageBorder: "var(--accent-cold-border)" },
  hot: { gradientStart: "var(--accent-hot-faint)", border: "var(--accent-hot-glow)", rankBg: "var(--accent-hot-glow)", rankColor: "var(--accent-hot)", imageBorder: "var(--accent-hot-border)" },
  green: { gradientStart: "var(--accent-green-faint)", border: "var(--accent-green-glow)", rankBg: "var(--accent-green-glow)", rankColor: "var(--accent-green)", imageBorder: "var(--accent-green-border)" },
} as const satisfies Record<string, CardTheme>;

type ComparisonCardVariant = "underperformer" | "outperformer";

function PlayerCard({ index = 0, theme, name, imageUrl, profileUrl, nameElement, subtitle, desktopStats, mobileStats, footer }: {
  index?: number; theme: CardTheme; name: string; imageUrl: string; profileUrl: string;
  nameElement: ReactNode; subtitle: ReactNode;
  desktopStats: ReactNode; mobileStats: ReactNode; footer?: ReactNode;
}) {
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
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0" style={{ background: theme.rankBg, color: theme.rankColor }}>
          {index + 1}
        </div>
        <div className="relative shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover" style={{ background: "var(--bg-elevated)", border: `1px solid ${theme.imageBorder}` }} />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {nameElement}
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-40 hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs mt-0.5 flex-wrap" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {desktopStats}
        </div>
        <div className="sm:hidden text-right shrink-0">
          {mobileStats}
        </div>
      </div>
      {footer && (
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 text-xs" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}

function ComparisonCard({ player, targetPlayer, index = 0, variant, top5 }: {
  player: PlayerStats; targetPlayer: PlayerStats; index?: number; variant: ComparisonCardVariant; top5?: boolean;
}) {
  const theme = CARD_THEMES[variant === "underperformer" ? "cold" : "hot"];
  const mutedColor = variant === "underperformer" ? "var(--accent-cold-muted)" : "var(--accent-hot-muted)";
  const leistungsdatenUrl = getLeistungsdatenUrl(player.profileUrl);
  const minutes = player.minutes;

  let valueDeltaLabel: string;
  let pointsDeltaLabel: string;
  if (variant === "underperformer") {
    const valueDiff = player.marketValue - targetPlayer.marketValue;
    valueDeltaLabel = valueDiff >= 1_000_000 ? `+€${(valueDiff / 1_000_000).toFixed(1)}m` : `+€${(valueDiff / 1_000).toFixed(0)}k`;
    pointsDeltaLabel = `−${targetPlayer.points - player.points}`;
  } else {
    const valueSaved = targetPlayer.marketValue - player.marketValue;
    valueDeltaLabel = valueSaved >= 1_000_000 ? `€${(valueSaved / 1_000_000).toFixed(1)}m less` : valueSaved > 0 ? `€${(valueSaved / 1_000).toFixed(0)}k less` : "Same value";
    pointsDeltaLabel = `+${player.points - targetPlayer.points}`;
  }

  return (
    <PlayerCard
      index={index}
      theme={theme}
      name={player.name}
      imageUrl={player.imageUrl}
      profileUrl={leistungsdatenUrl}
      nameElement={
        <Link href={getPlayerBenchmarkHref(player.playerId, player.name, top5)} className="font-semibold text-sm sm:text-base hover:underline truncate transition-colors" style={{ color: "var(--text-primary)" }}>
          {player.name}
        </Link>
      }
      subtitle={<PlayerSubtitle position={player.position} club={player.club} clubLogoUrl={player.clubLogoUrl} age={player.age} />}
      desktopStats={<>
        <div className="text-right">
          <div className="text-sm font-bold tabular-nums" style={{ color: theme.rankColor }}>{player.marketValueDisplay}</div>
          <div className="text-xs font-medium tabular-nums" style={{ color: mutedColor }}>{valueDeltaLabel}</div>
        </div>
        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
        <div className="text-right min-w-[3rem]">
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
          <div className="text-xs font-medium tabular-nums" style={{ color: theme.rankColor }}>{pointsDeltaLabel}</div>
        </div>
        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
        <div className="min-w-[4.5rem]"><MinutesDisplay minutes={minutes} /></div>
      </>}
      mobileStats={<>
        <div className="text-xs font-bold tabular-nums" style={{ color: theme.rankColor }}>{player.marketValueDisplay}</div>
        <div className="text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
      </>}
      footer={<>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.matches} apps</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.age}y</span>
        <div className="sm:hidden ml-auto"><MinutesDisplay minutes={minutes} /></div>
        <LeagueLabel league={player.league} />
      </>}
    />
  );
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

function PlayerSubtitle({ position, club, clubLogoUrl, age }: { position: string; club: string; clubLogoUrl?: string; age: number }) {
  return (
    <>
      <span>{position}</span>
      <span className="opacity-40">•</span>
      <span className="truncate max-w-[100px] sm:max-w-none inline-flex items-center gap-1">
        {clubLogoUrl && <img src={clubLogoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />}
        {club}
      </span>
      <span className="hidden sm:inline opacity-40">•</span>
      <span className="hidden sm:inline">{age}y</span>
    </>
  );
}

function LeagueLabel({ league }: { league: string }) {
  return (
    <span className="hidden sm:flex items-center gap-1 ml-auto text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
      {getLeagueLogoUrl(league) && <img src={getLeagueLogoUrl(league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
      {league}
    </span>
  );
}

function DiscoveryListCard({ player, index = 0, top5, variant, pointsLabel = "G+A" }: {
  player: DiscoveryCandidate; index?: number; top5?: boolean; variant: DiscoveryTab; pointsLabel?: string;
}) {
  const isOverpriced = variant === "overpriced";
  const theme = isOverpriced ? CARD_THEMES.cold : CARD_THEMES.green;
  const countColor = isOverpriced ? "var(--accent-hot)" : "var(--accent-green)";
  const countLabel = isOverpriced ? "doing better" : "outperforms";
  const valueColor = isOverpriced ? "var(--accent-cold-soft)" : "var(--accent-green)";

  return (
    <PlayerCard
      index={index}
      theme={theme}
      name={player.name}
      imageUrl={player.imageUrl}
      profileUrl={getLeistungsdatenUrl(player.profileUrl)}
      nameElement={
        <Link href={getPlayerBenchmarkHref(player.playerId, player.name, top5)} className="font-semibold text-sm sm:text-base hover:underline truncate transition-colors" style={{ color: "var(--text-primary)" }}>
          {player.name}
        </Link>
      }
      subtitle={<PlayerSubtitle position={player.position} club={player.club} clubLogoUrl={player.clubLogoUrl} age={player.age} />}
      desktopStats={<>
        {player.comparisonCount > 0 && (
          <>
            <div className="text-right min-w-[4rem]">
              <div className="text-sm font-bold tabular-nums" style={{ color: countColor }}>{player.comparisonCount}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{countLabel}</div>
            </div>
            <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          </>
        )}
        <div className="text-right">
          <div className="text-sm font-bold tabular-nums" style={{ color: valueColor }}>{player.marketValueDisplay}</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>value</div>
        </div>
        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
        <div className="text-right min-w-[3rem]">
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{pointsLabel}</div>
        </div>
        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
        <div className="text-right min-w-[4rem]">
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes?.toLocaleString() || "—"}&apos;</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>mins</div>
        </div>
      </>}
      mobileStats={<>
        {player.comparisonCount > 0 && (
          <div className="text-xs font-bold tabular-nums mb-0.5" style={{ color: countColor }}>{player.comparisonCount} {countLabel}</div>
        )}
        <div className="text-xs font-bold tabular-nums" style={{ color: valueColor }}>{player.marketValueDisplay}</div>
        <div className="text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>{player.points} pts</div>
      </>}
      footer={<>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.matches} apps</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.age}y</span>
        <span className="sm:hidden ml-auto tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes?.toLocaleString() || "—"}&apos;</span>
        <LeagueLabel league={player.league} />
      </>}
    />
  );
}

function DiscoverySection({ variant, candidates, allPlayers, sortBy, onSortChange, leagueFilter, clubFilter, onLeagueFilterChange, onClubFilterChange, top5Only, onTop5Change, pointsLabel = "G+A" }: {
  variant: DiscoveryTab;
  candidates: DiscoveryCandidate[]; allPlayers: PlayerStats[];
  sortBy: DiscoverySortKey; onSortChange: (value: DiscoverySortKey) => void;
  leagueFilter: string; clubFilter: string; onLeagueFilterChange: (value: string) => void; onClubFilterChange: (value: string) => void;
  top5Only: boolean; onTop5Change: (value: boolean) => void;
  pointsLabel?: string;
}) {
  const isOverpriced = variant === "overpriced";
  const accentColor = isOverpriced ? "var(--accent-cold-soft)" : "var(--accent-green)";

  const leagueOptions = useMemo(() =>
    [{ value: "all", label: "All leagues" }, ...Array.from(new Set(candidates.map((p) => p.league).filter(Boolean))).sort().map((l) => ({ value: l, label: l }))],
    [candidates]
  );

  const clubOptions = useMemo(() =>
    [{ value: "all", label: "All clubs" }, ...Array.from(new Set(candidates.map((p) => p.club).filter(Boolean))).sort().map((c) => ({ value: c, label: c }))],
    [candidates]
  );

  const top5Players = useMemo(
    () => top5Only ? allPlayers.filter((p) => TOP_5_LEAGUES.includes(p.league)) : [],
    [allPlayers, top5Only]
  );

  const filteredCandidates = useMemo(() => {
    let filtered = filterPlayersByLeagueAndClub(candidates, leagueFilter, clubFilter);
    if (top5Only) {
      filtered = filtered.filter((p) => TOP_5_LEAGUES.includes(p.league));
      filtered = filtered.map((player) => {
        const count = isOverpriced
          ? top5Players.filter((p) => p.playerId !== player.playerId && p.marketValue <= player.marketValue && strictlyOutperforms(p, player) && canBeOutperformerAgainst(p.position, player.position)).length
          : top5Players.filter((p) => p.playerId !== player.playerId && p.marketValue >= player.marketValue && strictlyOutperforms(player, p) && canBeUnderperformerAgainst(p.position, player.position)).length;
        return { ...player, comparisonCount: count };
      });
    }
    const sorted = [...filtered];
    if (sortBy === "value-asc") return sorted.sort((a, b) => a.marketValue - b.marketValue);
    if (sortBy === "value-desc") return sorted.sort((a, b) => b.marketValue - a.marketValue);
    if (sortBy === "ga-desc") return sorted.sort((a, b) => b.points - a.points);
    if (sortBy === "ga-asc") return sorted.sort((a, b) => a.points - b.points);
    return sorted.sort((a, b) => b.comparisonCount - a.comparisonCount);
  }, [candidates, top5Players, leagueFilter, clubFilter, sortBy, top5Only, isOverpriced]);

  const isValueActive = sortBy === "value-asc" || sortBy === "value-desc";
  const isGaActive = sortBy === "ga-asc" || sortBy === "ga-desc";
  const sortGroup = sortBy === "count" ? "count" : isValueActive ? "value" : "ga";

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            {isOverpriced ? "Overpriced" : "Bargains"}
          </h2>
        </div>
        {filteredCandidates.length > 0 && (
          <span className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums" style={{ background: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}>{filteredCandidates.length}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={sortGroup}
          onValueChange={(v) => {
            if (v === "count") onSortChange("count");
            else if (v === "value") onSortChange(isOverpriced ? "value-desc" : "value-asc");
            else if (v === "ga") onSortChange("ga-desc");
            else if (isValueActive) onSortChange(sortBy === "value-asc" ? "value-desc" : "value-asc");
            else if (isGaActive) onSortChange(sortBy === "ga-desc" ? "ga-asc" : "ga-desc");
          }}
        >
          <ToggleGroupItem value="count" className="rounded-lg">
            {isOverpriced ? "Most underperforming" : "Most outperforming"}
          </ToggleGroupItem>
          <ToggleGroupItem value="value" className="rounded-lg">
            Value {isValueActive && (sortBy === "value-asc" ? "\u2191" : "\u2193")}
          </ToggleGroupItem>
          <ToggleGroupItem value="ga" className="rounded-lg">
            {pointsLabel} {isGaActive && (sortBy === "ga-desc" ? "\u2193" : "\u2191")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Combobox value={leagueFilter} onChange={(v) => onLeagueFilterChange(v || "all")} options={leagueOptions} placeholder="All leagues" searchPlaceholder="Search leagues..." />
        <Combobox value={clubFilter || "all"} onChange={(v) => onClubFilterChange(v === "all" ? "" : v)} options={clubOptions} placeholder="All clubs" searchPlaceholder="Search clubs..." />
        <FilterButton active={top5Only} onClick={() => onTop5Change(!top5Only)}>
          Top 5 only
        </FilterButton>
      </div>
      {filteredCandidates.length === 0 && (
        <div className="rounded-xl p-8 text-center animate-fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{isOverpriced ? "No overpriced players found" : "No bargain players found"}</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{isOverpriced ? "Everyone is producing as expected for their price tag" : "No cheap players are outperforming their price tag right now"}</p>
        </div>
      )}
      {filteredCandidates.length > 0 && (
        <div className="space-y-3">
          {filteredCandidates.map((player, index) => (
            <DiscoveryListCard key={player.playerId} player={player} index={index} top5={top5Only} variant={variant} pointsLabel={pointsLabel} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Minutes Components ── */

function MvBenchmarkCard({ player }: { player: MinutesValuePlayer }) {
  return (
    <BenchmarkCard
      name={player.name}
      imageUrl={player.imageUrl}
      href={getLeistungsdatenUrl(player.profileUrl)}
      subtitle={<><span className="font-medium">{player.position}</span>{player.nationality && <><span className="opacity-40">·</span><span>{player.nationality}</span></>}</>}
      desktopStats={<><span className="tabular-nums">{player.totalMatches} games</span><span className="tabular-nums">{player.goals} goals</span><span className="tabular-nums">{player.assists} assists</span><span className="opacity-60">Age {player.age}</span></>}
      mobileStats={<><span className="tabular-nums">{player.totalMatches} games</span><span className="tabular-nums">{player.goals}G {player.assists}A</span><span className="opacity-60">Age {player.age}</span></>}
      desktopBigNumbers={<><BigNumber value={player.marketValueDisplay} label="Value" color="var(--accent-gold)" /><BigNumber value={`${player.minutes.toLocaleString()}'`} label="Minutes" color="var(--accent-blue)" /></>}
      mobileBigNumbers={<div className="text-lg font-black tabular-nums" style={{ color: "var(--accent-gold)" }}>{player.marketValueDisplay}</div>}
    />
  );
}

function MvPlayerCard({ player, target, index, variant = "less", onSelect, injuryMap }: {
  player: MinutesValuePlayer; target?: MinutesValuePlayer; index: number; variant?: CompareTab; onSelect?: (p: MinutesValuePlayer) => void; injuryMap?: InjuryMap;
}) {
  const theme = variant === "less" ? CARD_THEMES.cold : CARD_THEMES.green;
  const valueDiff = target ? player.marketValue - target.marketValue : 0;
  const valueDiffDisplay = valueDiff > 0 ? `+${formatValue(valueDiff)}` : formatValue(valueDiff);
  const minsDiff = target ? player.minutes - target.minutes : 0;

  return (
    <PlayerCard
      index={index}
      theme={theme}
      name={player.name}
      imageUrl={player.imageUrl}
      profileUrl={getLeistungsdatenUrl(player.profileUrl)}
      nameElement={
        <button type="button" onClick={() => onSelect?.(player)} className="font-semibold text-sm sm:text-base hover:underline truncate transition-colors text-left" style={{ color: "var(--text-primary)" }}>
          {player.name}
        </button>
      }
      subtitle={<>
        <span>{player.position}</span>
        {variant === "less" && injuryMap?.[player.playerId] && (() => {
          const info = injuryMap[player.playerId];
          const dur = formatInjuryDuration(info.injurySince);
          const ret = formatReturnInfo(info.returnDate);
          const parts = [info.injury, dur && `since ${dur}`, ret?.label].filter(Boolean);
          return (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent-cold-glow)] text-[var(--accent-cold-soft)]">
                {parts.join(" · ")}
              </span>
            </>
          );
        })()}
        <span className="hidden sm:inline opacity-40">·</span>
        <span className="hidden sm:inline">{player.age}y</span>
      </>}
      desktopStats={<>
        <div className="text-right">
          <div className="text-sm font-bold tabular-nums" style={{ color: theme.rankColor }}>{player.marketValueDisplay}</div>
          {target && <div className="text-xs font-medium tabular-nums" style={{ color: theme.rankColor, opacity: 0.7 }}>{valueDiffDisplay}</div>}
        </div>
        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
        <div className="text-right min-w-[4rem]">
          <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes.toLocaleString()}&apos;</div>
          {target && <div className="text-xs font-medium tabular-nums" style={{ color: theme.rankColor }}>{variant === "more" ? "+" : "\u2212"}{Math.abs(minsDiff).toLocaleString()}&apos;</div>}
        </div>
        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
        <div className="flex items-center gap-2.5 text-right">
          <div>
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.totalMatches}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>games</div>
          </div>
          <div>
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.goals}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>goals</div>
          </div>
          <div>
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.assists}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>assists</div>
          </div>
        </div>
      </>}
      mobileStats={<>
        <div className="text-xs font-bold tabular-nums" style={{ color: theme.rankColor }}>{player.marketValueDisplay}</div>
        <div className="text-xs tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.minutes.toLocaleString()}&apos;</div>
      </>}
      footer={<>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.goals}G</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.assists}A</span>
        <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.totalMatches} games</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.age}y</span>
        <LeagueLabel league={player.league} />
      </>}
    />
  );
}

const ROW_HEIGHT = 130;
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

interface ValueAnalysisUIProps {
  initialAllPlayers: PlayerStats[];
  initialData: MinutesValuePlayer[];
  injuryMap?: InjuryMap;
  initialUnderperformers: (PlayerStats & { outperformedByCount: number })[];
  initialOverperformers: (PlayerStats & { outperformsCount?: number })[];
  includePen: boolean;
  includeIntl: boolean;
}

export function ValueAnalysisUI({ initialAllPlayers, initialData, injuryMap, initialUnderperformers, initialOverperformers, includePen, includeIntl }: ValueAnalysisUIProps) {
  const { params, update, push } = useQueryParams("/value-analysis");

  const pointsLabel = includePen ? "G+A" : "npG+A";

  // Mode
  const mode: Mode = params.get("mode") === "mins" ? "mins" : "ga";
  const urlId = params.get("id") || "";
  const urlName = params.get("name") || "";
  const hasPlayer = !!(urlId || urlName);
  const [query, setQuery] = useState(urlName);
  useEffect(() => { setQuery(urlName); }, [urlName]);

  const handleSelect = useCallback((id: string, name: string) => { push({ id, name }); }, [push]);
  const handleClear = useCallback(() => { push({ id: null, name: null, tab: null }); }, [push]);

  // ── G+A state ──
  const underLeagueFilter = params.get("uLeague") || "all";
  const underClubFilter = params.get("uClub") || "";
  const underSortBy = parseDiscoverySort(params.get("uSort"));
  const discoveryTop5Only = params.get("dTop5") === "1";
  const benchTop5Only = params.get("bTop5") === "1";

  // ── Overperformer state ──
  const overLeagueFilter = params.get("oLeague") || "all";
  const overClubFilter = params.get("oClub") || "";
  const overSortBy = parseDiscoverySort(params.get("oSort"));

  // ── Discovery tab state ──
  const discoveryTab: DiscoveryTab = params.get("dTab") === "bargains" ? "bargains" : "overpriced";

  // ── Shared tab state (both modes use `tab` param since they're mutually exclusive) ──
  const gaTab = params.get("tab") === "better-value" ? "better-value" : "underdelivering";
  const minsTab: CompareTab = params.get("tab") === "more" ? "more" : "less";
  const minsLeagueFilter = params.get("mLeague") || "all";
  const minsClubFilter = params.get("mClub") || "";
  const minsHideInjured = params.get("noInj") === "1";

  // ── G+A queries ──
  const { data: gaData, isLoading: gaLoading, error: gaError } = useQuery({
    queryKey: ["player-form", urlId, urlName, includePen, includeIntl],
    queryFn: ({ signal }) => fetchPlayerForm(urlId, urlName, { pen: includePen, intl: includeIntl }, signal),
    enabled: mode === "ga" && hasPlayer,
    staleTime: 2 * 60 * 1000,
  });

  const gaHasResults = !!gaData?.targetPlayer && !gaData?.error;
  const targetMinutes = gaData?.targetPlayer?.minutes;

  const filteredUnderperformers = useMemo(() => {
    if (!gaData?.underperformers) return [];
    if (benchTop5Only) return gaData.underperformers.filter((p) => TOP_5_LEAGUES.includes(p.league));
    return gaData.underperformers;
  }, [gaData?.underperformers, benchTop5Only]);

  const filteredOutperformers = useMemo(() => {
    if (!gaData?.outperformers) return [];
    if (benchTop5Only) return gaData.outperformers.filter((p) => TOP_5_LEAGUES.includes(p.league));
    return gaData.outperformers;
  }, [gaData?.outperformers, benchTop5Only]);

  // ── Discovery candidates (normalized to DiscoveryCandidate) ──
  const underCandidates: DiscoveryCandidate[] = useMemo(
    () => initialUnderperformers.map((p) => ({ ...p, comparisonCount: p.outperformedByCount })),
    [initialUnderperformers]
  );
  const overCandidates: DiscoveryCandidate[] = useMemo(
    () => initialOverperformers.map((p) => ({ ...p, comparisonCount: p.outperformsCount || 0 })),
    [initialOverperformers]
  );

  // ── Discovery tab counts (adjusted for top-5 filter) ──
  const underTabCount = discoveryTop5Only ? underCandidates.filter((p) => TOP_5_LEAGUES.includes(p.league)).length : underCandidates.length;
  const overTabCount = discoveryTop5Only ? overCandidates.filter((p) => TOP_5_LEAGUES.includes(p.league)).length : overCandidates.length;

  // ── Minutes player selection ──
  const minsSelected = useMemo(() => {
    if (!hasPlayer) return null;
    if (urlId) return initialData.find((p) => p.playerId === urlId) ?? null;
    return initialData.find((p) => p.name === urlName) ?? null;
  }, [hasPlayer, urlId, urlName, initialData]);

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
    () => [{ value: "all", label: "All leagues" }, ...Array.from(new Set(initialData.map((p) => p.league).filter(Boolean))).sort().map((l) => ({ value: l, label: l }))],
    [initialData]
  );

  const minsClubOptions = useMemo(
    () => [{ value: "all", label: "All clubs" }, ...Array.from(new Set(initialData.map((p) => p.club).filter(Boolean))).sort().map((c) => ({ value: c, label: c }))],
    [initialData]
  );

  const minsDiscoveryList = useMemo(() => {
    let list = filterPlayersByLeagueAndClub(initialData, minsLeagueFilter, minsClubFilter);
    if (minsHideInjured && injuryMap) list = list.filter((p) => !injuryMap[p.playerId]);
    return [...list].sort((a, b) => a.minutes - b.minutes);
  }, [initialData, minsLeagueFilter, minsClubFilter, minsHideInjured, injuryMap]);

  const handleMvSelect = useCallback((p: MinutesValuePlayer) => {
    setQuery(p.name);
    handleSelect(p.playerId, p.name);
  }, [handleSelect]);

  return (
    <>
      {/* Title */}
      <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[var(--text-primary)]">
            Value <span className="text-[var(--accent-gold)]">Analysis</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)]">
            {mode === "ga"
              ? `Find overpriced players outperformed by cheaper peers and bargain players who punch above their price tag — based on ${pointsLabel} output.`
              : "Expensive players ranked by fewest minutes played. Search any player to compare against others at the same or higher market value."}
          </p>
        </div>

        {/* Mode toggle + stat toggles */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => {
              if (!v) return;
              push({ mode: v === "ga" ? null : v, tab: null, bTop5: null });
            }}
          >
            <ToggleGroupItem value="ga" className="px-4">G+A</ToggleGroupItem>
            <ToggleGroupItem value="mins" className="px-4">Minutes</ToggleGroupItem>
          </ToggleGroup>
          <div className="w-px h-6" style={{ background: "var(--border-subtle)" }} />
          <FilterButton active={includePen} onClick={() => push({ pen: includePen ? null : "1" })}>
            Pens in G+A
          </FilterButton>
          <FilterButton active={includeIntl} onClick={() => push({ intl: includeIntl ? null : "1" })}>
            + Intl stats
          </FilterButton>
        </div>

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
                handleSelect(player.playerId, player.name);
              }}
              placeholder="Search player (e.g. Kenan Yildiz)"
              renderTrailing={(player) => (
                <div className="text-xs tabular-nums shrink-0" style={{ color: "var(--accent-hot)" }}>{player.points} pts</div>
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
                handleSelect(player.playerId, player.name);
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
              <div className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: "var(--accent-cold-faint)", border: "1px solid var(--accent-cold-glow)" }}>
                <p className="font-medium" style={{ color: "var(--accent-cold-soft)" }}>Error fetching data. Please try again.</p>
              </div>
            )}
            {gaData?.error && (
              <div className="rounded-xl p-5 mb-6 animate-fade-in" style={{ background: "var(--accent-cold-faint)", border: "1px solid var(--accent-cold-glow)" }}>
                <p className="font-medium" style={{ color: "var(--accent-cold-soft)" }}>{gaData.error}</p>
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
                    <div className="w-1 h-5 rounded-full" style={{ background: "var(--accent-gold)" }} />
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent-gold)" }}>Benchmark Player</h2>
                  </div>
                  <TargetPlayerCard player={gaData!.targetPlayer} minutes={targetMinutes} />
                </section>

                <FilterButton active={benchTop5Only} onClick={() => update({ bTop5: benchTop5Only ? null : "1" })}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Top 5 leagues
                </FilterButton>

                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Comparing against players at similar or higher positions. &ldquo;Underdelivering&rdquo; = more expensive, same or worse G+A in same or more minutes. &ldquo;Better Value&rdquo; = cheaper, same or better G+A in same or fewer minutes.
                </p>

                <Tabs value={gaTab} onValueChange={(v) => push({ tab: v === "underdelivering" ? null : v })}>
                  <TabsList className="w-full">
                    <TabsTrigger value="underdelivering" className="flex-1 gap-2">
                      Underdelivering
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "var(--accent-cold-glow)", color: "var(--accent-cold-soft)" }}>{filteredUnderperformers.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="better-value" className="flex-1 gap-2">
                      Better Value
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "var(--accent-hot-glow)", color: "var(--accent-hot)" }}>{filteredOutperformers.length}</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="underdelivering">
                    {filteredUnderperformers.length === 0 ? (
                      <div className="rounded-xl p-6 sm:p-8 animate-fade-in" style={{ background: "var(--accent-cold-faint)", border: "1px solid var(--accent-cold-border)" }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-cold-glow)" }}>
                            <svg className="w-5 h-5" style={{ color: "var(--accent-cold-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-base" style={{ color: "var(--accent-cold-soft)" }}>Nobody more expensive is doing worse</p>
                            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                              Every player worth {gaData!.targetPlayer.marketValueDisplay} or more has produced more G+A.
                              At {gaData!.targetPlayer.points} points for {gaData!.targetPlayer.marketValueDisplay}, {gaData!.targetPlayer.name} has the lowest output at this price range.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUnderperformers.map((player, index) => (
                          <ComparisonCard key={player.playerId} player={player} targetPlayer={gaData!.targetPlayer} variant="underperformer" index={index} top5={benchTop5Only} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="better-value">
                    {filteredOutperformers.length === 0 ? (
                      <div className="rounded-xl p-6 sm:p-8 animate-fade-in" style={{ background: "var(--accent-hot-faint)", border: "1px solid var(--accent-hot-border)" }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-hot-glow)" }}>
                            <svg className="w-5 h-5" style={{ color: "var(--accent-hot)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-base" style={{ color: "var(--accent-hot)" }}>{gaData!.targetPlayer.name} is a top performer for their price</p>
                            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                              No cheaper player has produced more goal contributions in the same or fewer minutes.
                              At {gaData!.targetPlayer.points} points for {gaData!.targetPlayer.marketValueDisplay}, {gaData!.targetPlayer.name} offers excellent value.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredOutperformers.map((player, index) => (
                          <ComparisonCard key={player.playerId} player={player} targetPlayer={gaData!.targetPlayer} variant="outperformer" index={index} top5={benchTop5Only} />
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
              <Tabs value={discoveryTab} onValueChange={(v) => update({ dTab: v === "overpriced" ? null : v })}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="overpriced" className="flex-1 gap-2">
                    Overpriced
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "var(--accent-cold-glow)", color: "var(--accent-cold-soft)" }}>
                      {underTabCount ?? "—"}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="bargains" className="flex-1 gap-2">
                    Bargains
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "var(--accent-green-glow)", color: "var(--accent-green)" }}>
                      {overTabCount ?? "—"}
                    </span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overpriced">
                  <DiscoverySection
                    variant="overpriced"
                    candidates={underCandidates}
                    allPlayers={initialAllPlayers}
                    sortBy={underSortBy}
                    onSortChange={(value) => update({ uSort: value === "count" ? null : value })}
                    leagueFilter={underLeagueFilter}
                    clubFilter={underClubFilter}
                    onLeagueFilterChange={(value) => update({ uLeague: value === "all" ? null : value })}
                    onClubFilterChange={(value) => update({ uClub: value || null })}
                    top5Only={discoveryTop5Only}
                    onTop5Change={(on) => update({ dTop5: on ? "1" : null })}
                    pointsLabel={pointsLabel}
                  />
                </TabsContent>
                <TabsContent value="bargains">
                  <DiscoverySection
                    variant="bargains"
                    candidates={overCandidates}
                    allPlayers={initialAllPlayers}
                    sortBy={overSortBy}
                    onSortChange={(value) => update({ oSort: value === "count" ? null : value })}
                    leagueFilter={overLeagueFilter}
                    clubFilter={overClubFilter}
                    onLeagueFilterChange={(value) => update({ oLeague: value === "all" ? null : value })}
                    onClubFilterChange={(value) => update({ oClub: value || null })}
                    top5Only={discoveryTop5Only}
                    onTop5Change={(on) => update({ dTop5: on ? "1" : null })}
                    pointsLabel={pointsLabel}
                  />
                </TabsContent>
              </Tabs>
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
                    <div className="w-1 h-5 rounded-full" style={{ background: "var(--accent-gold)" }} />
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent-gold)" }}>Benchmark Player</h2>
                  </div>
                  <MvBenchmarkCard player={minsSelected} />
                </section>

                <section>
                  <Tabs value={minsTab} onValueChange={(v) => push({ tab: v === "less" ? null : v })}>
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="less" className="flex-1 gap-2">
                        Playing Less
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "var(--accent-cold-glow)", color: "var(--accent-cold-soft)" }}>{playingLess.length}</span>
                      </TabsTrigger>
                      <TabsTrigger value="more" className="flex-1 gap-2">
                        Playing More
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums" style={{ background: "var(--accent-green-glow)", color: "var(--accent-green)" }}>{playingMore.length}</span>
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
                    <div className="w-1 h-5 rounded-full" style={{ background: "var(--accent-cold)" }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--accent-cold-soft)" }}>Fewest Minutes</h2>
                  </div>
                  {minsDiscoveryList.length > 0 && (
                    <span className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums" style={{ background: "var(--accent-cold-glow)", color: "var(--accent-cold-soft)" }}>{minsDiscoveryList.length}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Combobox value={minsLeagueFilter} onChange={(v) => update({ mLeague: v === "all" ? null : v || null })} options={minsLeagueOptions} placeholder="All leagues" searchPlaceholder="Search leagues..." />
                  <Combobox value={minsClubFilter || "all"} onChange={(v) => update({ mClub: v === "all" ? null : v || null })} options={minsClubOptions} placeholder="All clubs" searchPlaceholder="Search clubs..." />
                  <FilterButton active={minsHideInjured} onClick={() => update({ noInj: minsHideInjured ? null : "1" })}>
                    Exclude injured
                  </FilterButton>
                </div>

                <MvVirtualPlayerList items={minsDiscoveryList} variant="less" onSelect={handleMvSelect} injuryMap={injuryMap} />
              </section>
            )}
          </>
        )}
    </>
  );
}
