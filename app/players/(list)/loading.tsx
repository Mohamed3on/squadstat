import { Skeleton } from "@/components/ui/skeleton";

// PlayersUI's PlayerCard: rank, headshot, name over position and club, the figures on the
// right from 640px up, and the stat tray beneath below it.
function PlayerRowSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-card p-2.5 sm:p-3">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <Skeleton className="h-6 w-6 shrink-0 rounded-md sm:h-7 sm:w-7" />
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg sm:h-10 sm:w-10" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <Skeleton className="mt-2 h-9 w-full rounded-lg sm:hidden" />
    </div>
  );
}

export default function Loading() {
  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <Skeleton className="h-8 sm:h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-xl mt-1 sm:mt-2" />
        {/* ClubDuos: the best duo and trio lines */}
        <Skeleton className="mt-3 h-40 w-full rounded-lg sm:h-18" />
      </div>

      {/* "All players" label and count */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-1 h-5 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-10 rounded-md" />
      </div>

      {/* Sort and form window, then position */}
      <div className="flex flex-col gap-2 mb-5 sm:flex-row sm:items-center">
        <Skeleton className="h-9 w-80 max-w-full rounded-lg sm:h-7" />
        <Skeleton className="h-9 w-44 rounded-lg sm:h-7" />
      </div>
      <Skeleton className="h-9 w-40 rounded-lg mb-5 sm:h-7" />

      {/* League, club and nationality pickers; "More filters" opens by default from 640px */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="hidden flex-wrap gap-2 sm:flex">
          {["w-14", "w-32", "w-24", "w-20", "w-28", "w-16", "w-32"].map((w, i) => (
            <Skeleton key={i} className={`h-8 ${w} rounded-lg`} />
          ))}
        </div>
      </div>

      {/* Players */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <PlayerRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
