import { FeedPanelSkeleton } from "@/components/FeedPanel";

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
