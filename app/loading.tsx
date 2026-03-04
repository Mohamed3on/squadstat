import { Skeleton } from "@/components/ui/skeleton";

function SnapshotRowSkeleton() {
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

function StandoutCardSkeleton() {
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

export default function Loading() {
  return (
    <div className="pb-16 sm:pb-20">
      {/* Hero section — static text renders instantly, skeleton only for the snapshot card */}
      <section className="full-bleed relative overflow-hidden border-b border-border-subtle bg-[radial-gradient(circle_at_14%_10%,rgba(0,255,135,0.16),transparent_40%),radial-gradient(circle_at_82%_8%,rgba(88,166,255,0.15),transparent_40%),linear-gradient(180deg,var(--bg-base),var(--bg-elevated))]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,166,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(88,166,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px]" aria-hidden="true" />
        <div className="page-container relative py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Left — static hero text placeholder */}
            <div>
              <Skeleton className="h-5 w-64 mb-5 rounded-full" />
              <Skeleton className="h-10 sm:h-14 w-full max-w-lg mb-2" />
              <Skeleton className="h-10 sm:h-14 w-3/4 max-w-md mb-5" />
              <Skeleton className="h-5 w-full max-w-md mb-7" />
              <div className="flex gap-3">
                <Skeleton className="h-11 w-40 rounded-lg" />
                <Skeleton className="h-11 w-36 rounded-lg" />
              </div>
            </div>

            {/* Right — snapshot card skeleton */}
            <div className="rounded-xl border border-border-medium bg-black/85 p-4 sm:p-6">
              <Skeleton className="h-5 w-24 rounded-full mb-3" />
              <Skeleton className="h-6 w-40 mb-1.5" />
              <Skeleton className="h-4 w-64 mb-4" />
              <Skeleton className="h-3 w-20 mb-3" />
              <div className="space-y-2">
                <SnapshotRowSkeleton />
                <SnapshotRowSkeleton />
                <SnapshotRowSkeleton />
                <SnapshotRowSkeleton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Standouts skeleton */}
      <section className="pt-12 sm:pt-16">
        <div className="mb-6">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-7 w-44 mb-1.5" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="columns-1 gap-4 lg:columns-2">
          <StandoutCardSkeleton />
          <StandoutCardSkeleton />
          <StandoutCardSkeleton />
          <StandoutCardSkeleton />
        </div>
      </section>

      {/* Core Dashboards skeleton */}
      <section className="pt-12 sm:pt-16">
        <div className="mb-6">
          <Skeleton className="h-3 w-14 mb-2" />
          <Skeleton className="h-7 w-40 mb-1.5" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-card p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-4 w-full mb-3" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
                <Skeleton className="h-3 w-3/6" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
