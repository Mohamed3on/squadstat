import type { ReactNode } from "react";

/**
 * The site's empty state: a dashed box saying why there is nothing here.
 *
 * Nine places had written this exact class string out by hand — four in one
 * club page alone — which is how an empty state ends up subtly different on the
 * tab next door.
 */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-subtle bg-elevated px-4 py-6 text-sm text-text-secondary">
      {children}
    </div>
  );
}
