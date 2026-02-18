import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <Skeleton className="h-8 sm:h-9 w-48" />
        <Skeleton className="h-4 w-80 mt-1 sm:mt-2" />
      </div>

      {/* Mode toggle */}
      <Skeleton className="h-10 w-36 rounded-lg mb-4" />

      {/* Search bar */}
      <Skeleton className="h-11 w-full rounded-xl mb-6 sm:mb-8" />

      {/* Tabs */}
      <Skeleton className="h-10 w-full rounded-xl mb-6" />

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", opacity: 1 - i * 0.1 }}
          >
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-14" />
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
