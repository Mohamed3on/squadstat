import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Hero card skeleton */}
      <div className="rounded-2xl p-4 sm:p-6 border border-border-subtle bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)]">
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

      {/* "By Match Window" collapsed heading skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-1 h-6 rounded-full" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="w-5 h-5 rounded" />
        <div className="flex-1 h-px bg-border-subtle" />
      </div>
    </div>
  );
}
