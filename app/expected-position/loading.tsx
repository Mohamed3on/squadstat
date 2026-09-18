import { Skeleton } from "@/components/ui/skeleton";

// One row of TeamGapBars: points gap, crest, then name, manager and context.
function GapRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
      <div className="flex w-12 shrink-0 justify-end sm:w-14">
        <Skeleton className="h-6 w-9 sm:h-7 sm:w-10" />
      </div>
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-44 max-w-full sm:h-5" />
        <Skeleton className="h-3 w-36 sm:h-4" />
        <Skeleton className="h-3 w-52 max-w-full" />
      </div>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="space-y-3">
      <div className="hidden items-center gap-3 md:flex">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-5 w-8 rounded-full" />
        <div className="h-px flex-1 bg-border-subtle" />
      </div>
      <div className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <GapRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      {/* League filter: crests on phones, crest and name from 640px */}
      <div className="mb-4 flex flex-wrap gap-2 sm:mb-6">
        <Skeleton className="h-10 w-12 rounded-lg sm:h-9 sm:w-28" />
        {["sm:w-40", "sm:w-26", "sm:w-34", "sm:w-26", "sm:w-26"].map((w, i) => (
          <Skeleton key={i} className={`h-10 w-10 rounded-lg sm:h-9 ${w}`} />
        ))}
      </div>

      {/* Phones: the Overperformers / Underperformers rail, then one column */}
      <Skeleton className="mb-4 h-10 w-full rounded-lg md:hidden" />
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <ColumnSkeleton />
        <div className="hidden md:block">
          <ColumnSkeleton />
        </div>
      </div>
    </>
  );
}
