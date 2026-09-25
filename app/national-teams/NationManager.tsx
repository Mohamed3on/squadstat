"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { ManagerRecord, ManagerSection } from "@/app/components/ManagerPPGBadge";
import { HoverTip } from "@/components/HoverTip";
import { Skeleton } from "@/components/ui/skeleton";
import { managerQueryOptions } from "@/lib/hooks/use-manager-query";

/**
 * A nation's manager, scraped only once someone opens the tip — two hundred-odd
 * nations can't all be fetched up front — and named in the trigger from then on.
 * Competitive games only, as on the World Cup pages: Transfermarkt's own PPG
 * counts friendlies.
 */
export function NationManager({ teamId, nation }: { teamId: string; nation: string }) {
  const [wanted, setWanted] = useState(false);
  const { data: manager, isError } = useQuery({
    ...managerQueryOptions(teamId, true),
    enabled: wanted,
  });

  return (
    <HoverTip
      onOpenChange={(open) => open && setWanted(true)}
      className="max-w-xs"
      trigger={
        <button
          type="button"
          aria-label={manager ? undefined : `${nation}'s manager`}
          className="inline-flex max-w-full cursor-help items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary"
        >
          <UserRound className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          {manager && <span className="truncate">{manager.name}</span>}
        </button>
      }
    >
      {manager ? (
        <div className="space-y-2 text-xs sm:text-sm">
          {/* The same line as everywhere else — tinted when he's the best or the worst —
              with the record its badge would otherwise hide behind a tooltip. */}
          <ManagerSection manager={manager} tip={false} />
          <ManagerRecord manager={manager} />
        </div>
      ) : manager === null || isError ? (
        <p className="text-xs sm:text-sm text-text-muted">Manager data unavailable</p>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      )}
    </HoverTip>
  );
}
