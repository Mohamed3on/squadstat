"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ShieldAlert } from "lucide-react";
import { NationalityFlag } from "@/components/NationalityFlag";
import { PlayerListRow } from "@/components/PlayerListRow";
import { SortToggle } from "@/components/SortToggle";
import { formatMarketValue, formatMonthYear, formatReturnInfo, ordinal } from "@/lib/format";
import type { NationPlayer } from "@/lib/national-teams";
import { getShortPosition } from "@/lib/positions";

type SortKey = "value" | "caps" | "ga" | "mins";

const OPTIONS = [
  { key: "value", label: "Value" },
  { key: "caps", label: "Caps" },
  { key: "ga", label: "npG+A" },
  { key: "mins", label: "Mins" },
] as const;

/** null for a player the site doesn't track: he sorts last whichever way round. */
const SORT: Record<SortKey, (p: NationPlayer) => number | null> = {
  value: (p) => p.marketValue,
  caps: (p) => p.caps,
  ga: (p) => p.npga,
  mins: (p) => p.minutes,
};

function Figure({
  value,
  label,
  className = "text-text-primary",
}: {
  value: number | null;
  label: string;
  className?: string;
}) {
  return (
    <div className="w-12">
      <p className={`text-sm font-value ${value === null ? "text-text-muted" : className}`}>
        {value === null ? "—" : value.toLocaleString()}
      </p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}

/** How close an outsider is to a call-up: picked in the last 18 months, capped
 *  longer ago, or never. The two that put him out of the picture take a colour. */
function callUpStatus(p: NationPlayer) {
  const month = p.lastCalledUp && formatMonthYear(p.lastCalledUp);
  if (p.inExtendedSquad) {
    return {
      label: month ? `Called up ${month}` : "Called up lately",
      short: month || "lately",
      tone: "border-border-subtle text-text-secondary",
      text: "text-text-muted",
    };
  }
  if (p.caps > 0) {
    return {
      label: month ? `Last cap ${month}` : "Not capped in 18 months",
      short: month || "18m+",
      tone: "border-accent-cold-border bg-accent-cold-glow text-accent-cold-soft",
      text: "text-accent-cold-soft",
    };
  }
  return {
    label: "Uncapped",
    short: "uncapped",
    tone: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
    text: "text-accent-blue",
  };
}

function NationPlayerRow({
  player: p,
  rank,
  nation,
}: {
  player: NationPlayer;
  rank: number;
  nation: string;
}) {
  const change = p.previousValue === null ? 0 : p.marketValue - p.previousValue;
  const back = p.injury && formatReturnInfo(p.injury.returnDate);
  const status = p.calledUp ? null : callUpStatus(p);
  return (
    <PlayerListRow
      href={p.href}
      external={!p.tracked}
      rank={rank}
      name={p.name}
      imageUrl={p.imageUrl}
      detail={
        <>
          {p.clubLogoUrl && (
            <img
              src={p.clubLogoUrl}
              alt={p.club}
              title={p.club}
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
          )}
          {p.firstNationality && (
            <NationalityFlag url={p.firstNationality.flagUrl} name={p.firstNationality.name} />
          )}
          <span className="truncate">
            <span title={p.position}>{getShortPosition(p.position)}</span>
            {p.age ? ` · ${p.age}y` : ""} ·{" "}
            <span className="font-value">{formatMarketValue(p.marketValue)}</span>
          </span>
          {change > 0 && (
            <ArrowUp
              className="h-3 w-3 shrink-0 text-accent-hot"
              aria-label={`Up from ${formatMarketValue(p.previousValue!)}`}
            />
          )}
          {change < 0 && (
            <ArrowDown
              className="h-3 w-3 shrink-0 text-accent-cold-soft"
              aria-label={`Down from ${formatMarketValue(p.previousValue!)}`}
            />
          )}
          {p.callUpPlace && (
            <span
              className="shrink-0 font-value text-text-muted"
              title={`Would be ${nation}'s ${ordinal(p.callUpPlace)} most valuable player in the call-up`}
            >
              {ordinal(p.callUpPlace)}
            </span>
          )}
          {status && (
            <span
              className={`hidden shrink-0 rounded-md border px-1.5 text-[10px] sm:inline ${status.tone}`}
            >
              {status.label}
            </span>
          )}
          {p.firstNationality && (
            <span className="shrink-0 rounded-md border border-border-subtle px-1.5 text-[10px] text-text-secondary">
              Dual national
            </span>
          )}
          {p.captain && (
            <span
              title="Captain"
              className="shrink-0 rounded-sm border border-border-medium px-1 text-[10px] leading-4 text-text-primary"
            >
              C
            </span>
          )}
          {p.injury && (
            <span
              className="inline-flex shrink-0 items-center gap-1 text-accent-cold-soft"
              title={back ? `${p.injury.name} · ${back.label}` : p.injury.name}
            >
              <ShieldAlert className="h-3 w-3" aria-label={p.injury.name} />
              <span className="hidden sm:inline">{back?.label ?? "injured"}</span>
            </span>
          )}
        </>
      }
    >
      <div className="hidden shrink-0 items-center gap-3 text-right sm:flex">
        <Figure value={p.caps} label="caps" />
        {/* Known for the extended squad only, so outsiders from the pool leave it out. */}
        {p.calledUp && <Figure value={p.goals} label="intl goals" />}
        <Figure value={p.npga} label="npG+A" className="text-accent-hot" />
        <Figure value={p.minutes} label="mins" className="text-accent-blue" />
      </div>
      <div className="flex shrink-0 items-baseline gap-2 text-right sm:hidden">
        <span
          className={`text-sm font-value ${p.npga === null ? "text-text-muted" : "text-accent-hot"}`}
        >
          {p.npga ?? "—"}
        </span>
        {status ? (
          <span className={`text-xs font-value ${status.text}`}>{status.short}</span>
        ) : (
          <span className="text-xs font-value text-text-muted">{p.caps} caps</span>
        )}
      </div>
    </PlayerListRow>
  );
}

/**
 * A nation's players as ranked rows. Players the site doesn't track carry
 * Transfermarkt's figures only and link out to their profile; outsiders show
 * where they'd rank in the call-up and how lately they were picked, if ever.
 */
export function NationPlayers({ players, nation }: { players: NationPlayer[]; nation: string }) {
  const [sortBy, setSortBy] = useState<SortKey>("value");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const of = SORT[sortBy];
    const known = players
      .filter((p) => of(p) !== null)
      .sort((a, b) => (asc ? of(a)! - of(b)! : of(b)! - of(a)!));
    return [...known, ...players.filter((p) => of(p) === null)];
  }, [players, sortBy, asc]);

  return (
    <div className="space-y-4">
      <SortToggle
        options={OPTIONS}
        value={sortBy}
        asc={asc}
        onChange={(key, nextAsc) => {
          setSortBy(key);
          setAsc(nextAsc);
        }}
      />
      <div className="space-y-3">
        {sorted.map((p, i) => (
          <NationPlayerRow key={p.playerId} player={p} rank={i + 1} nation={nation} />
        ))}
      </div>
    </div>
  );
}
