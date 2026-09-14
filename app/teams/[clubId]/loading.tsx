import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeroSkeleton, DetailPageShellSkeleton } from "@/components/DetailHero";
import { TableSkeleton } from "@/components/TableSkeleton";

export default function TeamDetailLoading() {
  return (
    <DetailPageShellSkeleton>
      <DetailHeroSkeleton>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 shrink-0 rounded-[1.5rem] sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-12 rounded-md" />
            </div>
            <Skeleton className="mt-4 h-9 w-64 max-w-full sm:h-10" />
            {/* Manager, their PPG, and the club's best and worst */}
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
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

        {/* Signals: movers, form and the transfer window */}
        <div className="col-span-full flex flex-wrap gap-2.5">
          {["w-40", "w-44", "w-52", "w-56"].map((w, i) => (
            <Skeleton key={i} className={`h-6 ${w} rounded-full`} />
          ))}
        </div>
      </DetailHeroSkeleton>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border-subtle bg-card">
        <div className="px-5 py-4 sm:px-6">
          <Skeleton className="h-9 w-full max-w-md rounded-lg sm:h-10" />
        </div>

        {/* Recent Form: the four match windows */}
        <div className="p-5 sm:p-6">
          <TableSkeleton>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-5 w-14" />
                <div className="ml-auto flex gap-4 sm:gap-8">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton
                      key={j}
                      className={j > 3 ? "hidden h-5 w-10 sm:block" : "h-5 w-6 sm:w-10"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TableSkeleton>
        </div>
      </div>
    </DetailPageShellSkeleton>
  );
}
