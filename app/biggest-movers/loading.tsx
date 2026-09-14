import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// One card per repeat mover: the player, then a bar for each update they moved in.
// Same Card and CardContent as RepeatMoverCard, so the padding matches at every width.
function MoverCardSkeleton({ bars }: { bars: number }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg sm:h-16 sm:w-16" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-36 sm:h-6" />
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Skeleton className="h-6 w-16 sm:h-7" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <div className="border-t border-border-subtle bg-elevated/50 px-3 py-2.5 sm:px-4 sm:py-3">
          <Skeleton className="mb-2 h-3 w-40" />
          <div className="space-y-1.5">
            {Array.from({ length: bars }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                {/* "Jan 2023" wraps onto two lines in the phone's narrower column */}
                <div className="w-14 shrink-0 space-y-1 sm:w-16">
                  <Skeleton className="h-3 w-8 sm:w-12" />
                  <Skeleton className="h-3 w-9 sm:hidden" />
                </div>
                <Skeleton className="h-5 flex-1 sm:h-6" />
                <Skeleton className="h-3 w-10 shrink-0 sm:w-12" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <>
      <Skeleton className="mb-4 h-9 w-72 rounded-lg sm:mb-6 sm:h-10 sm:w-80" />
      <div className="mt-4">
        <div className="mb-3 space-y-1.5">
          <Skeleton className="h-5 w-28 sm:h-6" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="space-y-3">
          {[5, 2, 3, 3].map((bars, i) => (
            <MoverCardSkeleton key={i} bars={bars} />
          ))}
        </div>
      </div>
    </>
  );
}
