"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const POS_ABBREV: Record<string, string> = {
  "Centre-Forward": "CF", "Centre-Back": "CB", "Central Midfield": "CM",
  "Right Winger": "RW", "Left Winger": "LW", "Right-Back": "RB", "Left-Back": "LB",
  "Attacking Midfield": "AM", "Defensive Midfield": "DM", "Second Striker": "SS",
  "Left Midfield": "LM", "Right Midfield": "RM", "Goalkeeper": "GK",
};

/**
 * Shows a player's position with progressive disclosure when the most-played
 * position this season differs from the registered one.
 *
 * When they differ: registered is struck through, played position shown beside it,
 * with a tooltip explaining the change.
 */
export function PositionDisplay({ position, playedPosition, abbreviated }: {
  position: string;
  playedPosition?: string;
  /** Force abbreviated display (used outside responsive containers) */
  abbreviated?: boolean;
}) {
  const changed = playedPosition && playedPosition !== position;

  if (!changed) {
    if (abbreviated) return <span className="shrink-0">{POS_ABBREV[position] || position}</span>;
    return (
      <>
        <span className="sm:hidden shrink-0">{POS_ABBREV[position] || position}</span>
        <span className="hidden sm:inline shrink-0">{position}</span>
      </>
    );
  }

  const content = abbreviated ? (
    <span className="shrink-0 cursor-help">
      <span className="line-through decoration-text-muted opacity-60">{POS_ABBREV[position] || position}</span>
      {" "}
      <span>{POS_ABBREV[playedPosition] || playedPosition}</span>
    </span>
  ) : (
    <span className="shrink-0 cursor-help">
      <span className="sm:hidden line-through decoration-text-muted opacity-60">{POS_ABBREV[position] || position}</span>
      <span className="hidden sm:inline line-through decoration-text-muted opacity-60">{position}</span>
      {" "}
      <span className="sm:hidden">{POS_ABBREV[playedPosition] || playedPosition}</span>
      <span className="hidden sm:inline">{playedPosition}</span>
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">Played most this season as {playedPosition}</TooltipContent>
    </Tooltip>
  );
}

export { POS_ABBREV };
