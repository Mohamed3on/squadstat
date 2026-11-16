import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeroSkeleton, DetailPageShellSkeleton } from "@/components/DetailHero";
import { TableSkeleton } from "@/components/TableSkeleton";

// A row of the match log: crest and opponent, then the result and figures on the right.
function MatchRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-5 w-4" />
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

      {/* Form: section head, then the match log */}
      <div className="mt-12 max-w-4xl space-y-5 sm:mt-16">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
        <TableSkeleton>
          {Array.from({ length: 10 }).map((_, i) => (
            <MatchRowSkeleton key={i} />
          ))}
        </TableSkeleton>
      </div>
    </DetailPageShellSkeleton>
  );
}
