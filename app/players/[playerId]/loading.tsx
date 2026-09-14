import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeroSkeleton, DetailPageShellSkeleton } from "@/components/DetailHero";
import { TableSkeleton } from "@/components/TableSkeleton";

// A row of the Rankings or Season table: the label, then its figures on the right.
function StatRowSkeleton({ cells }: { cells: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="h-5 w-24" />
      <div className="ml-auto flex gap-6">
        {Array.from({ length: cells }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-8" />
        ))}
      </div>
    </div>
  );
}

export default function PlayerDetailLoading() {
  return (
    <DetailPageShellSkeleton>
      <DetailHeroSkeleton>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 shrink-0 rounded-[1.5rem] sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-9 w-64 max-w-full sm:h-10" />
            <Skeleton className="mt-3 h-5 w-48" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-44" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Contract and value-trend chips */}
        <div className="col-span-full flex flex-wrap gap-2.5">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </DetailHeroSkeleton>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border-subtle bg-card">
        <div className="px-5 py-4 sm:px-6">
          <Skeleton className="h-9 w-60 rounded-lg sm:h-10 sm:w-64" />
        </div>

        {/* Snapshot: Rankings beside Season, then the latest matches */}
        <div className="space-y-8 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <TableSkeleton>
                {Array.from({ length: 8 }).map((_, i) => (
                  <StatRowSkeleton key={i} cells={4} />
                ))}
              </TableSkeleton>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <TableSkeleton>
                {Array.from({ length: 3 }).map((_, i) => (
                  <StatRowSkeleton key={i} cells={4} />
                ))}
              </TableSkeleton>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-28 rounded-lg" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DetailPageShellSkeleton>
  );
}
