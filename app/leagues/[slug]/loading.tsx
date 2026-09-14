import { Skeleton } from "@/components/ui/skeleton";
import { DetailHeroSkeleton, DetailPageShellSkeleton } from "@/components/DetailHero";
import { TableSkeleton } from "@/components/TableSkeleton";

function SectionHeaderSkeleton() {
  return (
    <div className="mb-5 space-y-2">
      <Skeleton className="h-7 w-40 sm:h-8" />
      <Skeleton className="h-4 w-full max-w-sm" />
    </div>
  );
}

// A club at each end of the score, as in MatchdayTable.
function MatchRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex flex-1 items-center justify-end gap-2.5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-7 shrink-0 rounded" />
      </div>
      <Skeleton className="h-6 w-10 shrink-0 rounded-md" />
      <div className="flex flex-1 items-center gap-2.5">
        <Skeleton className="h-7 w-7 shrink-0 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/** Streams while the league's standings, matchday and players resolve — the hero,
 *  then the table beside the matchday and top players. */
export default function Loading() {
  return (
    <DetailPageShellSkeleton>
      <DetailHeroSkeleton>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Skeleton className="h-24 w-24 shrink-0 rounded-[1.5rem] sm:h-28 sm:w-28" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-9 w-64 max-w-full sm:h-10" />
            <div className="mt-4 flex flex-wrap gap-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        {/* Switch league */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-5 lg:col-span-2">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </DetailHeroSkeleton>

      <div className="mt-14 grid gap-12 sm:mt-16 xl:grid-cols-[1.15fr_1fr] xl:grid-rows-[auto_1fr] xl:gap-10">
        <section className="min-w-0 xl:row-span-2">
          <SectionHeaderSkeleton />
          <TableSkeleton>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-4 w-5 shrink-0" />
                <Skeleton className="h-7 w-7 shrink-0 rounded" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-4 w-6" />
                <Skeleton className="h-4 w-16 sm:w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
            ))}
          </TableSkeleton>
        </section>

        <section className="min-w-0">
          <SectionHeaderSkeleton />
          <TableSkeleton>
            {Array.from({ length: 10 }).map((_, i) => (
              <MatchRowSkeleton key={i} />
            ))}
          </TableSkeleton>
        </section>

        <section className="min-w-0">
          <SectionHeaderSkeleton />
          <Skeleton className="mb-4 h-8 w-56 rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl sm:h-16" />
            ))}
          </div>
        </section>
      </div>
    </DetailPageShellSkeleton>
  );
}
