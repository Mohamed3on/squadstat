import { Skeleton } from "@/components/ui/skeleton";
import { StandoutsGridSkeleton, HeroCardSkeleton } from "@/app/components/HomeSkeletons";

export default function Loading() {
  return (
    <div className="pb-16 sm:pb-20">
      {/* Hero section — static text renders instantly, skeleton only for the snapshot card */}
      <section className="full-bleed relative overflow-hidden border-b border-border-subtle bg-background">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,166,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(88,166,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
          aria-hidden="true"
        />
        <div className="page-container relative py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Left — static hero text placeholder */}
            <div>
              <Skeleton className="h-10 sm:h-14 w-full max-w-lg mb-2" />
              <Skeleton className="h-10 sm:h-14 w-3/4 max-w-md mb-5" />
              <Skeleton className="h-5 w-full max-w-md mb-7" />
              <div className="flex gap-3">
                <Skeleton className="h-11 w-40 rounded-lg" />
                <Skeleton className="h-11 w-36 rounded-lg" />
              </div>
            </div>

            {/* Right — snapshot card skeleton */}
            <HeroCardSkeleton />
          </div>
        </div>
      </section>

      {/* Latest Standouts skeleton */}
      <section className="pt-12 sm:pt-16">
        <div className="mb-6">
          <Skeleton className="h-7 w-44 mb-1.5" />
          <Skeleton className="h-4 w-72" />
        </div>
        <StandoutsGridSkeleton />
      </section>

      {/* Explore skeleton */}
      <section className="pt-12 sm:pt-16">
        <div className="mb-6">
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
