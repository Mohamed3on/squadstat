"use client";

import { useState, useMemo, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { PlayerAutocomplete } from "@/components/PlayerAutocomplete";
import { Card } from "@/components/ui/card";
import type { MinutesValuePlayer } from "@/app/types";

const PROFIL_RE = /\/profil\//;
const EMPTY_PLAYERS: MinutesValuePlayer[] = [];

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

function PlayerCard({ player, target, index }: { player: MinutesValuePlayer; target?: MinutesValuePlayer; index: number }) {
  const valueDiff = target ? player.marketValue - target.marketValue : 0;
  const valueDiffDisplay = valueDiff > 0 ? `+${formatValue(valueDiff)}` : formatValue(valueDiff);
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
            href={`https://www.transfermarkt.com${player.profileUrl.replace(PROFIL_RE, "/leistungsdaten/")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm sm:text-base hover:underline block truncate transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {player.name}
          </a>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mt-0.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span>{player.position}</span>
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
          <div className="text-xs font-bold tabular-nums" style={{ color: "#ff6b7a" }}>{player.marketValueDisplay}</div>
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

function VirtualPlayerList({ items, target }: { items: MinutesValuePlayer[]; target?: MinutesValuePlayer }) {
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
            <PlayerCard player={items[virtualRow.index]} target={target} index={virtualRow.index} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MinutesValueUI({ initialData: players }: { initialData: MinutesValuePlayer[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MinutesValuePlayer | null>(null);
  const [sortBy, setSortBy] = useState<"value" | "minutes" | "games">("minutes");
  const [sortAsc, setSortAsc] = useState(false);

  const results = useMemo(() => {
    if (!selected) return [];
    return players.filter(
      (p) => p.playerId !== selected.playerId && p.marketValue >= selected.marketValue && p.minutes <= selected.minutes
    );
  }, [selected, players]);

  const sortedPlayers = useMemo(() =>
    [...players].sort((a, b) => {
      const diff = sortBy === "minutes" ? b.minutes - a.minutes : sortBy === "games" ? b.totalMatches - a.totalMatches : b.marketValue - a.marketValue;
      return sortAsc ? -diff : diff;
    }),
  [players, sortBy, sortAsc]);

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
              if (!val.trim() || val !== selected?.name) setSelected(null);
            }}
            onSelect={(player) => {
              setSelected(player);
              setQuery(player.name);
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
                <VirtualPlayerList items={results} target={selected} />
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
        {!selected && players.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: "var(--accent-blue)" }} />
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  All Players
                </h2>
                <div className="flex items-center rounded-lg overflow-hidden ml-2" style={{ border: "1px solid var(--border-subtle)" }}>
                  {(["value", "minutes", "games"] as const).map((key) => (
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
                      {key === "value" ? "Value" : key === "minutes" ? "Mins" : "Games"}
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
            <VirtualPlayerList items={sortedPlayers} />
          </section>
        )}
      </div>
    </main>
  );
}
