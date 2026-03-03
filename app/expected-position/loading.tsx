import { Skeleton } from "@/components/ui/skeleton";

function SkeletonCard() {
  return (
    <div className="p-3 sm:p-4 rounded-xl bg-card border border-border-subtle">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
        <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 sm:h-5 w-2/5" />
          <Skeleton className="h-3 sm:h-4 w-1/4" />
        </div>
        <Skeleton className="h-6 sm:h-7 w-12" />
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-t-border-subtle">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <>
      {/* League filter skeleton */}
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="flex flex-wrap gap-2">
          {["w-24", "w-28", "w-24", "w-20", "w-28", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-9 ${w} rounded-lg`} />
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
