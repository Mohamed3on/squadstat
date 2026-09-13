import { Skeleton } from "@/components/ui/skeleton";

export function SnapshotRowSkeleton() {
  return (
    <div className="rounded-lg border border-border-subtle bg-card/50 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-3.5 w-16" />
      </div>
    </div>
  );
}

export function StandoutCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-card p-4 sm:p-5 break-inside-avoid mb-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="space-y-2">
        <SnapshotRowSkeleton />
        <SnapshotRowSkeleton />
        <SnapshotRowSkeleton />
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-elevated">
      <div className="border-b border-border-subtle px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StandoutsGridSkeleton() {
  return (
    <div className="columns-1 gap-4 lg:columns-2">
      <StandoutCardSkeleton />
      <StandoutCardSkeleton />
      <StandoutCardSkeleton />
      <StandoutCardSkeleton />
    </div>
  );
}
