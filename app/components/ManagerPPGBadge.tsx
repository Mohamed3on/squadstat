"use client";

import type { ManagerInfo } from "@/app/types";
import { HoverTip } from "@/components/HoverTip";
import { Skeleton } from "@/components/ui/skeleton";

interface ManagerPPGBadgeProps {
  manager: ManagerInfo;
}

export function ManagerSackedBadge({ manager }: ManagerPPGBadgeProps) {
  if (manager.isCurrentManager) return null;
  return (
    <span className="shrink-0 rounded bg-accent-cold/10 px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-accent-cold">
      Sacked
    </span>
  );
}

export function ManagerSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted">Manager:</span>
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="h-5 w-14 rounded" />
    </div>
  );
}

/** `tip={false}` drops the badge's own tooltip, for a section already inside one. */
export function ManagerSection({ manager, tip }: ManagerPPGBadgeProps & { tip?: boolean }) {
  return (
    <div className="@container flex items-center gap-x-2">
      <div className="inline-flex min-w-0 items-center gap-1.5">
        <span className="shrink-0 text-text-muted">Manager:</span>
        <a
          href={manager.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open manager profile on Transfermarkt"
          className={`min-w-0 truncate font-semibold transition-colors hover:underline ${manager.isCurrentManager ? "text-accent-blue" : "text-text-muted"}`}
        >
          {manager.name}
        </a>
        <ManagerSackedBadge manager={manager} />
      </div>
      <ManagerPPGBadge manager={manager} tip={tip} />
    </div>
  );
}

/** Where the PPG ranks among managers since 1992 with as many games, or null when it isn't ranked. */
function ppgStanding(manager: ManagerInfo) {
  if (
    manager.ppg === null ||
    manager.ppgRank === undefined ||
    manager.totalComparableManagers === undefined
  )
    return null;

  const isOnly = manager.totalComparableManagers === 1;
  const isBest = manager.ppgRank === 1 && !isOnly;
  const isWorst = manager.ppgRank === manager.totalComparableManagers && !isBest && !isOnly;
  return { isOnly, isBest, isWorst };
}

export function ManagerPPGBadge({ manager, tip = true }: ManagerPPGBadgeProps & { tip?: boolean }) {
  if (manager.matches === 0) {
    return (
      <span className="shrink-0 text-[10px] @md:text-xs text-text-muted">
        <span className="@md:hidden">New</span>
        <span className="hidden @md:inline">New manager</span>
      </span>
    );
  }

  const standing = ppgStanding(manager);

  if (!standing) {
    return (
      <span className="shrink-0 text-[10px] @md:text-xs text-text-secondary">
        <span className="font-value">{manager.matches}</span>{" "}
        {manager.matches === 1 ? "game" : "games"}
      </span>
    );
  }

  const { isOnly, isBest, isWorst } = standing;

  // Quiet, uniform token by default; a faint tint flags only the best/worst.
  // The row's own ▲/▼ delta stays the loud signal — this is a secondary annotation.
  const tone = isBest
    ? "bg-accent-hot/10 text-accent-hot"
    : isWorst
      ? "bg-accent-cold/10 text-accent-cold"
      : "bg-elevated text-text-secondary";

  const badge = (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] @md:text-xs ${tip ? "cursor-help transition-opacity hover:opacity-80" : ""} ${tone}`}
    >
      {isOnly && (
        <span aria-hidden title="Only manager with this many games since 1992">
          👑
        </span>
      )}
      <span className="font-value">{manager.ppg!.toFixed(2)}</span>
      <span className="hidden @md:inline">PPG</span>
      {!isOnly && (
        <span className="font-value opacity-70">
          {manager.ppgRank}/{manager.totalComparableManagers}
        </span>
      )}
    </span>
  );

  if (!tip) return badge;

  return (
    <HoverTip trigger={badge} className="max-w-[280px] sm:max-w-xs">
      <ManagerRecord manager={manager} />
    </HoverTip>
  );
}

/**
 * The manager's PPG and where it ranks since 1992, with the best and worst
 * beside it — or nothing, when there's no PPG to rank.
 */
export function ManagerRecord({ manager }: ManagerPPGBadgeProps) {
  const standing = manager.matches > 0 ? ppgStanding(manager) : null;
  if (!standing) return null;

  const { isOnly, isBest, isWorst } = standing;

  return (
    <div className="space-y-2 text-xs sm:text-sm">
      <div className="text-text-secondary">
        <span className="font-value text-text-primary">{manager.ppg!.toFixed(2)}</span> PPG over{" "}
        <span className="font-value text-text-primary">{manager.matches}</span> games
        {isOnly ? (
          <> — only manager with that many since 1992</>
        ) : (
          <>
            {" "}
            — {isBest ? "best" : isWorst ? "worst" : `#${manager.ppgRank}`} of{" "}
            <span className="font-value text-text-primary">{manager.totalComparableManagers}</span>{" "}
            since 1992
          </>
        )}
      </div>
      {!isOnly && manager.bestManager && manager.worstManager && (
        <div className="space-y-1.5 border-t border-t-border-subtle pt-2">
          <div className="flex items-start gap-1.5">
            <span>🏆</span>
            <div>
              <a
                href={manager.bestManager.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-hot hover:underline"
              >
                {manager.bestManager.name}
              </a>
              <span className="ml-1 text-text-muted">
                <span className="font-value">{manager.bestManager.ppg.toFixed(2)}</span> PPG ·{" "}
                {manager.bestManager.years}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <span>⚠️</span>
            <div>
              <a
                href={manager.worstManager.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-cold hover:underline"
              >
                {manager.worstManager.name}
              </a>
              <span className="ml-1 text-text-muted">
                <span className="font-value">{manager.worstManager.ppg.toFixed(2)}</span> PPG ·{" "}
                {manager.worstManager.years}
              </span>
            </div>
          </div>
        </div>
      )}
      {manager.officialOnly && (
        <div className="border-t border-t-border-subtle pt-2 text-[11px] text-text-muted">
          Competitive matches only — friendlies excluded
        </div>
      )}
    </div>
  );
}
