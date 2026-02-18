"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { InjuredPlayer } from "@/app/types";
import { getLeagueLogoUrl } from "@/lib/leagues";
import { formatReturnInfo, formatInjuryDuration } from "@/lib/format";
import { useProgressiveFetch } from "@/lib/use-progressive-fetch";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { SelectNative } from "@/components/ui/select-native";
import { DebouncedInput } from "@/components/DebouncedInput";
import { filterPlayersByLeagueAndClub } from "@/lib/filter-players";

interface TeamInjuryGroup {
  club: string;
  clubLogoUrl: string;
  league: string;
  players: InjuredPlayer[];
  totalValue: number;
  count: number;
}

interface InjuryTypeGroup {
  injury: string;
  players: InjuredPlayer[];
  totalValue: number;
  count: number;
}

export interface InjuredResponse {
  success: boolean;
  players: InjuredPlayer[];
  totalPlayers: number;
  leagues: string[];
}

interface InjuredUIProps {
  initialData: InjuredResponse;
  failedLeagues?: string[];
}

async function fetchLeagueInjured(code: string): Promise<InjuredPlayer[]> {
  const res = await fetch(`/api/injured?league=${code}`);
  const data = await res.json();
  return (data.players || []) as InjuredPlayer[];
}

function formatValue(value: string): string {
  return value || "-";
}

function getLeagueStyle(league: string): { bg: string; text: string } {
  const styles: Record<string, { bg: string; text: string }> = {
    Bundesliga: { bg: "bg-red-600", text: "text-white" },
    "Premier League": { bg: "bg-purple-900", text: "text-white" },
    "La Liga": { bg: "bg-orange-500", text: "text-white" },
    "Serie A": { bg: "bg-blue-700", text: "text-white" },
    "Ligue 1": { bg: "bg-yellow-400", text: "text-black" },
  };
  return styles[league] || { bg: "bg-gray-600", text: "text-white" };
}

function formatValueNum(value: number): string {
  if (value >= 1_000_000_000) {
    return `€${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(0)}M`;
  }
  if (value >= 1_000) {
    return `€${(value / 1_000).toFixed(0)}K`;
  }
  return `€${value}`;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div
      className={cn(
        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0",
        rank <= 3
          ? "bg-[var(--accent-hot)] text-[var(--bg-base)]"
          : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
      )}
    >
      {rank}
    </div>
  );
}

function PlayerCard({ player, rank, index = 0 }: { player: InjuredPlayer; rank: number; index?: number }) {
  const leagueStyle = getLeagueStyle(player.league);
  const returnInfo = formatReturnInfo(player.returnDate);

  return (
    <Card
      className="hover-lift animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <RankBadge rank={rank} />

          {/* Player Image */}
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
            {player.imageUrl && !player.imageUrl.includes("data:image") ? (
              <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl text-[var(--text-muted)]">
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
                  className="font-bold text-sm sm:text-base hover:underline block text-[var(--text-primary)]"
                >
                  {player.name}
                </a>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {player.position}
                </p>
              </div>
              <span className="text-sm sm:text-lg font-black shrink-0 text-[var(--accent-hot)] font-value">
                {formatValue(player.marketValue)}
              </span>
            </div>

            {/* Club & League */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
              {player.clubLogoUrl && (
                <img src={player.clubLogoUrl} alt={player.club} className="w-5 h-5 sm:w-6 sm:h-6 object-contain bg-white rounded p-0.5" />
              )}
              <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                {player.club}
              </span>
              <Badge className={cn("text-[10px] sm:text-xs flex items-center gap-1", leagueStyle.bg, leagueStyle.text)}>
                {getLeagueLogoUrl(player.league) && <img src={getLeagueLogoUrl(player.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
                {player.league}
              </Badge>
            </div>

            {/* Injury Info */}
            {(() => {
              const dur = formatInjuryDuration(player.injurySince);
              return (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm">
                  <Badge variant="destructive" className="gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{player.injury}</span>
                    {dur && <><span className="opacity-50">·</span><span>out {dur}</span></>}
                  </Badge>
                  {returnInfo && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] sm:text-xs",
                        returnInfo.imminent && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {returnInfo.label}
                    </Badge>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamInjuryCard({ team, rank, index = 0 }: { team: TeamInjuryGroup; rank: number; index?: number }) {
  const leagueStyle = getLeagueStyle(team.league);

  return (
    <Card
      className="overflow-hidden hover-lift animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <RankBadge rank={rank} />

          {/* Club Logo */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 bg-white shadow-sm">
            {team.clubLogoUrl ? (
              <img src={team.clubLogoUrl} alt={team.club} className="w-full h-full object-contain" />
            ) : (
              <div className="text-xl text-[var(--text-muted)]">?</div>
            )}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]">
                  {team.club}
                </h3>
                <Badge className={cn("mt-0.5 text-[10px] sm:text-xs flex items-center gap-1", leagueStyle.bg, leagueStyle.text)}>
                  {getLeagueLogoUrl(team.league) && <img src={getLeagueLogoUrl(team.league)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />}
                  {team.league}
                </Badge>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm sm:text-lg font-black text-[var(--accent-hot)] font-value">
                  {formatValueNum(team.totalValue)}
                </div>
                <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                  {team.count} {team.count === 1 ? "player" : "players"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player list — mobile */}
        <div className="mt-3 flex flex-col divide-y divide-[var(--border-subtle)] sm:hidden">
          {team.players.map((player) => {
            const ri = formatReturnInfo(player.returnDate);
            const dur = formatInjuryDuration(player.injurySince);
            return (
              <a
                key={player.profileUrl || player.name}
                href={player.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
              >
                {player.imageUrl && !player.imageUrl.includes("data:image") ? (
                  <img src={player.imageUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] shrink-0 flex items-center justify-center text-[10px] text-[var(--text-muted)]">?</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{player.name}</span>
                    <span className="text-xs font-bold text-[var(--accent-hot)] font-value shrink-0">{player.marketValue}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-0.5">
                    <span className="text-[var(--text-secondary)]">{player.injury}</span>
                    {dur && <><span className="opacity-40">·</span><span>out {dur}</span></>}
                    {ri && <><span className="opacity-40">·</span><span className={ri.imminent ? "text-emerald-500 font-medium" : ""}>{ri.label}</span></>}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Player rows — desktop */}
        <div className="mt-3 hidden sm:block rounded-lg border border-[var(--border-subtle)] overflow-hidden divide-y divide-[var(--border-subtle)]">
          {team.players.map((player) => {
            const ri = formatReturnInfo(player.returnDate);
            const dur = formatInjuryDuration(player.injurySince);
            return (
              <a
                key={player.profileUrl || player.name}
                href={player.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-card-hover)] transition-colors duration-150 odd:bg-[var(--bg-elevated)]/40"
              >
                {player.imageUrl && !player.imageUrl.includes("data:image") ? (
                  <img src={player.imageUrl} alt={player.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] shrink-0 flex items-center justify-center text-[10px] text-[var(--text-muted)]">?</div>
                )}
                <span className="text-sm font-medium text-[var(--text-primary)] w-36 lg:w-44 truncate shrink-0">{player.name}</span>
                <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">
                  {player.injury}{dur && <span className="text-[var(--text-muted)]"> · out {dur}</span>}
                </span>
                {ri && (
                  <span className={cn(
                    "text-xs shrink-0",
                    ri.imminent ? "text-emerald-500 font-medium" : "text-[var(--text-muted)]"
                  )}>
                    {ri.label}
                  </span>
                )}
                <span className="text-sm font-bold text-[var(--accent-hot)] font-value shrink-0 w-16 text-right">{player.marketValue}</span>
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function InjuryTypeCard({ group, rank, index = 0 }: { group: InjuryTypeGroup; rank: number; index?: number }) {
  return (
    <Collapsible
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <CollapsibleTrigger className="flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 w-full cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors rounded-xl">
        <RankBadge rank={rank} />
        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] flex-1 text-left">{group.injury}</h3>
        <span className="text-[10px] sm:text-xs text-[var(--text-muted)] tabular-nums shrink-0">{group.count}</span>
        <span className="text-xs sm:text-sm font-bold text-[var(--accent-hot)] font-value shrink-0">{formatValueNum(group.totalValue)}</span>
        <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform [[data-state=open]>&]:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-1.5">
          {group.players.map((player) => {
            const ri = formatReturnInfo(player.returnDate);
            const dur = formatInjuryDuration(player.injurySince);
            return (
              <a
                key={player.profileUrl || player.name}
                href={player.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] sm:text-xs hover:bg-[var(--bg-card-hover)] transition-colors duration-150 bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
              >
                {player.imageUrl && !player.imageUrl.includes("data:image") && (
                  <img src={player.imageUrl} alt={player.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" />
                )}
                <span className="text-[var(--text-primary)]">{player.name}</span>
                <span className="text-[var(--text-secondary)]">{player.club}</span>
                <span className="text-[var(--accent-hot)] font-medium font-value">{player.marketValue}</span>
                {dur && <span className="text-[var(--text-muted)]">out {dur}</span>}
                {ri && <span className={cn("font-medium", ri.imminent ? "text-emerald-500" : "text-[var(--text-muted)]")}>{ri.label}</span>}
              </a>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function StatCell({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
      <div className={cn(
        "text-sm sm:text-base font-bold",
        accent ? "text-[var(--accent-hot)] font-value" : "text-[var(--text-primary)]"
      )}>
        {value}
      </div>
      {sub && <div className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{sub}</div>}
    </div>
  );
}

function StatsHighlights({
  teamGroups,
  injuryTypeGroups,
}: {
  players: InjuredPlayer[];
  teamGroups: TeamInjuryGroup[];
  injuryTypeGroups: InjuryTypeGroup[];
}) {
  const hardestHitClub = teamGroups[0] ?? null;

  const topInjury = injuryTypeGroups[0] ?? null;

  return (
    <div className="mb-6 sm:mb-8 animate-scale-in rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-[var(--border-subtle)]">
        {/* Hardest Hit Club */}
        {hardestHitClub && (
          <div className="p-3 sm:p-4 flex items-start gap-2.5">
            {hardestHitClub.clubLogoUrl && (
              <img src={hardestHitClub.clubLogoUrl} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain rounded-sm bg-white p-px shrink-0 mt-3" />
            )}
            <StatCell
              label="Hardest Hit"
              value={hardestHitClub.club}
              sub={`${formatValueNum(hardestHitClub.totalValue)} · ${hardestHitClub.count} out`}
            />
          </div>
        )}

        {/* Most Common Injury */}
        {topInjury && (
          <div className="p-3 sm:p-4">
            <StatCell
              label="Most Common"
              value={topInjury.injury}
              sub={`${topInjury.count} players · ${formatValueNum(topInjury.totalValue)}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type GroupSort = "value" | "count";

export function InjuredUI({ initialData, failedLeagues = [] }: InjuredUIProps) {
  const { params, update } = useQueryParams("/injured");
  const { results: extraResults, pending } = useProgressiveFetch(failedLeagues, fetchLeagueInjured);

  const tab = params.get("tab") || "players";
  const leagueFilter = params.get("league") || "all";
  const clubFilter = params.get("club") || "";
  const teamSort: GroupSort = params.get("tSort") === "count" ? "count" : "value";
  const injurySort: GroupSort = params.get("iSort") === "count" ? "count" : "value";

  const allPlayers = useMemo(() => {
    if (extraResults.length === 0) return initialData.players;
    return [...initialData.players, ...extraResults.flat()].sort((a, b) => b.marketValueNum - a.marketValueNum);
  }, [initialData.players, extraResults]);

  const leagueOptions = useMemo(() => Array.from(new Set(allPlayers.map((p) => p.league).filter(Boolean))).sort(), [allPlayers]);

  const players = useMemo(
    () => filterPlayersByLeagueAndClub(allPlayers, leagueFilter, clubFilter),
    [allPlayers, leagueFilter, clubFilter]
  );

  const teamGroups = useMemo(() => {
    const groupMap = new Map<string, TeamInjuryGroup>();

    players.forEach((player) => {
      const existing = groupMap.get(player.club);
      if (existing) {
        existing.players.push(player);
        existing.totalValue += player.marketValueNum;
        existing.count++;
      } else {
        groupMap.set(player.club, {
          club: player.club,
          clubLogoUrl: player.clubLogoUrl,
          league: player.league,
          players: [player],
          totalValue: player.marketValueNum,
          count: 1,
        });
      }
    });

    const groups = Array.from(groupMap.values());
    return teamSort === "count"
      ? groups.sort((a, b) => b.count - a.count || b.totalValue - a.totalValue)
      : groups.sort((a, b) => b.totalValue - a.totalValue);
  }, [players, teamSort]);

  const injuryTypeGroups = useMemo(() => {
    const groupMap = new Map<string, InjuryTypeGroup>();

    players.forEach((player) => {
      const key = player.injury || "Unknown";
      const existing = groupMap.get(key);
      if (existing) {
        existing.players.push(player);
        existing.totalValue += player.marketValueNum;
        existing.count++;
      } else {
        groupMap.set(key, {
          injury: key,
          players: [player],
          totalValue: player.marketValueNum,
          count: 1,
        });
      }
    });

    const groups = Array.from(groupMap.values());
    return injurySort === "count"
      ? groups.sort((a, b) => b.count - a.count || b.totalValue - a.totalValue)
      : groups.sort((a, b) => b.totalValue - a.totalValue);
  }, [players, injurySort]);

  return (
    <>
      {pending.size > 0 && (
        <p className="text-[11px] mb-4 animate-pulse" style={{ color: "var(--accent-blue)" }}>
          Retrying {pending.size} failed {pending.size === 1 ? "league" : "leagues"}...
        </p>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 sm:mb-6">
        <SelectNative value={leagueFilter} onChange={(e) => update({ league: e.target.value === "all" ? null : e.target.value })} className="h-10">
          <option value="all">All leagues</option>
          {leagueOptions.map((league) => (<option key={league} value={league}>{league}</option>))}
        </SelectNative>
        <DebouncedInput value={clubFilter} onChange={(value) => update({ club: value || null })} placeholder="Filter by club" className="h-10" />
      </div>

      {/* Stats Highlights */}
      <StatsHighlights
        players={players}
        teamGroups={teamGroups}
        injuryTypeGroups={injuryTypeGroups}
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => update({ tab: v === "players" ? null : v })} className="w-full">
        <TabsList className="mb-4 sm:mb-6">
          <TabsTrigger value="players">All Players</TabsTrigger>
          <TabsTrigger value="teams">By Team</TabsTrigger>
          <TabsTrigger value="injuries">By Injury</TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {players.map((player, idx) => (
              <PlayerCard key={`${player.name}-${player.club}`} player={player} rank={idx + 1} index={idx} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <SortToggle value={teamSort} onChange={(v) => update({ tSort: v === "value" ? null : v })} />
          <div className="grid grid-cols-1 gap-3">
            {teamGroups.map((team, idx) => (
              <TeamInjuryCard key={team.club} team={team} rank={idx + 1} index={idx} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="injuries">
          <SortToggle value={injurySort} onChange={(v) => update({ iSort: v === "value" ? null : v })} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {injuryTypeGroups.map((group, idx) => (
              <InjuryTypeCard key={group.injury} group={group} rank={idx + 1} index={idx} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function SortToggle({ value, onChange }: { value: GroupSort; onChange: (v: GroupSort) => void }) {
  return (
    <div className="flex gap-1 mb-3 text-xs">
      <button
        type="button"
        onClick={() => onChange("value")}
        className={cn(
          "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
          value === "value"
            ? "bg-[var(--accent-hot)]/15 text-[var(--accent-hot)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
      >
        Total value
      </button>
      <button
        type="button"
        onClick={() => onChange("count")}
        className={cn(
          "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
          value === "count"
            ? "bg-[var(--accent-hot)]/15 text-[var(--accent-hot)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        )}
      >
        Most players
      </button>
    </div>
  );
}
