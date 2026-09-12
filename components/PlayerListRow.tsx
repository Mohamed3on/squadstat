import Link from "next/link";
import type { ReactNode } from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";

/**
 * A player as one row of a ranked list: rank, headshot, name over a detail line,
 * and whatever figures that list is about on the right. The whole row links to
 * the player.
 */
export function PlayerListRow({
  href,
  rank,
  name,
  imageUrl,
  detail,
  children,
}: {
  href: string;
  rank: number;
  name: string;
  imageUrl?: string;
  detail: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-border-subtle bg-elevated p-2.5 transition-colors hover:border-border-medium hover:bg-card-hover sm:gap-3"
    >
      {/* At 320px the fixed furniture left the name and market value only 66px of the
          254px row. The rank chip is the one piece the list's own order already tells
          you, so it goes first on the narrowest screens. */}
      <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/20 text-xs font-value text-text-muted sm:flex">
        {rank}
      </div>
      <PlayerAvatar
        imageUrl={imageUrl}
        name={name}
        size="sm"
        className="border border-border-subtle"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text-primary">{name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">{detail}</p>
      </div>
      {children}
    </Link>
  );
}
