"use client";

import type { ManagerInfo } from "@/app/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface ManagerPPGBadgeProps {
  manager: ManagerInfo;
}

export function ManagerSackedBadge({ manager }: ManagerPPGBadgeProps) {
  if (manager.isCurrentManager) return null;
  return (
    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-red-500/15 text-red-500 border border-red-500/30">
      Sacked
    </span>
  );
}

export function ManagerSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--text-muted)" }}>Manager:</span>
      <Skeleton className="h-4 w-24 rounded" />
      <Skeleton className="h-4 w-16 rounded" />
      <Skeleton className="h-5 w-20 rounded" />
    </div>
  );
}

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.matchMedia("(pointer: coarse)").matches
      );
    };
    checkTouch();
  }, []);

  return isTouch;
}

export function ManagerSection({ manager }: ManagerPPGBadgeProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-2 sm:gap-y-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0" style={{ color: "var(--text-muted)" }}>Manager:</span>
        <a
          href={manager.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open manager profile on Transfermarkt"
          className="font-semibold hover:underline transition-colors truncate"
          style={{ color: manager.isCurrentManager ? "var(--accent-blue)" : "var(--text-muted)" }}
        >
          {manager.name}
        </a>
        <ManagerSackedBadge manager={manager} />
      </div>
      <ManagerPPGBadge manager={manager} />
    </div>
  );
}

export function ManagerPPGBadge({ manager }: ManagerPPGBadgeProps) {
  const isTouchDevice = useIsTouchDevice();

  if (manager.matches === 0) {
    return (
      <span
        className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs"
        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
      >
        New manager
      </span>
    );
  }

  const hasRanking =
    manager.ppg !== null &&
    manager.ppgRank !== undefined &&
    manager.totalComparableManagers !== undefined;

  if (!hasRanking) {
    return (
      <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-secondary)" }}>
        ({manager.matches} {manager.matches === 1 ? "game" : "games"})
      </span>
    );
  }

  const isOnly = manager.totalComparableManagers === 1;
  const isBest = manager.ppgRank === 1 && !isOnly;
  const isWorst = manager.ppgRank === manager.totalComparableManagers && !isBest && !isOnly;

  const badge = (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] sm:text-xs cursor-help transition-opacity hover:opacity-80 ${isBest || isWorst || isOnly ? "font-semibold" : ""}`}
      style={{
        background: isBest
          ? "rgba(22, 163, 74, 0.15)"
          : isWorst
          ? "rgba(220, 38, 38, 0.15)"
          : isOnly
          ? "rgba(59, 130, 246, 0.15)"
          : "var(--bg-elevated)",
        color: isBest ? "#22c55e" : isWorst ? "#ef4444" : isOnly ? "#3b82f6" : "var(--text-secondary)",
        border: `1px solid ${isBest ? "rgba(22, 163, 74, 0.3)" : isWorst ? "rgba(220, 38, 38, 0.3)" : isOnly ? "rgba(59, 130, 246, 0.3)" : "var(--border-subtle)"}`,
      }}
    >
      {isBest && <span>🏆</span>}
      {isWorst && <span>⚠️</span>}
      {isOnly && <span>👑</span>}
      <span>{manager.ppg!.toFixed(2)} PPG</span>
      <span style={{ opacity: 0.7 }}>({manager.ppgRank}/{manager.totalComparableManagers})</span>
    </span>
  );

  const tooltipContent = (
    <div className="space-y-2 text-xs sm:text-sm">
      <div style={{ color: "var(--text-secondary)" }}>
        {isOnly ? (
          <>Only manager with {manager.matches}+ games since 1995</>
        ) : (
          <>
            {isBest ? "Best" : isWorst ? "Worst" : `#${manager.ppgRank}`} PPG among{" "}
            <span style={{ color: "var(--text-primary)" }}>{manager.totalComparableManagers}</span> managers
            with {manager.matches}+ games since 1995
          </>
        )}
      </div>
      {!isOnly && manager.bestManager && manager.worstManager && (
        <div
          className="pt-2 space-y-1.5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-start gap-1.5">
            <span>🏆</span>
            <div>
              <a
                href={manager.bestManager.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: "#22c55e" }}
              >
                {manager.bestManager.name}
              </a>
              <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                {manager.bestManager.ppg.toFixed(2)} PPG · {manager.bestManager.years}
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
                className="font-medium hover:underline"
                style={{ color: "#ef4444" }}
              >
                {manager.worstManager.name}
              </a>
              <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                {manager.worstManager.ppg.toFixed(2)} PPG · {manager.worstManager.years}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const contentStyles = {
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-secondary)" }}>
        ({manager.matches} {manager.matches === 1 ? "game" : "games"})
      </span>
      {isTouchDevice ? (
        <Popover>
          <PopoverTrigger asChild>{badge}</PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="center"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={16}
            className="max-w-[280px] sm:max-w-xs p-3"
            style={contentStyles}
          >
            {tooltipContent}
          </PopoverContent>
        </Popover>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="center"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={16}
            className="max-w-[280px] sm:max-w-xs p-3"
            style={contentStyles}
          >
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
