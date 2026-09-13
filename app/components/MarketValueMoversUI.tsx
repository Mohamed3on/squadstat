"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMarketValue, getPlayerDetailHref } from "@/lib/format";
import { ClubLink } from "@/components/ClubLink";
import { InfoTip } from "@/app/components/InfoTip";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { MarketValueMover, MarketValueMoversResult } from "@/app/types";

type Variant = "losers" | "winners";

const VARIANT_CONFIG = {
  losers: {
    color: "text-accent-cold-soft",
    barBg: "bg-accent-cold/20",
    highlightBg: "bg-accent-cold/5",
    highlightRing: "ring-accent-cold/20",
    prefix: "-",
    sectionTitle: "In Freefall",
    sectionSubtitle: "Consistently lost value across recent updates",
    barLabel: "Value lost since each date",
    breakdownTitle: "All Movers by Update Date",
    sign: "-",
  },
  winners: {
    color: "text-accent-hot",
    barBg: "bg-accent-hot/20",
    highlightBg: "bg-accent-hot/5",
    highlightRing: "ring-accent-hot/20",
    prefix: "+",
    sectionTitle: "On the Rise",
    sectionSubtitle: "Consistently gained value across recent updates",
    barLabel: "Value gained since each date",
    breakdownTitle: "All Movers by Update Date",
    sign: "+",
  },
} as const;

function formatPeriodLabel(date: string): string {
  const [year, month] = date.split("-");
  return month === "01" ? `Jan ${year}` : `Jul ${year}`;
}

function RepeatMoverCard({
  appearances,
  variant,
}: {
  appearances: MarketValueMover[];
  variant: Variant;
}) {
  const cfg = VARIANT_CONFIG[variant];
  const sorted = [...appearances].sort((a, b) => b.period.localeCompare(a.period));
  const latest = sorted[0];
  const maxAbsChange = Math.max(...appearances.map((a) => a.absoluteChange));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <PlayerAvatar
            imageUrl={latest.imageUrl}
            name={latest.name || "?"}
            size="lg"
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={getPlayerDetailHref(latest.playerId)}
                className="text-base sm:text-lg font-pixel text-text-primary hover:text-accent-hot transition-colors"
              >
                {latest.name}
              </Link>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 shrink-0 font-value">
                {sorted.length}×
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <ClubLink
                club={latest.club}
                clubLogoUrl={latest.clubLogoUrl}
                className="text-xs sm:text-sm text-text-secondary"
                logoSize="w-4 h-4 sm:w-5 sm:h-5"
              />
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">{latest.position}</span>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">{latest.age}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg sm:text-xl font-value text-text-primary">
              {formatMarketValue(latest.currentValue)}
            </div>
            <div className="text-[10px] sm:text-xs text-text-muted">current value</div>
          </div>
        </div>

        <div className="border-t border-border-subtle bg-elevated/50 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] sm:text-xs font-medium text-text-muted uppercase tracking-wider">
              {cfg.barLabel}
            </span>
          </div>
          <div className="space-y-1.5">
            {sorted.map((entry) => {
              const barWidth = maxAbsChange > 0 ? (entry.absoluteChange / maxAbsChange) * 100 : 0;
              return (
                <div key={entry.period} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-text-muted w-14 sm:w-16 shrink-0 font-mono">
                    {formatPeriodLabel(entry.period)}
                  </span>
                  <div className="flex-1 h-5 sm:h-6 bg-background rounded overflow-hidden relative">
                    <div
                      className={cn("h-full rounded transition-all", cfg.barBg)}
                      style={{ width: `${Math.max(barWidth, 4)}%` }}
                    />
                    <span
                      className={cn(
                        "absolute inset-0 flex items-center px-2 text-xs font-value",
                        cfg.color,
                      )}
                    >
                      {cfg.prefix}
                      {formatMarketValue(entry.absoluteChange)}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-text-muted w-10 sm:w-12 text-right shrink-0 font-value">
                    {variant === "losers" ? "-" : "+"}
                    {entry.relativeChange.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodPlayerRow({
  player,
  isRepeat,
  variant,
}: {
  player: MarketValueMover;
  isRepeat: boolean;
  variant: Variant;
}) {
  const cfg = VARIANT_CONFIG[variant];
  return (
    <div
      className={cn(
        "flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2",
        isRepeat && cn(cfg.highlightBg, "-mx-2 px-2 sm:-mx-3 sm:px-3 rounded"),
      )}
    >
      <PlayerAvatar
        imageUrl={player.imageUrl}
        name={player.name || "?"}
        size="sm"
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link
            href={getPlayerDetailHref(player.playerId)}
            className={cn(
              "text-sm font-semibold truncate transition-colors hover:text-accent-hot",
              isRepeat ? cfg.color : "text-text-primary",
            )}
          >
            {player.name}
          </Link>
          {isRepeat && (
            <Badge
              variant={variant === "losers" ? "destructive" : "default"}
              className="text-[9px] px-1 py-0 h-3.5 shrink-0"
              title={`Value ${variant === "losers" ? "dropped" : "rose"} in 2+ consecutive Transfermarkt updates`}
            >
              Repeat mover
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <ClubLink
            club={player.club}
            clubLogoUrl={player.clubLogoUrl}
            className="text-xs text-text-muted truncate"
          />
          {player.age > 0 && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">{player.age}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={cn("text-sm font-value", cfg.color)}>
          {cfg.prefix}
          {formatMarketValue(player.absoluteChange)}
        </div>
        <div className="text-[10px] text-text-muted font-value">
          {variant === "losers" ? "-" : "+"}
          {player.relativeChange.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

function PeriodSection({
  period,
  repeatIds,
  variant,
}: {
  period: { date: string; movers: MarketValueMover[] };
  repeatIds: Set<string>;
  variant: Variant;
}) {
  const cfg = VARIANT_CONFIG[variant];
  const sorted = [...period.movers].sort((a, b) => b.absoluteChange - a.absoluteChange);
  const hasRepeats = sorted.some((m) => repeatIds.has(m.playerId));

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className={cn("text-sm font-bold", hasRepeats ? cfg.color : "text-text-primary")}>
          {formatPeriodLabel(period.date)}
        </h3>
        <Badge variant="outline" className="text-[10px] h-4">
          {period.movers.length}
        </Badge>
      </div>
      <Card>
        <CardContent className="px-2 py-1.5 sm:px-3 sm:py-2 divide-y divide-border-subtle">
          {sorted.map((m) => (
            <PeriodPlayerRow
              key={m.playerId}
              player={m}
              isRepeat={repeatIds.has(m.playerId)}
              variant={variant}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface MarketValueMoversUIProps {
  data: MarketValueMoversResult;
  variant: Variant;
}

export function MarketValueMoversUI({ data, variant }: MarketValueMoversUIProps) {
  const cfg = VARIANT_CONFIG[variant];
  const { repeatMovers, periods } = data;

  const repeatIds = useMemo(() => {
    const ids = new Set<string>();
    for (const appearances of repeatMovers) {
      if (appearances.length > 0) ids.add(appearances[0].playerId);
    }
    return ids;
  }, [repeatMovers]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {repeatMovers.length > 0 && (
        <section>
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm sm:text-base font-pixel font-bold text-text-primary">
                {cfg.sectionTitle}
              </h2>
              <span className="text-xs text-text-muted font-value">{repeatMovers.length}</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
              <span>{cfg.sectionSubtitle}</span>
              <InfoTip>
                <p>
                  These players have had their Transfermarkt market value{" "}
                  {variant === "losers" ? "reduced" : "increased"} in{" "}
                  <strong>2 or more consecutive</strong> valuation updates.
                </p>
                <p className="mt-1.5">
                  Transfermarkt updates market values periodically throughout the season. The bar
                  chart shows the change at each update date.
                </p>
                <p className="mt-1.5">
                  Ranked by total absolute change — bigger swings rank higher.
                </p>
              </InfoTip>
            </p>
          </div>
          <div className="space-y-3">
            {repeatMovers.map((appearances) => (
              <RepeatMoverCard
                key={appearances[0].playerId}
                appearances={appearances}
                variant={variant}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm sm:text-base font-pixel font-bold text-text-secondary">
              {cfg.breakdownTitle}
            </h2>
            <span className="text-xs text-text-muted font-value">{periods.length} dates</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">Top movers since each date</p>
        </div>
        <div className="space-y-4">
          {periods.map((period) => (
            <PeriodSection
              key={period.date}
              period={period}
              repeatIds={repeatIds}
              variant={variant}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
