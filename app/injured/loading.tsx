import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// InjuredPlayerCard: rank, headshot, name and position over the value, club, then the injury.
function PlayerCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg" />
          <Skeleton className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 sm:h-5" />
                <Skeleton className="h-3 w-24 sm:h-4" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0 sm:h-6 sm:w-20" />
            </div>
            <Skeleton className="h-5 w-44 max-w-full sm:h-6" />
            <Skeleton className="h-5 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <>
      {/* League and club pickers */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Most players injured, most value sidelined, most common injury. The strip is
          Deep Navy-Charcoal, so its placeholders take the lighter Slate Charcoal. */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-elevated">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5 p-3 sm:p-4">
            <Skeleton className="h-3 w-28 bg-card" />
            <Skeleton className="h-5 w-32 bg-card" />
            <Skeleton className="h-3 w-24 bg-card" />
          </div>
        ))}
      </div>

      {/* Tabs, then the players two to a row */}
      <Skeleton className="h-9 sm:h-10 w-64 rounded-lg mb-4 sm:mb-6" />
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
