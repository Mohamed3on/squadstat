"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Combobox } from "@/components/Combobox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FilterButton } from "@/components/FilterButton";
import { Input } from "@/components/ui/input";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { filterPlayersByLeagueAndClub, filterTop5 } from "@/lib/filter-players";
import { formatReturnInfo, formatInjuryDuration, PROFIL_RE } from "@/lib/format";
import type { MinutesValuePlayer, InjuryMap } from "@/app/types";

type SortKey = "value" | "mins" | "games" | "ga" | "pen" | "miss";
type SigningFilter = "transfer" | "loan" | null;

const BASE_SORT_LABELS: Record<SortKey, string> = { value: "Value", mins: "Mins", games: "Games", ga: "G+A", pen: "Pen", miss: "Miss" };

const POS_ABBREV: Record<string, string> = {
  "Centre-Forward": "CF", "Centre-Back": "CB", "Central Midfield": "CM",
  "Right Winger": "RW", "Left Winger": "LW", "Right-Back": "RB", "Left-Back": "LB",
  "Attacking Midfield": "AM", "Defensive Midfield": "DM", "Second Striker": "SS",
  "Left Midfield": "LM", "Right Midfield": "RM", "Goalkeeper": "GK",
};

function AvatarBadge({ bg, icon, tooltip, position = "bottom-right" }: { bg: string; icon: ReactNode; tooltip: string; position?: "bottom-right" | "top-right" }) {
  const pos = position === "top-right" ? "-top-1 -right-1" : "-bottom-1 -right-1";
  return (
    <div
      className={`absolute ${pos} w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full flex items-center justify-center group/badge before:content-[''] before:absolute before:-inset-2`}
      style={{ background: bg }}
      aria-label={tooltip}
      role="img"
      tabIndex={0}
    >
      {icon}
      <span className="pointer-events-none invisible group-hover/badge:visible group-focus/badge:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap z-[100] bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-[0_0_0_2px_var(--bg-card),0_4px_12px_rgba(0,0,0,0.4)]">
        {tooltip}
      </span>
    </div>
  );
}

interface CardContext { sortBy: SortKey; showCaps: boolean; includePen: boolean }

function PlayerCard({ player, index, injuryMap, ctx }: { player: MinutesValuePlayer; index: number; injuryMap?: InjuryMap; ctx: CardContext }) {
  const { sortBy, showCaps, includePen } = ctx;
  const penGoals = player.penaltyGoals ?? 0;
  const penMisses = player.penaltyMisses ?? 0;
  const penAttempts = penGoals + penMisses;
  const penAdj = includePen ? 0 : penGoals;
  const gaTotal = (player.goals - penAdj) + player.assists;
  const pointsLabel = includePen ? "G+A" : "npG+A";
  const injuryInfo = injuryMap?.[player.playerId];

  // Status badge (loan/signing) at top-right, injury badge at bottom-right — both can coexist
  const statusBadge = player.isOnLoan ? (
    <AvatarBadge
      position={injuryInfo ? "top-right" : "bottom-right"}
      bg="rgba(255, 215, 0, 0.9)"
      tooltip="On loan"
      icon={<svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>}
    />
  ) : player.isNewSigning ? (
    <AvatarBadge
      position={injuryInfo ? "top-right" : "bottom-right"}
      bg="rgba(0, 255, 135, 0.85)"
      tooltip="New signing"
      icon={<svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" /></svg>}
    />
  ) : null;

  let injuryBadge: ReactNode = null;
  if (injuryInfo) {
    const dur = formatInjuryDuration(injuryInfo.injurySince);
    const ret = formatReturnInfo(injuryInfo.returnDate);
    const tip = [injuryInfo.injury, dur && `out ${dur}`, ret?.label].filter(Boolean).join(" · ");
    injuryBadge = (
      <AvatarBadge
        position="bottom-right"
        bg="rgba(255, 71, 87, 0.9)"
        tooltip={tip}
        icon={<svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" /></svg>}
      />
    );
  }

  return (
    <div
      className="group relative z-0 hover:z-10 rounded-xl p-2.5 sm:p-3 animate-slide-up hover-lift"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
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
          {statusBadge}
          {injuryBadge}
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
          <div className="flex items-center gap-1.5 text-xs mt-0.5 overflow-hidden" style={{ color: "var(--text-secondary)" }}>
            <span className="sm:hidden shrink-0">{POS_ABBREV[player.position] || player.position}</span>
            <span className="hidden sm:inline shrink-0">{player.position}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span className="truncate inline-flex items-center gap-1">
              {player.clubLogoUrl && <img src={player.clubLogoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />}
              {player.club}
            </span>
            {player.nationality && <>
              <span className="hidden sm:inline" style={{ opacity: 0.4 }}>·</span>
              <span className="hidden sm:inline shrink-0">{player.nationality}</span>
            </>}
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>·</span>
            <span className="hidden sm:inline">{player.age}y</span>
          </div>
        </div>

        {/* Desktop metrics — context-aware based on active sort/filters */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-sm font-medium font-value" style={{ color: "var(--accent-blue)" }}>{player.marketValueDisplay}</div>
          </div>
          <div className="w-px h-7" style={{ background: "var(--border-subtle)" }} />
          {(sortBy === "mins" || sortBy === "value" || sortBy === "ga" || sortBy === "games") && (
            <div className="text-right min-w-[4rem]">
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {player.minutes.toLocaleString()}&apos;
              </div>
            </div>
          )}
          {showCaps && (
            <div className="text-right">
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.intlCareerCaps ?? 0}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>caps</div>
            </div>
          )}
          {(sortBy === "pen" || sortBy === "miss" || includePen) && penAttempts > 0 && (
            <div className="text-right min-w-[3rem]">
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{penGoals}/{penAttempts}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>pens · {Math.round(penGoals / penAttempts * 100)}%</div>
            </div>
          )}
          {sortBy === "miss" && (
            <div className="text-right">
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{penMisses}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>missed</div>
            </div>
          )}
          <div className="w-px h-7" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{player.totalMatches}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>games</div>
            </div>
            <div>
              <div className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{gaTotal}</div>
              <div className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>{player.goals - penAdj}{penAdj > 0 ? "npG" : "G"} {player.assists}A</div>
            </div>
          </div>
        </div>

        {/* Mobile metrics — context-aware */}
        <div className="sm:hidden text-right shrink-0">
          <div className="text-xs font-medium font-value" style={{ color: "var(--accent-blue)" }}>{player.marketValueDisplay}</div>
          <div className="text-xs tabular-nums">
            <span style={{ color: "var(--text-primary)" }}>{gaTotal} {pointsLabel}</span>
            {showCaps && (
              <span style={{ color: "var(--text-secondary)" }}> · {player.intlCareerCaps ?? 0} caps</span>
            )}
            {(sortBy === "pen" || sortBy === "miss" || includePen) && penAttempts > 0 && (
              <span style={{ color: "var(--text-secondary)" }}> · {penGoals}/{penAttempts} pens</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ROW_HEIGHT = 80;
const GAP = 8;

function VirtualPlayerList({ items, injuryMap, ctx }: { items: MinutesValuePlayer[]; injuryMap?: InjuryMap; ctx: CardContext }) {
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
            <PlayerCard player={items[virtualRow.index]} index={virtualRow.index} injuryMap={injuryMap} ctx={ctx} />
          </div>
        ))}
      </div>
    </div>
  );
}

function parseSortKey(v: string | null): SortKey {
  if (v === "value" || v === "mins" || v === "games" || v === "ga" || v === "pen" || v === "miss") return v;
  return "ga";
}

function parseSigningFilter(v: string | null): SigningFilter {
  if (v === "transfer" || v === "loan") return v;
  return null;
}

export function PlayersUI({ initialData: rawPlayers, injuryMap }: { initialData: MinutesValuePlayer[]; injuryMap?: InjuryMap }) {
  const { params, update } = useQueryParams("/players");

  const sortBy = parseSortKey(params.get("sort"));
  const sortAsc = params.get("dir") === "asc";
  const leagueFilter = params.get("league") || "all";
  const clubFilter = params.get("club") || "all";
  const nationalityFilter = params.get("nat") || "all";
  const top5Only = params.get("top5") === "1";
  const signingFilter = parseSigningFilter(params.get("signing"));
  const includePen = params.get("pen") === "1";
  const includeIntl = params.get("intl") === "1";
  const maxCaps = params.get("maxcaps") ? parseInt(params.get("maxcaps")!) : null;

  // Apply intl toggle client-side — adds intl stats when active
  const players = useMemo(() => {
    if (!includeIntl) return rawPlayers;
    return rawPlayers.map((p) => ({
      ...p,
      goals: p.goals + (p.intlGoals ?? 0),
      assists: p.assists + (p.intlAssists ?? 0),
      minutes: p.minutes + (p.intlMinutes ?? 0),
      totalMatches: p.totalMatches + (p.intlAppearances ?? 0),
    }));
  }, [rawPlayers, includeIntl]);

  const leagueOptions = useMemo(
    () => [{ value: "all", label: "All leagues" }, ...Array.from(new Set(players.map((p) => p.league).filter(Boolean))).sort().map((l) => ({ value: l, label: l }))],
    [players]
  );

  const nationalityOptions = useMemo(
    () => [{ value: "all", label: "All nationalities" }, ...Array.from(new Set(players.map((p) => p.nationality).filter(Boolean))).sort().map((n) => ({ value: n, label: n }))],
    [players]
  );

  const clubOptions = useMemo(
    () => [{ value: "all", label: "All clubs" }, ...Array.from(new Set(players.map((p) => p.club).filter(Boolean))).sort().map((c) => ({ value: c, label: c }))],
    [players]
  );

  const pointsLabel = includePen ? "G+A" : "npG+A";

  const signingCounts = useMemo(() => {
    let base = filterPlayersByLeagueAndClub(players, leagueFilter, clubFilter);
    if (top5Only) base = filterTop5(base);
    if (nationalityFilter !== "all") base = base.filter((p) => p.nationality === nationalityFilter);
    return {
      newSignings: base.filter((p) => p.isNewSigning).length,
      loans: base.filter((p) => p.isOnLoan).length,
    };
  }, [players, leagueFilter, clubFilter, top5Only, nationalityFilter]);

  const sortedPlayers = useMemo(() => {
    let list = filterPlayersByLeagueAndClub(players, leagueFilter, clubFilter);
    if (top5Only) list = filterTop5(list);
    if (nationalityFilter !== "all") list = list.filter((p) => p.nationality === nationalityFilter);
    if (signingFilter === "transfer") list = list.filter((p) => p.isNewSigning);
    if (signingFilter === "loan") list = list.filter((p) => p.isOnLoan);
    if (maxCaps !== null) list = list.filter((p) => (p.intlCareerCaps ?? 0) <= maxCaps);
    const penAdj = includePen ? 0 : 1;
    return [...list].sort((a, b) => {
      let diff: number;
      switch (sortBy) {
        case "mins": diff = b.minutes - a.minutes; break;
        case "games": diff = b.totalMatches - a.totalMatches; break;
        case "ga": diff = ((b.goals - (b.penaltyGoals ?? 0) * penAdj) + b.assists) - ((a.goals - (a.penaltyGoals ?? 0) * penAdj) + a.assists); break;
        case "pen": diff = (b.penaltyGoals ?? 0) - (a.penaltyGoals ?? 0); break;
        case "miss": diff = (b.penaltyMisses ?? 0) - (a.penaltyMisses ?? 0); break;
        default: diff = b.marketValue - a.marketValue;
      }
      return sortAsc ? -diff : diff;
    });
  }, [players, sortBy, sortAsc, leagueFilter, clubFilter, nationalityFilter, top5Only, signingFilter, includePen, maxCaps]);

  return (
    <>
      <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[var(--text-primary)]">
            Player <span className="text-[var(--accent-blue)]">Explorer</span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)]">
            The top 500 most valuable players in world football plus top scorers in Europe&apos;s top 5 leagues.          </p>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-5 rounded-full shrink-0" style={{ background: "var(--accent-blue)" }} />
            <h2 className="text-xs font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--text-secondary)" }}>
              All Players
            </h2>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md tabular-nums"
              style={{ background: "rgba(100, 180, 255, 0.15)", color: "var(--accent-blue)" }}
            >
              {sortedPlayers.length}
            </span>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
            <ToggleGroup
              type="single"
              value={sortBy}
              onValueChange={(value) => {
                if (!value) { update({ dir: sortAsc ? null : "asc" }); return; }
                update({ sort: value === "ga" ? null : value, dir: null });
              }}
              className="rounded-lg overflow-hidden w-max"
              style={{ border: "1px solid var(--border-subtle)" }}
            >
              {(["value", "mins", "games", "ga", "pen", "miss"] as const).map((key) => (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide rounded-none border-0 flex items-center gap-1 text-[var(--text-muted)] data-[state=on]:bg-[var(--bg-elevated)] data-[state=on]:text-[var(--text-primary)]"
                >
                  {key === "ga" ? pointsLabel : BASE_SORT_LABELS[key]}
                  {sortBy === key && (
                    <span className="text-[10px]">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <Combobox value={leagueFilter} onChange={(v) => update({ league: v === "all" ? null : v || null })} options={leagueOptions} placeholder="All leagues" searchPlaceholder="Search leagues..." />
              <Combobox value={nationalityFilter} onChange={(v) => update({ nat: v === "all" ? null : v || null })} options={nationalityOptions} placeholder="All nationalities" searchPlaceholder="Search nationalities..." />
              <Combobox value={clubFilter} onChange={(v) => update({ club: v === "all" ? null : v || null })} options={clubOptions} placeholder="All clubs" searchPlaceholder="Search clubs..." />
              <Input
                type="number"
                min={0}
                placeholder="Max caps"
                value={maxCaps ?? ""}
                onChange={(e) => update({ maxcaps: e.target.value || null })}
                className="h-8 w-20 text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <FilterButton active={top5Only} onClick={() => update({ top5: top5Only ? null : "1" })}>
                Top 5
              </FilterButton>
              <FilterButton active={signingFilter === "transfer"} onClick={() => update({ signing: signingFilter === "transfer" ? null : "transfer", new: null })}>
                Signings
                <span className="tabular-nums opacity-60">{signingCounts.newSignings}</span>
              </FilterButton>
              <FilterButton active={signingFilter === "loan"} onClick={() => update({ signing: signingFilter === "loan" ? null : "loan", new: null })}>
                Loans
                <span className="tabular-nums opacity-60">{signingCounts.loans}</span>
              </FilterButton>
              <div className="w-px h-6 self-center bg-[var(--border-subtle)]" />
              <FilterButton active={includePen} onClick={() => update({ pen: includePen ? null : "1" })}>
                Pens in G+A
              </FilterButton>
              <FilterButton active={includeIntl} onClick={() => update({ intl: includeIntl ? null : "1" })}>
                + Intl stats
              </FilterButton>
            </div>
          </div>

          <VirtualPlayerList items={sortedPlayers} injuryMap={injuryMap} ctx={{ sortBy, showCaps: maxCaps !== null, includePen }} />
        </section>
    </>
  );
}
