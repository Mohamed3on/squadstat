"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { MinutesValuePlayer } from "@/app/types";

async function fetchMinutesValue(signal?: AbortSignal): Promise<{ players: MinutesValuePlayer[] }> {
  const res = await fetch("/api/minutes-value", { signal });
  return res.json();
}

async function fetchMinutesBatch(playerIds: string[], signal?: AbortSignal): Promise<Record<string, number>> {
  const res = await fetch("/api/player-minutes/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerIds }),
    signal,
  });
  const data = await res.json();
  return data.minutes || {};
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `\u20AC${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `\u20AC${(v / 1_000).toFixed(0)}k`;
  return `\u20AC${v}`;
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
              <span style={{ opacity: 0.4 }}>·</span>
              <span className="truncate opacity-80">{player.club}</span>
            </div>
          </div>
        </div>

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
            <span style={{ opacity: 0.4 }}>·</span>
            <span className="truncate opacity-80">{player.club}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{player.nationality}</span>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="tabular-nums">{player.totalMatches} apps</span>
            <span className="tabular-nums">{player.minutes.toLocaleString()}&apos;</span>
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
            <span className="tabular-nums">{player.totalMatches} apps</span>
            <span className="tabular-nums">{player.minutes.toLocaleString()}&apos;</span>
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

function PlayerCard({ player, target, index }: { player: MinutesValuePlayer; target?: MinutesValuePlayer; index: number }) {
  const valueDiff = target ? player.marketValue - target.marketValue : 0;
  const valueDiffDisplay = valueDiff >= 1_000_000
    ? `+${formatValue(valueDiff)}`
    : valueDiff > 0
      ? `+${formatValue(valueDiff)}`
      : formatValue(valueDiff);
  const minsDiff = target ? target.minutes - player.minutes : 0;

  return (
    <div
      className="group rounded-xl p-3 sm:p-4 transition-transform duration-200 animate-slide-up hover:translate-x-1"
      style={{
        background: "linear-gradient(135deg, rgba(255, 71, 87, 0.06) 0%, var(--bg-card) 100%)",
        border: "1px solid rgba(255, 71, 87, 0.15)",
        animationDelay: `${index * 0.04}s`,
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
          style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
        >
          {index + 1}
        </div>

        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
              style={{ background: "var(--bg-elevated)", border: "1px solid rgba(255, 71, 87, 0.2)" }}
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
            <span style={{ opacity: 0.4 }}>·</span>
            <span className="truncate max-w-[100px] sm:max-w-none">{player.club}</span>
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>·</span>
            <span className="hidden sm:inline">{player.age}y</span>
          </div>
        </div>

        {/* Desktop metrics */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: "#ff6b7a" }}>{player.marketValueDisplay}</div>
            {target && <div className="text-[10px] font-medium tabular-nums" style={{ color: "rgba(255, 107, 122, 0.7)" }}>{valueDiffDisplay}</div>}
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[4rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>
              {player.minutes.toLocaleString()}&apos;
            </div>
            {target && <div className="text-[10px] font-medium tabular-nums" style={{ color: "#ff6b7a" }}>
              &minus;{minsDiff.toLocaleString()}&apos;
            </div>}
          </div>
          <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[3rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {player.totalMatches}
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>apps</div>
          </div>
        </div>

        {/* Mobile metrics */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: "#ff6b7a" }}>{player.marketValueDisplay}</div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--accent-blue)" }}>
            {player.minutes.toLocaleString()}&apos;
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 text-[10px] sm:text-xs" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.clubMatches} club</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.intlMatches} intl</span>
        <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>{player.nationality}</span>
        <span className="sm:hidden tabular-nums" style={{ color: "var(--text-muted)" }}>{player.age}y</span>
        <span className="hidden sm:block ml-auto text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          {player.league}
        </span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", opacity: 1 - i * 0.1 }}
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MinutesValueUI() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MinutesValuePlayer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [sortBy, setSortBy] = useState<"value" | "minutes">("value");
  const [sortAsc, setSortAsc] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["minutes-value"],
    queryFn: ({ signal }) => fetchMinutesValue(signal),
    staleTime: 5 * 60 * 1000,
  });

  const rawPlayers = data?.players || [];

  // Batch-verify 0-minute players in a single request
  const zeroMinuteIds = useMemo(() => rawPlayers.filter((p) => p.minutes === 0).map((p) => p.playerId), [rawPlayers]);
  const { data: batchMinutes } = useQuery({
    queryKey: ["player-minutes-batch", zeroMinuteIds],
    queryFn: ({ signal }) => fetchMinutesBatch(zeroMinuteIds, signal),
    enabled: zeroMinuteIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const players = useMemo(() => {
    if (!batchMinutes || zeroMinuteIds.length === 0) return rawPlayers;
    return rawPlayers.map((p) => {
      const corrected = batchMinutes[p.playerId];
      return corrected !== undefined && corrected > 0 ? { ...p, minutes: corrected } : p;
    });
  }, [rawPlayers, zeroMinuteIds, batchMinutes]);

  const suggestions = useMemo(() => {
    if (!query.trim() || selected) return [];
    const q = query.toLowerCase();
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [query, players, selected]);

  const results = useMemo(() => {
    if (!selected) return [];
    return players.filter(
      (p) => p.playerId !== selected.playerId && p.marketValue >= selected.marketValue && p.minutes <= selected.minutes
    );
  }, [selected, players]);

  const sortedPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      const diff = sortBy === "minutes" ? a.minutes - b.minutes : b.marketValue - a.marketValue;
      return sortAsc ? -diff : diff;
    });
    return sorted;
  }, [players, sortBy, sortAsc]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(player: MinutesValuePlayer) {
    setSelected(player);
    setQuery(player.name);
    setShowDropdown(false);
    setHighlightIndex(-1);
  }

  function handleInputChange(value: string) {
    setQuery(value);
    setSelected(null);
    setShowDropdown(true);
    setHighlightIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIndex]);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Minutes vs <span style={{ color: "#ff6b7a" }}>Value</span>
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Find players worth more but playing less than your pick
          </p>
        </div>

        {/* Search */}
        <Card className="p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => !selected && query.trim() && setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Loading players..." : "Search player (e.g. Kenan Yildiz)"}
              disabled={isLoading}
              className="h-11"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-5 w-5 animate-spin text-[#ffd700]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
              >
                {suggestions.map((player, i) => (
                  <button
                    key={player.playerId}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: i === highlightIndex ? "rgba(255, 215, 0, 0.1)" : "transparent",
                      borderBottom: i < suggestions.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                    onMouseEnter={() => setHighlightIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(player);
                    }}
                  >
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" style={{ background: "var(--bg-card)" }} />
                    ) : (
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                        {player.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{player.name}</div>
                      <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                        {player.position} · {player.club} · {player.marketValueDisplay}
                      </div>
                    </div>
                    <div className="text-xs tabular-nums shrink-0" style={{ color: "var(--accent-blue)" }}>
                      {player.minutes.toLocaleString()}&apos;
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Loading */}
        {isLoading && <LoadingSkeleton />}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-5 mb-6 animate-fade-in"
            style={{ background: "rgba(255, 71, 87, 0.1)", border: "1px solid rgba(255, 71, 87, 0.3)" }}
          >
            <p className="font-medium" style={{ color: "#ff6b7a" }}>Error loading data. Please refresh.</p>
          </div>
        )}

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{ background: "#ff4757" }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#ff6b7a" }}>
                    Worth More, Playing Less
                  </h2>
                </div>
                <span
                  className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums"
                  style={{ background: "rgba(255, 71, 87, 0.15)", color: "#ff6b7a" }}
                >
                  {results.length}
                </span>
              </div>

              {results.length === 0 ? (
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
                <div className="space-y-3">
                  {results.map((player, index) => (
                    <PlayerCard key={player.playerId} player={player} target={selected} index={index} />
                  ))}
                </div>
              )}
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
        {!isLoading && !error && !selected && players.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "var(--accent-blue)" }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  All Players
                </h2>
                <div className="flex items-center rounded-lg overflow-hidden ml-2" style={{ border: "1px solid var(--border-subtle)" }}>
                  {(["value", "minutes"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (sortBy === key) setSortAsc((v) => !v);
                        else { setSortBy(key); setSortAsc(false); }
                      }}
                      className="px-2.5 py-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide transition-colors flex items-center gap-1"
                      style={{
                        background: sortBy === key ? "var(--bg-elevated)" : "transparent",
                        color: sortBy === key ? "var(--text-primary)" : "var(--text-muted)",
                      }}
                    >
                      {key === "value" ? "Value" : "Mins"}
                      {sortBy === key && (
                        <span className="text-[10px]">{sortAsc ? "\u25B2" : "\u25BC"}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <span
                className="text-sm font-bold px-2.5 py-1 rounded-lg tabular-nums"
                style={{ background: "rgba(100, 180, 255, 0.15)", color: "var(--accent-blue)" }}
              >
                {players.length}
              </span>
            </div>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <PlayerCard key={player.playerId} player={player} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
