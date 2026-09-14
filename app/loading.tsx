import { Skeleton } from "@/components/ui/skeleton";
import { StandoutsGridSkeleton, HeroCardSkeleton } from "@/app/components/HomeSkeletons";

function SectionHeadingSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-48 sm:h-9" />
        <Skeleton className="h-4 w-full max-w-md sm:h-5" />
      </div>
      {withAction && <Skeleton className="h-10 w-36 rounded-lg" />}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="pb-16 sm:pb-20">
      {/* Hero: the three-line headline, the pitch and two actions beside the highlights */}
      <section className="full-bleed relative overflow-hidden border-b border-border-subtle bg-background">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,166,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(88,166,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
          aria-hidden="true"
        />
        <div className="page-container relative py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="space-y-2.5 sm:space-y-3">
                <Skeleton className="h-9 w-3/5 sm:h-12 lg:h-15" />
                <Skeleton className="h-9 w-11/12 sm:h-12 lg:h-15" />
                <Skeleton className="h-9 w-full sm:h-12 lg:h-15" />
              </div>
              <div className="mt-5 max-w-2xl space-y-2">
                <Skeleton className="h-4 w-full sm:h-5" />
                <Skeleton className="h-4 w-4/5 sm:h-5" />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Skeleton className="h-12 w-48 rounded-lg" />
                <Skeleton className="h-12 w-48 rounded-lg" />
              </div>
            </div>

            <HeroCardSkeleton />
          </div>
        </div>
      </section>

      {/* Latest Standouts */}
      <section className="pt-12 sm:pt-16">
        <SectionHeadingSkeleton />
        <StandoutsGridSkeleton />
      </section>

      {/* Explore: one card per section */}
      <section className="pt-12 sm:pt-16">
        <SectionHeadingSkeleton withAction />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-card p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-36" />
              <div className="mt-2 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="mt-6 space-y-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-4 w-3/6" />
              </div>
              <Skeleton className="mt-5 h-4 w-32" />
            </div>
          ))}
        </div>
      </section>

      {/* Open a section */}
      <section className="pt-12 sm:pt-16">
        <div className="rounded-2xl border border-border-medium bg-card p-5 sm:p-6">
          <Skeleton className="h-7 w-40 sm:h-8" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
