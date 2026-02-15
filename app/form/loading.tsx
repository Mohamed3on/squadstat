import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

function PeriodCardSkeleton({ opacity = 1 }: { opacity?: number }) {
  return (
    <Card className="rounded-2xl p-4 sm:p-6" style={{ opacity }}>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-8 sm:h-9 w-8 sm:w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
      {/* Leaders grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
      {/* Qualified teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Hero card skeleton */}
      <div
        className="rounded-2xl p-4 sm:p-6"
        style={{
          background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 sm:h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>

      {/* "By Match Window" heading skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-1 h-6 rounded-full" />
          <Skeleton className="h-5 w-36" />
        </div>
        <Skeleton className="h-4 w-80 mb-4" />
        <div className="space-y-4">
          <PeriodCardSkeleton />
          <PeriodCardSkeleton opacity={0.7} />
          <PeriodCardSkeleton opacity={0.5} />
          <PeriodCardSkeleton opacity={0.3} />
        </div>
      </div>
    </div>
  );
}
