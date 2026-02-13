"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { DebouncedInput } from "@/components/DebouncedInput";
import { Card } from "@/components/ui/card";
import { SelectNative } from "@/components/ui/select-native";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { filterPlayersByLeagueAndClub, filterTop5 } from "@/lib/filter-players";
import type { MinutesValuePlayer } from "@/app/types";

const PROFIL_RE = /\/profil\//;
const EMPTY_PLAYERS: MinutesValuePlayer[] = [];
type CompareTab = "less" | "more";
type SortKey = "value" | "mins" | "games" | "ga";
type InjuryMap = Record<string, { injury: string; returnDate: string }>;

const SORT_LABELS: Record<SortKey, string> = { value: "Value", mins: "Mins", games: "Games", ga: "G+A" };

const THEME = {
  less: { bg: "rgba(255, 71, 87, 0.06)", border: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a", rankBg: "rgba(255, 71, 87, 0.15)", imgBorder: "1px solid rgba(255, 71, 87, 0.2)" },
  more: { bg: "rgba(34, 197, 94, 0.06)", border: "rgba(34, 197, 94, 0.15)", color: "#22c55e", rankBg: "rgba(34, 197, 94, 0.15)", imgBorder: "1px solid rgba(34, 197, 94, 0.2)" },
} as const;

function formatValue(v: number): string {
  if (v >= 1_000_000) return `\u20AC${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `\u20AC${(v / 1_000).toFixed(0)}k`;
  return `\u20AC${v}`;
}

function formatReturnInfo(dateStr: string) {
  if (!dateStr) return null;
  const [d, m, y] = dateStr.split("/").map(Number);
  if (!d || !m || !y) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  const mon = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  if (days <= 0) return `${mon} ${d}`;
  if (days <= 14) return `${days}d`;
  if (days <= 60) return `~${Math.ceil(days / 7)}w`;
  return `${mon} ${d}`;
}

function BenchmarkCard({ player }: { player: MinutesValuePlayer }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-6 animate-scale-in"
      style={{
        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)",
        border: "1px solid rgba(255, 215, 0, 0.3)",
        boxShadow: "0 0 60px rgba(255, 215, 0, 0.08), inset 0 1px 0 rgba(255, 215, 0, 0.1)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-20"
        style={{ background: "radial-gradient(circle at top right, rgba(255, 215, 0, 0.4), transparent 70%)" }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        <div className="flex items-start gap-4 sm:block">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-xl opacity-60"
              style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", filter: "blur(4px)" }}
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
                style={{ background: "var(--bg-elevated)", color: "#ffd700", border: "2px solid rgba(255, 215, 0, 0.5)" }}
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
          <div className="flex-1 min-w-0 sm:hidden">
            <a
              href={`https://www.transfermarkt.com${player.profileUrl.replace(PROFIL_RE, "/leistungsdaten/")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-lg hover:underline block truncate"
              style={{ color: "#ffd700" }}
            >
              {player.name}
            </a>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <span className="font-medium">{player.position}</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block flex-1 min-w-0">
          <a
            href={`https://www.transfermarkt.com${player.profileUrl.replace(PROFIL_RE, "/leistungsdaten/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-xl hover:underline block truncate"
            style={{ color: "#ffd700" }}
          >
            {player.name}
          </a>
          <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-medium">{player.position}</span>
            {player.nationality && <><span style={{ opacity: 0.4 }}>·</span><span>{player.nationality}</span></>}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="tabular-nums">{player.totalMatches} games</span>
            <span className="tabular-nums">{player.goals} goals</span>
            <span className="tabular-nums">{player.assists} assists</span>
            <span className="opacity-60">Age {player.age}</span>
          </div>
        </div>

        <div className="hidden sm:flex gap-6 shrink-0">
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums" style={{ color: "#ffd700" }}>
              {player.marketValueDisplay}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black tabular-nums" style={{ color: "var(--accent-blue)" }}>
              {player.minutes.toLocaleString()}&apos;
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>Minutes</div>
          </div>
        </div>

        <div className="sm:hidden flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.15)" }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="tabular-nums">{player.totalMatches} games</span>
            <span className="tabular-nums">{player.goals}G {player.assists}A</span>
            <span className="opacity-60">Age {player.age}</span>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="text-lg font-black tabular-nums" style={{ color: "#ffd700" }}>{player.marketValueDisplay}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player, target, index, variant = "less", onSelect, injuryMap }: { player: MinutesValuePlayer; target?: MinutesValuePlayer; index: number; variant?: CompareTab; onSelect?: (p: MinutesValuePlayer) => void; injuryMap?: InjuryMap }) {
  const t = THEME[variant];
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
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
          style={{ background: t.rankBg, color: t.color }}
        >
          {index + 1}
        </div>

        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
              style={{ background: "var(--bg-elevated)", border: t.imgBorder }}
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-base sm:text-lg font-bold"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
            >
              {player.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onSelect?.(player)}
            className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors text-left"
            style={{ color: "var(--text-primary)" }}
          >
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
                    {info.injury}{ret ? ` · ${ret}` : ""}
                  </span>
                </>
              );
            })()}
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>·</span>
            <span className="hidden sm:inline">{player.age}y</span>
          </div>
        </div>

        {/* Desktop metrics */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: t.color }}>{player.marketValueDisplay}</div>
            {target && <div className="text-[10px] font-medium tabular-nums" style={{ color: t.color, opacity: 0.7 }}>{valueDiffDisplay}</div>}
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[4rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>
              {player.minutes.toLocaleString()}&apos;
            </div>
            {target && <div className="text-[10px] font-medium tabular-nums" style={{ color: t.color }}>
              {variant === "more" ? "+" : "\u2212"}{Math.abs(minsDiff).toLocaleString()}&apos;
            </div>}
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {player.totalMatches}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>games</div>
            </div>
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {player.goals}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>goals</div>
            </div>
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {player.assists}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>assists</div>
            </div>
          </div>
        </div>

        {/* Mobile metrics */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: t.color }}>{player.marketValueDisplay}</div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--accent-blue)" }}>
            {player.minutes.toLocaleString()}&apos;
          </div>
        </div>
      </div>

    </div>
  );
}

const ROW_HEIGHT = 100;
const GAP = 12;

function VirtualPlayerList({ items, target, variant = "less", onSelect, injuryMap }: { items: MinutesValuePlayer[]; target?: MinutesValuePlayer; variant?: CompareTab; onSelect?: (p: MinutesValuePlayer) => void; injuryMap?: InjuryMap }) {
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
            <PlayerCard player={items[virtualRow.index]} target={target} index={virtualRow.index} variant={variant} onSelect={onSelect} injuryMap={injuryMap} />
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSortKey(v: string | null): SortKey {
  if (v === "value" || v === "mins" || v === "games" || v === "ga") return v;
  return "mins";
}

export function MinutesValueUI({ initialData: players, injuryMap }: { initialData: MinutesValuePlayer[]; injuryMap?: InjuryMap }) {
  const { params, update } = useQueryParams("/minutes-value");

  // URL-derived state
  const urlName = params.get("name") || "";
  const sortBy = parseSortKey(params.get("sort"));
  const sortAsc = params.get("dir") === "asc";
  const tab: CompareTab = params.get("tab") === "more" ? "more" : "less";
  const leagueFilter = params.get("league") || "all";
  const clubFilter = params.get("club") || "";
  const top5Only = params.get("top5") === "1";

  // Local state for search input (synced from URL)
  const [query, setQuery] = useState(urlName);
  useEffect(() => { setQuery(urlName); }, [urlName]);

  // Derive selected player from URL name
  const selected = useMemo(() => {
    if (!urlName) return null;
    return players.find((p) => p.name === urlName) ?? null;
  }, [urlName, players]);

  const handleSelect = (p: MinutesValuePlayer) => {
    update({ name: p.name });
  };

  const handleClear = () => {
    update({ name: null, tab: null });
  };

  // Comparison lists
  const playingLess = useMemo(() => {
    if (!selected) return [];
    return players.filter(
      (p) => p.playerId !== selected.playerId && p.marketValue >= selected.marketValue && p.minutes <= selected.minutes
    );
  }, [selected, players]);

  const playingMore = useMemo(() => {
    if (!selected) return [];
    return players.filter(
      (p) => p.playerId !== selected.playerId && p.marketValue >= selected.marketValue && p.minutes > selected.minutes
    );
  }, [selected, players]);

  const results = tab === "less" ? playingLess : playingMore;

  // Discovery mode: league options from data
  const leagueOptions = useMemo(
    () => Array.from(new Set(players.map((p) => p.league).filter(Boolean))).sort(),
    [players]
  );

  // Discovery mode: filtered + sorted list
  const sortedPlayers = useMemo(() => {
    let list = filterPlayersByLeagueAndClub(players, leagueFilter, clubFilter);
    if (top5Only) list = filterTop5(list);
    return [...list].sort((a, b) => {
      let diff: number;
      switch (sortBy) {
        case "mins": diff = b.minutes - a.minutes; break;
        case "games": diff = b.totalMatches - a.totalMatches; break;
        case "ga": diff = (b.goals + b.assists) - (a.goals + a.assists); break;
        default: diff = b.marketValue - a.marketValue;
      }
      return sortAsc ? -diff : diff;
    });
  }, [players, sortBy, sortAsc, leagueFilter, clubFilter, top5Only]);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Benched <span style={{ color: "#ff6b7a" }}>Stars</span>
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            High-value players getting the fewest minutes
          </p>
        </div>

        {/* Search */}
        <Card className="p-3 sm:p-4 mb-6 sm:mb-8">
          <PlayerAutocomplete
            players={selected ? EMPTY_PLAYERS : players}
            value={query}
            onChange={(val) => {
              setQuery(val);
              if (!val.trim() || val !== selected?.name) handleClear();
            }}
            onSelect={(player) => {
              setQuery(player.name);
              handleSelect(player);
            }}
            placeholder="Search player (e.g. Kenan Yildiz)"
            renderTrailing={(player) => (
              <div className="text-xs tabular-nums shrink-0" style={{ color: "var(--accent-blue)" }}>
                {player.minutes.toLocaleString()}&apos;
              </div>
            )}
          />
        </Card>

        {/* Results */}
        {selected && (
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: "#ffd700" }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ffd700" }}>Benchmark Player</h2>
              </div>
              <BenchmarkCard player={selected} />
            </section>

            <section>
              <Tabs
                value={tab}
                onValueChange={(v) => update({ tab: v === "less" ? null : v })}
              >
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="less" className="flex-1 gap-2">
                    Playing Less
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                      style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
                    >
                      {playingLess.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="more" className="flex-1 gap-2">
                    Playing More
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                      style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}
                    >
                      {playingMore.length}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="less">
                  {playingLess.length === 0 ? (
                    <div
                      className="rounded-xl p-10 text-center animate-fade-in"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                    >
                      <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>No results</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        No higher-valued players have fewer minutes than {selected.name}
                      </p>
                    </div>
                  ) : (
                    <VirtualPlayerList items={playingLess} target={selected} variant="less" onSelect={handleSelect} injuryMap={injuryMap} />
                  )}
                </TabsContent>

                <TabsContent value="more">
                  {playingMore.length === 0 ? (
                    <div
                      className="rounded-xl p-10 text-center animate-fade-in"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                    >
                      <p className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>No results</p>
                      <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        No higher-valued players have more minutes than {selected.name}
                      </p>
                    </div>
                  ) : (
                    <VirtualPlayerList items={playingMore} target={selected} variant="more" onSelect={handleSelect} />
                  )}
                </TabsContent>
              </Tabs>
            </section>

            <div
              className="text-center py-6 text-xs animate-fade-in"
              style={{ color: "var(--text-muted)", animationDelay: "0.3s" }}
            >
              Analyzed {players.length.toLocaleString()} players by market value
            </div>
          </div>
        )}

        {/* Full list when no selection */}
        {!selected && players.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "var(--accent-blue)" }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  All Players
                </h2>
                <ToggleGroup
                  type="single"
                  value={sortBy}
                  onValueChange={(value) => {
                    if (!value) { update({ dir: sortAsc ? null : "asc" }); return; }
                    update({ sort: value === "mins" ? null : value, dir: null });
                  }}
                  className="ml-2 rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--border-subtle)" }}
                >
                  {(["value", "mins", "games", "ga"] as const).map((key) => (
                    <ToggleGroupItem
                      key={key}
                      value={key}
                      className="px-2.5 py-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide rounded-none border-0 flex items-center gap-1 text-[var(--text-muted)] data-[state=on]:bg-[var(--bg-elevated)] data-[state=on]:text-[var(--text-primary)]"
                    >
                      {SORT_LABELS[key]}
                      {sortBy === key && (
                        <span className="text-[10px]">{sortAsc ? "▲" : "▼"}</span>
                      )}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <span
                className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums"
                style={{ background: "rgba(100, 180, 255, 0.15)", color: "var(--accent-blue)" }}
              >
                {sortedPlayers.length}
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SelectNative
                  value={leagueFilter}
                  onChange={(e) => update({ league: e.target.value === "all" ? null : e.target.value })}
                  className="h-10"
                >
                  <option value="all">All leagues</option>
                  {leagueOptions.map((league) => (
                    <option key={league} value={league}>
                      {league}
                    </option>
                  ))}
                </SelectNative>
                <DebouncedInput
                  value={clubFilter}
                  onChange={(value) => update({ club: value || null })}
                  placeholder="Filter by club"
                  className="h-10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => update({ top5: top5Only ? null : "1" })}
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
              </div>
            </div>

            <VirtualPlayerList items={sortedPlayers} onSelect={handleSelect} />
          </section>
        )}
      </div>
    </main>
  );
}
