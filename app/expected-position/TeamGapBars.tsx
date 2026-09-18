"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import type { ManagerInfo, TeamFormEntry } from "@/app/types";
import { ManagerSection, ManagerSkeleton } from "@/app/components/ManagerPPGBadge";
import { FormLeaderPill } from "@/components/FormLeaderPill";
import { LeagueBadge } from "@/components/LeagueBadge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatValueStr, getTeamDetailHref, ordinal } from "@/lib/format";
import { useManagersMap } from "@/lib/hooks/use-manager-query";
import { cn } from "@/lib/utils";

export type GapTab = "over" | "under";

interface GapBarRowProps {
  team: TeamFormEntry;
  formLeader?: { type: "top" | "bottom"; count: number };
  manager?: ManagerInfo | null;
  managerLoading?: boolean;
}

function GapBarRow({ team, formLeader, manager, managerLoading }: GapBarRowProps) {
  const over = team.deltaPts >= 0;
  const valueStr = formatValueStr(team.marketValue);

  return (
    <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-card-hover transition-colors">
      {/* Points gap — pixel scoreboard, the hero of the row */}
      <div
        className={`w-12 sm:w-14 shrink-0 text-right font-pixel text-2xl sm:text-3xl leading-none ${over ? "text-accent-hot" : "text-accent-cold"}`}
      >
        {over ? "+" : "−"}
        {Math.abs(team.deltaPts)}
      </div>

      {/* Club logo */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 bg-white shadow-sm">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="w-full h-full object-contain" />
        ) : (
          <div className="text-text-muted">?</div>
        )}
      </div>

      {/* Team, manager, value context */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Badges drop to a second line rather than breaking mid-word beside a long name. */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <Link
            href={getTeamDetailHref(team.clubId)}
            className="max-w-full truncate font-semibold text-sm sm:text-base text-text-primary hover:underline"
          >
            {team.name}
          </Link>
          <LeagueBadge league={team.league} />
          {formLeader && <FormLeaderPill type={formLeader.type} />}
        </div>

        {managerLoading ? (
          <div className="text-[11px] sm:text-sm">
            <ManagerSkeleton />
          </div>
        ) : (
          manager && (
            <div className="text-[11px] sm:text-sm text-text-muted animate-fade-in">
              <ManagerSection manager={manager} />
            </div>
          )
        )}

        {/* "per player" waits for 640px: on a phone it pushed the value off the end of the line. */}
        <div className="truncate text-[11px] sm:text-xs text-text-muted">
          <span className="font-value">{ordinal(team.leaguePosition)}</span> now,{" "}
          <span className="font-value">{ordinal(team.marketValueRank)}</span> by value
          <span className="hidden sm:inline"> per player</span>
          {valueStr !== "-" && <span className="text-text-muted/60"> · {valueStr}</span>}
        </div>
      </div>
    </div>
  );
}

function PerformerColumn({
  teams,
  type,
  shown,
  formLeaders,
  managersMap,
  loadingSet,
}: {
  teams: TeamFormEntry[];
  type: GapTab;
  shown: boolean;
  formLeaders?: Record<string, { type: "top" | "bottom"; count: number }>;
  managersMap: Record<string, ManagerInfo | null>;
  loadingSet: Set<string>;
}) {
  const over = type === "over";
  return (
    // Phones show one column at a time and the rail names it, so the heading
    // only appears once both columns are side by side.
    <div className={cn("space-y-3", !shown && "hidden md:block")}>
      <div className="hidden md:flex items-center gap-3">
        <h2
          className={`text-lg sm:text-xl font-pixel flex items-center gap-2 shrink-0 ${over ? "text-accent-hot" : "text-accent-cold"}`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            {over ? (
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {over ? "Overperformers" : "Underperformers"}
        </h2>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${over ? "bg-accent-hot/10 text-accent-hot/70" : "bg-accent-cold/10 text-accent-cold/70"}`}
        >
          {teams.length}
        </span>
        <div
          className={`flex-1 h-px bg-gradient-to-r ${over ? "from-accent-hot/30" : "from-accent-cold/30"}`}
        />
      </div>

      <div className="rounded-xl border border-border-subtle bg-card divide-y divide-border-subtle overflow-hidden">
        {teams.map((team) => (
          <GapBarRow
            key={`${team.clubId}-${team.league}`}
            team={team}
            formLeader={formLeaders?.[team.clubId]}
            manager={managersMap[team.clubId]}
            managerLoading={loadingSet.has(team.clubId)}
          />
        ))}
      </div>
    </div>
  );
}

const SEGMENT =
  "h-full flex-1 rounded-md text-xs font-medium hover:bg-card/50 data-[state=on]:bg-card data-[state=on]:shadow-sm";

export function TeamGapBars({
  overperformers,
  underperformers,
  formLeaders,
  tab,
  onTabChange,
}: {
  overperformers: TeamFormEntry[];
  underperformers: TeamFormEntry[];
  formLeaders?: Record<string, { type: "top" | "bottom"; count: number }>;
  tab: GapTab;
  onTabChange: (tab: GapTab) => void;
}) {
  const allTeams = useMemo(
    () => [...overperformers, ...underperformers],
    [overperformers, underperformers],
  );
  const clubIds = useMemo(
    () => [...new Set(allTeams.map((t) => t.clubId).filter(Boolean))],
    [allTeams],
  );
  const { managersMap, loadingSet } = useManagersMap(clubIds);

  // A switch from deep in one list would leave the reader partway down the
  // other, so it also returns to the top of the rail.
  const rootRef = useRef<HTMLDivElement>(null);
  const switchTab = (next: string) => {
    if (next !== "over" && next !== "under") return;
    onTabChange(next);
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start" });
  };

  return (
    <div ref={rootRef} className="scroll-mt-14 animate-fade-in">
      {/* Phones: twenty rows a side is too far to scroll past, so the lists take
          turns. The rail sticks under the header, keeping the other list one
          tap away from anywhere. */}
      <div className="sticky top-14 z-40 -mx-3 mb-4 border-b border-border-subtle bg-black/90 px-3 py-2 backdrop-blur-xl sm:-mx-4 sm:px-4 md:hidden">
        <ToggleGroup
          type="single"
          value={tab}
          onValueChange={switchTab}
          aria-label="Teams to list"
          className="flex h-10 w-full items-center rounded-lg bg-elevated p-1 text-text-muted"
        >
          <ToggleGroupItem value="over" className={`${SEGMENT} data-[state=on]:text-accent-hot`}>
            Overperformers
            <span className="ml-1.5 font-value opacity-60">{overperformers.length}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="under" className={`${SEGMENT} data-[state=on]:text-accent-cold`}>
            Underperformers
            <span className="ml-1.5 font-value opacity-60">{underperformers.length}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <PerformerColumn
          teams={overperformers}
          type="over"
          shown={tab === "over"}
          formLeaders={formLeaders}
          managersMap={managersMap}
          loadingSet={loadingSet}
        />
        <PerformerColumn
          teams={underperformers}
          type="under"
          shown={tab === "under"}
          formLeaders={formLeaders}
          managersMap={managersMap}
          loadingSet={loadingSet}
        />
      </div>
    </div>
  );
}
