import { Skeleton } from "@/components/ui/skeleton";

// The feed panel's placeholder: the same flat panel, title line and divided rows as
// FeedPanel in app/page.tsx, so nothing shifts when the data streams in.
function FeedPanelSkeleton({
  rows,
  withDescription = false,
  className = "",
}: {
  rows: number;
  withDescription?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border-subtle bg-elevated ${className}`}
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <Skeleton className="h-4 w-32" />
        {withDescription && <Skeleton className="mt-1.5 h-3 w-48" />}
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return <FeedPanelSkeleton rows={5} />;
}

export function StandoutsGridSkeleton() {
  return (
    <div className="columns-1 gap-4 lg:columns-2">
      {Array.from({ length: 4 }, (_, i) => (
        <FeedPanelSkeleton key={i} rows={3} withDescription className="mb-4 break-inside-avoid" />
      ))}
    </div>
  );
}
