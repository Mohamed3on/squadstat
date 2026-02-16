"use client";

import { useMemo, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { DebouncedInput } from "@/components/DebouncedInput";
import { SelectNative } from "@/components/ui/select-native";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { filterPlayersByLeagueAndClub, filterTop5 } from "@/lib/filter-players";
import { formatReturnInfo, formatInjuryDuration, PROFIL_RE } from "@/lib/format";
import type { MinutesValuePlayer, InjuryMap } from "@/app/types";

type SortKey = "value" | "mins" | "games" | "ga";
type SigningFilter = "transfer" | "loan" | null;

const SORT_LABELS: Record<SortKey, string> = { value: "Value", mins: "Mins", games: "Games", ga: "G+A" };

function PlayerCard({ player, index, injuryMap }: { player: MinutesValuePlayer; index: number; injuryMap?: InjuryMap }) {
  const injuryInfo = injuryMap?.[player.playerId];

  const borderColor = player.isOnLoan
    ? "rgba(255, 215, 0, 0.5)"
    : player.isNewSigning
      ? "rgba(0, 255, 135, 0.4)"
      : "var(--border-subtle)";

  return (
    <div
      className="group rounded-xl p-2.5 sm:p-3 animate-slide-up hover-lift"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${borderColor}`,
        animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
      }}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0"
          style={{ background: "rgba(100, 180, 255, 0.15)", color: "var(--accent-blue)" }}
        >
          {index + 1}
        </div>

        <div className="relative shrink-0">
          {player.imageUrl ? (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            />
          ) : (
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold"
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
            className="font-semibold text-sm hover:underline block truncate transition-colors text-left"
            style={{ color: "var(--text-primary)" }}
          >
            {player.name}
          </a>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs mt-0.5 flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span>{player.position}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span className="truncate max-w-[8rem] sm:max-w-none">{player.club}</span>
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>·</span>
            <span className="hidden sm:inline">{player.age}y</span>
            {injuryInfo && (() => {
              const dur = formatInjuryDuration(injuryInfo.injurySince);
              const ret = formatReturnInfo(injuryInfo.returnDate);
              const parts = [injuryInfo.injury, dur && `since ${dur}`, ret?.label].filter(Boolean);
              return (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,71,87,0.12)] text-[#ff6b7a]">
                    {parts.join(" · ")}
                  </span>
                </>
              );
            })()}
          </div>
        </div>

        {/* Desktop metrics */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.marketValueDisplay}</div>
          </div>
          <div className="w-px h-7" style={{ background: "var(--border-subtle)" }} />
          <div className="text-right min-w-[4rem]">
            <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {player.minutes.toLocaleString()}&apos;
            </div>
          </div>
          <div className="w-px h-7" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.totalMatches}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>games</div>
            </div>
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "#00ff87" }}>{player.goals + player.assists}</div>
              <div className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{player.goals}G {player.assists}A</div>
            </div>
          </div>
        </div>

        {/* Mobile metrics */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-bold tabular-nums" style={{ color: "var(--accent-blue)" }}>{player.marketValueDisplay}</div>
          <div className="text-[10px] tabular-nums" style={{ color: "var(--text-primary)" }}>
            {player.goals + player.assists} G+A ({player.goals}G {player.assists}A)
          </div>
        </div>
      </div>
    </div>
  );
}

const ROW_HEIGHT = 76;
const GAP = 8;

function VirtualPlayerList({ items, injuryMap }: { items: MinutesValuePlayer[]; injuryMap?: InjuryMap }) {
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
            <PlayerCard player={items[virtualRow.index]} index={virtualRow.index} injuryMap={injuryMap} />
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSortKey(v: string | null): SortKey {
  if (v === "value" || v === "mins" || v === "games" || v === "ga") return v;
  return "ga";
}

function parseSigningFilter(v: string | null): SigningFilter {
  if (v === "transfer" || v === "loan") return v;
  return null;
}

function FilterButton({ active, onClick, color, children }: {
  active: boolean;
  onClick: () => void;
  color: "blue" | "green" | "gold";
  children: React.ReactNode;
}) {
  const colors = {
    blue: { bg: "rgba(88, 166, 255, 0.15)", text: "var(--accent-blue)", border: "rgba(88, 166, 255, 0.3)" },
    green: { bg: "rgba(0, 255, 135, 0.15)", text: "#00ff87", border: "rgba(0, 255, 135, 0.3)" },
    gold: { bg: "rgba(255, 215, 0, 0.15)", text: "#ffd700", border: "rgba(255, 215, 0, 0.3)" },
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
      style={{
        background: active ? colors.bg : "var(--bg-elevated)",
        color: active ? colors.text : "var(--text-muted)",
        border: active ? `1px solid ${colors.border}` : "1px solid var(--border-subtle)",
      }}
    >
      {children}
    </button>
  );
}

export function PlayersUI({ initialData: players, injuryMap }: { initialData: MinutesValuePlayer[]; injuryMap?: InjuryMap }) {
  const { params, update } = useQueryParams("/players");

  const sortBy = parseSortKey(params.get("sort"));
  const sortAsc = params.get("dir") === "asc";
  const leagueFilter = params.get("league") || "all";
  const clubFilter = params.get("club") || "";
  const top5Only = params.get("top5") === "1";
  const signingFilter = parseSigningFilter(params.get("signing"));

  const leagueOptions = useMemo(
    () => Array.from(new Set(players.map((p) => p.league).filter(Boolean))).sort(),
    [players]
  );

  const signingCounts = useMemo(() => {
    let base = filterPlayersByLeagueAndClub(players, leagueFilter, clubFilter);
    if (top5Only) base = filterTop5(base);
    return {
      newSignings: base.filter((p) => p.isNewSigning).length,
      loans: base.filter((p) => p.isOnLoan).length,
    };
  }, [players, leagueFilter, clubFilter, top5Only]);

  const sortedPlayers = useMemo(() => {
    let list = filterPlayersByLeagueAndClub(players, leagueFilter, clubFilter);
    if (top5Only) list = filterTop5(list);
    if (signingFilter === "transfer") list = list.filter((p) => p.isNewSigning);
    if (signingFilter === "loan") list = list.filter((p) => p.isOnLoan);
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
  }, [players, sortBy, sortAsc, leagueFilter, clubFilter, top5Only, signingFilter]);

  return (
    <>
      <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[var(--text-primary)]">
            Player <span className="text-[var(--accent-blue)]">Explorer</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)]">
            {players.length.toLocaleString()} players from Europe&apos;s top 5 leagues, sortable by market value, minutes played, appearances, and goal contributions. Data from Transfermarkt, updated daily.
          </p>
        </div>

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
                  update({ sort: value === "ga" ? null : value, dir: null });
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
                  <option key={league} value={league}>{league}</option>
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
              <FilterButton
                active={top5Only}
                onClick={() => update({ top5: top5Only ? null : "1" })}
                color="blue"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Top 5 leagues
              </FilterButton>
              <FilterButton
                active={signingFilter === "transfer"}
                onClick={() => update({ signing: signingFilter === "transfer" ? null : "transfer", new: null })}
                color="green"
              >
                New signings
                <span className="tabular-nums opacity-60">{signingCounts.newSignings}</span>
              </FilterButton>
              <FilterButton
                active={signingFilter === "loan"}
                onClick={() => update({ signing: signingFilter === "loan" ? null : "loan", new: null })}
                color="gold"
              >
                Loans
                <span className="tabular-nums opacity-60">{signingCounts.loans}</span>
              </FilterButton>
            </div>
          </div>

          <VirtualPlayerList items={sortedPlayers} injuryMap={injuryMap} />
        </section>
    </>
  );
}
