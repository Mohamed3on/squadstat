import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section>
        <Skeleton className="h-9 w-60 rounded-lg sm:h-10 sm:w-64" />
        {/* The heading, and the measure control that sits beside it. */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-8 w-40 shrink-0 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-8 w-24 rounded-lg" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg sm:h-28" />
          ))}
        </div>
      </section>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
