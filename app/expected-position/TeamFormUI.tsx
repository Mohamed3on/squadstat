"use client";

import { useMemo } from "react";
import type { TeamFormEntry } from "@/app/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LEAGUES, canonicalLeagueName, getLeagueLogoUrl } from "@/lib/leagues";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { splitPerformers } from "@/lib/team-form";
import { TeamGapBars, type GapTab } from "./TeamGapBars";

export interface TeamFormResponse {
  success: boolean;
  allTeams: TeamFormEntry[];
  leagues: string[];
}

interface TeamFormUIProps {
  initialData: TeamFormResponse;
  formLeaders?: Record<string, { type: "top" | "bottom"; count: number }>;
}

const CHIP =
  "h-10 sm:h-9 rounded-lg text-sm font-semibold transition-colors duration-150 border border-border-subtle active:scale-[0.97]";

// Phones get one row of crests, the names appearing from 640px: the five marks
// read faster than the words (the header strip made the same call), and six
// wrapping chips took three rows on a phone.
function LeagueFilter({
  selectedLeague,
  onValueChange,
}: {
  selectedLeague: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={selectedLeague}
      onValueChange={(value) => onValueChange(value || "all")}
      aria-label="Filter by league"
      className="mb-4 flex flex-wrap gap-2 sm:mb-6"
    >
      <ToggleGroupItem
        value="all"
        className={`${CHIP} px-3 sm:px-4 text-text-muted hover:text-text-secondary hover:bg-card/50 data-[state=on]:bg-card data-[state=on]:border-accent-blue data-[state=on]:text-accent-blue data-[state=on]:shadow-[0_0_12px_rgba(88,166,255,0.2)]`}
      >
        <span className="sm:hidden">All</span>
        <span className="hidden sm:inline">All Leagues</span>
      </ToggleGroupItem>

      {LEAGUES.map((league) => (
        <ToggleGroupItem
          key={league.code}
          value={league.name}
          aria-label={league.name}
          className={`${CHIP} flex items-center gap-2 px-2.5 sm:px-4 text-text-secondary hover:text-text-primary hover:bg-card-hover`}
          style={
            selectedLeague === league.name
              ? {
                  backgroundColor: league.hex,
                  borderColor: league.hex,
                  color: league.textOnBg === "text-black" ? "#000" : "#fff",
                  boxShadow: `0 0 12px ${league.hex}40`,
                }
              : undefined
          }
        >
          <img
            src={getLeagueLogoUrl(league.name)}
            alt=""
            className="h-5 w-5 rounded-sm bg-white p-px object-contain sm:h-4 sm:w-4"
          />
          <span className="hidden sm:inline">{league.name}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function TeamFormUI({ initialData, formLeaders }: TeamFormUIProps) {
  const data = initialData;
  const { params, update, replace } = useQueryParams("/expected-position");
  const requestedLeague = canonicalLeagueName(params.get("league") ?? "");
  const selectedLeague =
    requestedLeague && LEAGUES.some((league) => league.name === requestedLeague)
      ? requestedLeague
      : "all";
  // In the URL so a phone that goes into a team and comes back lands on the same list.
  const tab: GapTab = params.get("tab") === "under" ? "under" : "over";

  const { overperformers: filteredOverperformers, underperformers: filteredUnderperformers } =
    useMemo(() => {
      const teams =
        selectedLeague === "all"
          ? data.allTeams
          : data.allTeams.filter((t) => t.league === selectedLeague);
      return splitPerformers(teams, selectedLeague === "all" ? 20 : undefined);
    }, [data.allTeams, selectedLeague]);

  return (
    <>
      <LeagueFilter
        selectedLeague={selectedLeague}
        onValueChange={(value) => update({ league: value === "all" ? null : value })}
      />
      <TeamGapBars
        overperformers={filteredOverperformers}
        underperformers={filteredUnderperformers}
        formLeaders={formLeaders}
        tab={tab}
        onTabChange={(next) => replace({ tab: next === "under" ? "under" : null })}
      />
    </>
  );
}
