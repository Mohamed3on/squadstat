import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeroSkeleton, DetailPageShellSkeleton } from "@/components/DetailHero";

export default function NationalTeamLoading() {
  return (
    <DetailPageShellSkeleton>
      <DetailHeroSkeleton>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 shrink-0 rounded-[1.5rem] sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            {/* Confederation and Nations League */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-md" />
              <Skeleton className="h-6 w-40 rounded-md" />
            </div>
            <Skeleton className="mt-4 h-9 w-56 max-w-full sm:h-10" />
            {/* Titles, then the manager, his PPG, and the nation's best and worst */}
            <Skeleton className="mt-2 h-3 w-72 max-w-full" />
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="mt-5 h-10 w-36" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </DetailHeroSkeleton>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border-subtle bg-card">
        <div className="px-5 py-4 sm:px-6">
          <Skeleton className="h-9 w-56 rounded-lg sm:h-10" />
        </div>

        {/* The squad: its note, the sort row, then players */}
        <div className="space-y-4 p-5 sm:p-6">
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-8 w-64 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </DetailPageShellSkeleton>
  );
}
