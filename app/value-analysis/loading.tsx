import { Skeleton } from "@/components/ui/skeleton";

// A discovery card: rank, headshot, name and details, the figures on the right from
// 640px up, then the footer line under a hairline.
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-card p-3 sm:p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="h-7 w-7 shrink-0 rounded-lg sm:h-8 sm:w-8" />
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36 sm:h-5" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-14" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-14" />
        </div>
      </div>
      <div className="mt-2 space-y-1.5 border-t border-t-border-subtle pt-2 sm:mt-3 sm:pt-3">
        <Skeleton className="h-4 w-full sm:w-64" />
        <Skeleton className="h-4 w-full sm:hidden" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <Skeleton className="h-8 sm:h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl mt-1 sm:mt-2" />
      </div>

      {/* Mode toggle, then "Include penalties" */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Skeleton className="h-9 w-52 rounded-lg" />
        <div className="w-px h-6 bg-border-subtle" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-11 w-full rounded-xl mb-6 sm:mb-8" />

      {/* Overpriced / Bargains tabs */}
      <Skeleton className="h-9 sm:h-10 w-full rounded-lg mb-6" />

      {/* Section heading, then sort and filters */}
      <div className="mt-4 flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-7 w-9 rounded-md" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-8 w-80 max-w-full rounded-lg" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
