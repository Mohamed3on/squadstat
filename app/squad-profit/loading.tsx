import { Skeleton } from "@/components/ui/skeleton";

/** Two tables, each a heading over page one of its end of the ranking. */
export default function Loading() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {[0, 1].map((t) => (
        <section key={t} className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
