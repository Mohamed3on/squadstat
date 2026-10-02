"use client";

import { useMemo, useState } from "react";
import { NationalityFlag } from "@/components/NationalityFlag";
import { PlayerListRow } from "@/components/PlayerListRow";
import { SortToggle } from "@/components/SortToggle";
import { getPlayerDetailHref } from "@/lib/format";
import type { MinutesValuePlayer } from "@/app/types";
import { npga } from "@/lib/stats-toggles";
import { getShortPosition } from "@/lib/positions";
import { EmptyNote } from "@/components/EmptyNote";

type SortKey = "value" | "mins" | "games" | "ga" | "pen";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "value", label: "Value" },
  { key: "ga", label: "npG+A" },
  { key: "mins", label: "Mins" },
  { key: "games", label: "Games" },
  { key: "pen", label: "Pen" },
];

function SquadPlayerRow({
  player,
  rank,
  sortBy,
  showClub,
}: {
  player: MinutesValuePlayer;
  rank: number;
  sortBy: SortKey;
  showClub: boolean;
}) {
  const playerNpga = npga(player);
  const penGoals = player.penaltyGoals ?? 0;
  const penMisses = player.penaltyMisses ?? 0;
  const penAttempts = penGoals + penMisses;

  return (
    <PlayerListRow
      href={getPlayerDetailHref(player.playerId)}
      rank={rank}
      name={player.name}
      imageUrl={player.imageUrl}
      detail={
        <>
          {showClub && player.clubLogoUrl && (
            <img
              src={player.clubLogoUrl}
              alt={player.club}
              title={player.club}
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
          )}
          <NationalityFlag url={player.nationalityFlagUrl} name={player.nationality} />
          <span className="truncate">
            <span title={player.position}>{getShortPosition(player.position)}</span> · {player.age}y
            · {player.marketValueDisplay}
          </span>
        </>
      }
    >
      <div className="hidden shrink-0 items-center gap-4 text-right sm:flex">
        <div>
          <p className="text-sm font-value text-accent-hot">{playerNpga}</p>
          <p className="text-[10px] text-text-muted">npG+A</p>
        </div>
        <div>
          <p className="text-sm font-value text-text-primary">{player.goals}</p>
          <p className="text-[10px] text-text-muted">goals</p>
        </div>
        <div>
          <p className="text-sm font-value text-text-primary">{player.assists}</p>
          <p className="text-[10px] text-text-muted">assists</p>
        </div>
        {sortBy === "pen" && penAttempts > 0 && (
          <div>
            <p className="text-sm font-value text-text-primary">
              {penGoals}/{penAttempts}
            </p>
            <p className="text-[10px] text-text-muted">pen</p>
          </div>
        )}
        <div>
          <p className="text-sm font-value text-accent-blue">
            {player.minutes.toLocaleString()}&apos;
          </p>
          <p className="text-[10px] text-text-muted">mins</p>
        </div>
      </div>
      {/* Mobile stats */}
      <div className="flex shrink-0 items-center gap-2 text-right sm:hidden">
        <span className="text-sm font-value text-accent-hot">{playerNpga}</span>
        <span className="text-xs font-value text-text-muted">
          {player.minutes.toLocaleString()}&apos;
        </span>
      </div>
    </PlayerListRow>
  );
}

export function SquadTab({
  squad,
  defaultSort = "value",
  emptyLabel = "No tracked players found for this club.",
  limit,
  showClub = false,
}: {
  squad: MinutesValuePlayer[];
  defaultSort?: SortKey;
  emptyLabel?: string;
  limit?: number;
  showClub?: boolean;
}) {
  const [sortBy, setSortBy] = useState<SortKey>(defaultSort);
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const list = [...squad];
    list.sort((a, b) => {
      let diff: number;
      switch (sortBy) {
        case "mins":
          diff = b.minutes - a.minutes;
          break;
        case "games":
          diff = b.totalMatches - a.totalMatches;
          break;
        case "ga":
          diff = npga(b) - npga(a) || a.minutes - b.minutes;
          break;
        case "pen":
          diff = (b.penaltyGoals ?? 0) - (a.penaltyGoals ?? 0);
          break;
        default:
          diff = b.marketValue - a.marketValue;
      }
      return sortAsc ? -diff : diff;
    });
    return limit ? list.slice(0, limit) : list;
  }, [squad, sortBy, sortAsc, limit]);

  if (squad.length === 0) {
    return <EmptyNote>{emptyLabel}</EmptyNote>;
  }

  return (
    <div className="space-y-4">
      <SortToggle
        options={SORT_OPTIONS}
        value={sortBy}
        asc={sortAsc}
        onChange={(key, asc) => {
          setSortBy(key);
          setSortAsc(asc);
        }}
      />

      <div className="space-y-3">
        {sorted.map((player, i) => (
          <SquadPlayerRow
            key={player.playerId}
            player={player}
            rank={i + 1}
            sortBy={sortBy}
            showClub={showClub}
          />
        ))}
      </div>
    </div>
  );
}
