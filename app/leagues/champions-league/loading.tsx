import { Skeleton } from "@/components/ui/skeleton";

/** Streams while the two Transfermarkt fetches resolve — hero, the two callout
 *  cards, then the 36-row league table. */
export default function Loading() {
  return (
    <div className="page-container py-6 sm:py-10">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-72 sm:h-12 sm:w-96" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border-subtle p-4">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-12 h-4 w-64" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-6 shrink-0" />
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-10 sm:block" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
