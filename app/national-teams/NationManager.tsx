"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import type { ManagerInfo } from "@/app/types";
import { ManagerRecord, ManagerSection } from "@/app/components/ManagerPPGBadge";
import { HoverTip } from "@/components/HoverTip";
import { Skeleton } from "@/components/ui/skeleton";
import { managerQueryOptions } from "@/lib/hooks/use-manager-query";

/** The trigger: an icon, then the manager's name once it has loaded. */
function ManagerButton({
  nation,
  name,
  ...props
}: { nation: string; name?: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={name ? undefined : `${nation}'s manager`}
      className="inline-flex max-w-full cursor-help items-center gap-1.5 text-text-secondary transition-colors hover:text-text-primary"
      {...props}
    >
      <UserRound className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      {name && <span className="truncate">{name}</span>}
    </button>
  );
}

/**
 * A nation's manager, scraped only once someone opens the tip — two hundred-odd
 * nations can't all be fetched up front — and named in the trigger from then on.
 * Competitive games only, as on the World Cup pages: Transfermarkt's own PPG
 * counts friendlies.
 *
 * Nor can every row afford a tooltip, so the row arms one when a pointer or focus
 * first enters it. Until then it's a bare button, named from whatever the cache
 * already holds.
 */
export function NationManager({
  teamId,
  nation,
  armed,
}: {
  teamId: string;
  nation: string;
  armed: boolean;
}) {
  // Shift+Tab lands here before anything else in the row, and arming swaps in a new
  // button, so that one takes the focus back.
  const [focused, setFocused] = useState(false);
  const cached = useQueryClient().getQueryData<ManagerInfo | null>(
    managerQueryOptions(teamId, true).queryKey,
  );

  if (!armed && !focused) {
    return <ManagerButton nation={nation} name={cached?.name} onFocus={() => setFocused(true)} />;
  }
  return <ManagerTip teamId={teamId} nation={nation} refocus={focused} />;
}

function ManagerTip({
  teamId,
  nation,
  refocus,
}: {
  teamId: string;
  nation: string;
  refocus: boolean;
}) {
  const [wanted, setWanted] = useState(false);
  // After mount rather than `autoFocus`, whose focus lands mid-commit where the
  // tooltip never hears it and so never opens.
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (refocus) button.current?.focus();
  }, [refocus]);
  const { data: manager, isError } = useQuery({
    ...managerQueryOptions(teamId, true),
    enabled: wanted,
  });

  return (
    <HoverTip
      onOpenChange={(open) => open && setWanted(true)}
      className="max-w-xs"
      trigger={
        <ManagerButton
          nation={nation}
          name={manager?.name}
          ref={button}
          // A pointer that lands on the icon as it enters the row finds this button
          // swapped in beneath it. The browser tells it the pointer is over it, but
          // not that it moved, and a pointer move is all a Radix tooltip opens on.
          onPointerOver={(e) =>
            e.currentTarget.dispatchEvent(
              new PointerEvent("pointermove", {
                bubbles: true,
                pointerType: e.pointerType,
                clientX: e.clientX,
                clientY: e.clientY,
              }),
            )
          }
        />
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
