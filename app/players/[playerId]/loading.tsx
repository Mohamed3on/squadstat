import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeroSkeleton, DetailPageShellSkeleton } from "@/components/DetailHero";
import { TableSkeleton } from "@/components/TableSkeleton";

// A row of the Season table: the label, then its figures on the right.
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <Skeleton className="h-24 w-24 shrink-0 rounded-[1.5rem] sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-9 w-64 max-w-full sm:h-10" />
            <Skeleton className="mt-2 h-5 w-48" />
            {/* Status chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-4 w-56" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 sm:gap-x-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          {/* Price vs output verdict */}
          <div className="space-y-1.5 border-t border-border-subtle pt-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-72 max-w-full" />
          </div>
        </div>
      </DetailHeroSkeleton>

      {/* Form: section head, the Season table, then the latest matches */}
      <div className="mt-12 space-y-5 sm:mt-16">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <TableSkeleton>
              {Array.from({ length: 3 }).map((_, i) => (
                <StatRowSkeleton key={i} cells={4} />
              ))}
            </TableSkeleton>
          </div>
        </div>
        <div className="space-y-3 pt-3">
          <Skeleton className="h-4 w-28" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </DetailPageShellSkeleton>
  );
}
