import type { ReactNode } from "react";

/** The Table frame from components/ui/table while its data loads: the hairline box
 *  and dim header strip, with the caller's placeholder rows divided beneath. */
export function TableSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <div className="h-8 border-b border-border-subtle bg-black/20" />
      <div className="divide-y divide-border-subtle/50">{children}</div>
    </div>
  );
}
