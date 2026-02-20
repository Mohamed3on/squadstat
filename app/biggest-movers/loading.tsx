import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function MoverCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Skeleton className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 sm:h-5 w-2/5" />
            <Skeleton className="h-3 sm:h-4 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Loading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <MoverCardSkeleton key={i} />
      ))}
    </div>
  );
}
