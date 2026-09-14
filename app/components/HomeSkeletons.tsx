import { Skeleton } from "@/components/ui/skeleton";

// The feed panel's placeholder: the same flat panel, title line and divided rows as
// FeedPanel in app/page.tsx, so nothing shifts when the data streams in. The panel is
// Deep Navy-Charcoal like the placeholders' default, so they take Slate Charcoal instead.
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
        <Skeleton className="h-4 w-32 bg-card" />
        {withDescription && <Skeleton className="mt-1.5 h-3 w-48 bg-card" />}
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-card" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-24 bg-card" />
              <Skeleton className="h-4 w-40 bg-card" />
              <Skeleton className="h-3 w-56 max-w-full bg-card" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return <FeedPanelSkeleton rows={8} />;
}

export function StandoutsGridSkeleton() {
  return (
    <div className="columns-1 gap-4 lg:columns-2">
      {Array.from({ length: 6 }, (_, i) => (
        <FeedPanelSkeleton key={i} rows={2} withDescription className="mb-4 break-inside-avoid" />
      ))}
    </div>
  );
}
