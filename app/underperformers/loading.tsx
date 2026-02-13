import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </div>
        <Skeleton className="h-10 w-48 rounded-lg mb-4" />
        <Skeleton className="h-11 w-full rounded-xl mb-6 sm:mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", opacity: 1 - i * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="h-10 w-14" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
