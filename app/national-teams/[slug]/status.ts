import { CalendarCheck, CalendarX, CircleDashed, type LucideIcon } from "lucide-react";
import type { CallUpStatus } from "@/lib/national-teams";

/** How each outsider status looks, on its row and in the legend above the list.
 *  The two that put a player out of the picture take a colour; picked lately
 *  stays neutral. */
export const CALL_UP_STATUS: Record<
  CallUpStatus,
  { label: string; Icon: LucideIcon; chip: string; text: string }
> = {
  recent: {
    label: "Called up in the last 18 months",
    Icon: CalendarCheck,
    chip: "border-border-subtle text-text-secondary",
    text: "text-text-secondary",
  },
  lapsed: {
    label: "Not called up in 18 months",
    Icon: CalendarX,
    chip: "border-accent-cold-border bg-accent-cold-glow text-accent-cold-soft",
    text: "text-accent-cold-soft",
  },
  uncapped: {
    label: "Never capped",
    Icon: CircleDashed,
    chip: "border-accent-blue/30 bg-accent-blue/10 text-accent-blue",
    text: "text-accent-blue",
  },
};

export const CALL_UP_STATUSES = Object.keys(CALL_UP_STATUS) as CallUpStatus[];
