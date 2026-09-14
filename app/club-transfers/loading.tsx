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

export default function Loading() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* The overview: best business, worst business, the money. */}
      <div className="space-y-6">
        {["Best business", "Worst business"].map((title) => (
          <section key={title}>
            <Skeleton className="h-4 w-28" />
            <Cards count={5} className={`mt-3 ${FIVE_ACROSS}`} />
          </section>
        ))}
        {/* The money: its seasons toggle, the cash cards, and the note under them. */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-44 rounded-lg" />
          </div>
          <Skeleton className="mt-2 h-3 w-48" />
          <Cards count={4} className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4" />
          <Skeleton className="mt-3 h-3 w-72 max-w-full" />
        </section>
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
  );
}
