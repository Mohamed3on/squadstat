"use client";

import type { QualifiedTeam, ManagerInfo } from "@/app/types";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagerPPGBadge, ManagerSkeleton } from "./ManagerPPGBadge";
import { getLeagueLogoUrl } from "@/lib/leagues";

interface TeamCardProps {
  team: QualifiedTeam;
  type: "top" | "bottom";
  manager?: ManagerInfo | null;
  managerLoading?: boolean;
  compact?: boolean;
}

export function TeamCardSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="p-3 bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-[var(--bg-elevated)]">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mt-3" />
      <Skeleton className="h-4 w-32 mt-3" />
    </Card>
  );
}

export function TeamCard({ team, type, manager, managerLoading, compact }: TeamCardProps) {
  const showManager = manager !== undefined || managerLoading;
  const isTop = type === "top";
  const accentColor = isTop ? "var(--accent-hot)" : "var(--accent-cold)";
  const glowColor = isTop ? "var(--accent-hot-glow)" : "var(--accent-cold-glow)";

  if (compact) {
    return (
      <Card className="p-3 bg-[var(--bg-elevated)] transition-transform duration-200 hover:scale-[1.02]">
        <div className="flex items-center gap-3">
          {team.logoUrl && (
            <Image
              src={team.logoUrl}
              alt={team.name}
              width={28}
              height={28}
              sizes="28px"
              className="object-contain"
              unoptimized
            />
          )}
          <div className="flex-1 min-w-0">
            <div
              className="font-semibold text-sm truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {team.clubUrl ? (
                <a
                  href={`https://www.transfermarkt.com${team.clubUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: accentColor }}
                >
                  {team.name}
                </a>
              ) : (
                team.name
              )}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {team.leaguePosition}{team.leaguePosition === 1 ? "st" : team.leaguePosition === 2 ? "nd" : team.leaguePosition === 3 ? "rd" : "th"} • {team.stats.points} pts • GD: {team.stats.goalDiff > 0 ? "+" : ""}
              {team.stats.goalDiff}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-3 sm:p-4 bg-[var(--bg-elevated)] transition-transform duration-200 hover:scale-[1.01]"
      style={{
        borderColor: accentColor,
        boxShadow: `0 0 20px ${glowColor}`,
      }}
    >
      {/* Team header with logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        {team.logoUrl && (
          <div
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--bg-card)" }}
          >
            <Image
              src={team.logoUrl}
              alt={team.name}
              width={40}
              height={40}
              sizes="(max-width: 640px) 32px, 40px"
              className="object-contain w-8 h-8 sm:w-10 sm:h-10"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base sm:text-lg truncate" style={{ color: "var(--text-primary)" }}>
            {team.clubUrl ? (
              <a
                href={`https://www.transfermarkt.com${team.clubUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline transition-colors"
                style={{ color: accentColor }}
              >
                {team.name}
              </a>
            ) : (
              team.name
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm truncate" style={{ color: "var(--text-secondary)" }}>
            {getLeagueLogoUrl(team.league) && <img src={getLeagueLogoUrl(team.league)} alt="" className="w-4 h-4 object-contain shrink-0 rounded-sm bg-white/90 p-px" />}
            {team.league} • {team.leaguePosition}{team.leaguePosition === 1 ? "st" : team.leaguePosition === 2 ? "nd" : team.leaguePosition === 3 ? "rd" : "th"}
          </div>
        </div>
      </div>

      {/* Criteria tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
        {team.criteria.map((c) => (
          <Badge
            key={c}
            variant="outline"
            className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs"
            style={{
              background: glowColor,
              color: accentColor,
              borderColor: accentColor,
            }}
          >
            {c}
          </Badge>
        ))}
      </div>

      {/* Stats */}
      <div
        className="text-[10px] sm:text-xs mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-4"
        style={{ color: "var(--text-muted)" }}
      >
        <span>
          <span className="font-bold" style={{ color: "var(--text-secondary)" }}>
            {team.stats.points}
          </span>{" "}
          pts
        </span>
        <span>
          GD:{" "}
          <span
            className="font-bold"
            style={{
              color:
                team.stats.goalDiff > 0
                  ? "var(--accent-hot)"
                  : team.stats.goalDiff < 0
                  ? "var(--accent-cold)"
                  : "var(--text-secondary)",
            }}
          >
            {team.stats.goalDiff > 0 ? "+" : ""}
            {team.stats.goalDiff}
          </span>
        </span>
        <span>GF: {team.stats.goalsScored}</span>
        <span>GA: {team.stats.goalsConceded}</span>
      </div>

      {/* Manager info */}
      {showManager && team.clubId && (
        <div
          className="mt-3 sm:mt-4 pt-2 sm:pt-3 text-xs sm:text-sm"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {managerLoading ? (
            <ManagerSkeleton />
          ) : manager ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span style={{ color: "var(--text-muted)" }}>Manager:</span>
              <a
                href={manager.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline transition-colors truncate"
                style={{ color: "var(--accent-blue)" }}
              >
                {manager.name}
              </a>
              <ManagerPPGBadge manager={manager} />
            </div>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Manager info not available</span>
          )}
        </div>
      )}
    </Card>
  );
}
