import { Skeleton } from "@/components/ui/skeleton";

// A team card from the aggregated panel: crest, name and league, the badge, the
// categories it tops, then the manager line. The card is Deep Navy-Charcoal, so its
// placeholders take the lighter Slate Charcoal to stay visible.
function TeamCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-elevated p-3 sm:p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl bg-card sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32 bg-card sm:h-6" />
          <Skeleton className="h-4 w-40 max-w-full bg-card" />
        </div>
        <Skeleton className="h-6 w-16 shrink-0 rounded-full bg-card" />
      </div>
      <div className="mt-3 space-y-1.5">
        <Skeleton className="h-4 w-4/5 bg-card" />
        <Skeleton className="h-4 w-3/5 bg-card" />
        <Skeleton className="h-4 w-2/3 bg-card" />
      </div>
      <div className="mt-3 border-t border-border-subtle pt-2 sm:pt-3">
        <Skeleton className="h-4 w-48 max-w-full bg-card" />
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <Skeleton className="h-7 w-7 rounded-lg sm:h-8 sm:w-8" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="space-y-2 sm:space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Aggregated Form Leaders */}
      <div className="rounded-2xl border border-border-subtle bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-56 sm:h-7" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>

      {/* "By Number of Matches" collapsed heading */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-1 h-6 rounded-full" />
        <Skeleton className="h-5 w-44" />
        <Skeleton className="w-5 h-5 rounded" />
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
    </div>
  );
}
