import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Cards({ count, className }: { count: number; className: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 p-3 sm:p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// As Overview's FIVE_ACROSS: the fifth card takes the whole row on a phone.
const FIVE_ACROSS =
  "grid grid-cols-2 gap-3 lg:grid-cols-5 [&>:nth-child(5)]:col-span-2 lg:[&>:nth-child(5)]:col-span-1";

/** The page's shape while its two scrapes land: the tab rail, then the value
 *  tab it opens on — best business, worst business, and the ledger. */
export default function Loading() {
  return (
    <div>
      <div className="py-2">
        <Skeleton className="h-9 w-full rounded-lg sm:h-10 sm:w-64" />
      </div>

      <div className="mt-6 space-y-8 sm:mt-8 sm:space-y-10">
        <div className="space-y-6">
          {["Best business", "Worst business"].map((title) => (
            <section key={title}>
              <Skeleton className="h-4 w-28" />
              <Cards count={5} className={`mt-3 ${FIVE_ACROSS}`} />
            </section>
          ))}
        </div>

        {/* The ledger's heading, the league picker under it, and the ledger. */}
        <section className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
