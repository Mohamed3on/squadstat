import { Children, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The feed panel (DESIGN.md): one flat panel, a title line, then hairline-divided rows,
 * never a card per row. The home page's Latest Highlights and Latest Standouts use it,
 * and so do the Players page's scoring duos.
 *
 * Rows arrive as `<li>` children; with none, `emptyText` says why. The title line's
 * right-hand side holds an "Open" link (`href`) or any control (`action`).
 */
export function FeedPanel({
  title,
  as: Heading = "h3",
  description,
  href,
  action,
  ordered = false,
  emptyText,
  className = "",
  children,
}: {
  title: string;
  as?: "h2" | "h3";
  description?: ReactNode;
  href?: string;
  action?: ReactNode;
  /** A ranking reads as an ordered list. */
  ordered?: boolean;
  emptyText?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const headingId = `feed-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const List = ordered ? "ol" : "ul";
  return (
    <section
      aria-labelledby={headingId}
      className={`overflow-hidden rounded-xl border border-border-subtle bg-elevated ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0">
          <Heading id={headingId} className="text-sm font-semibold text-text-primary">
            {title}
          </Heading>
          {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="group/link inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-blue transition-colors hover:text-text-primary"
          >
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        )}
        {action}
      </div>
      {Children.count(children) > 0 ? (
        <List className="divide-y divide-border-subtle">{children}</List>
      ) : (
        <p className="px-4 py-6 text-sm text-text-secondary">{emptyText}</p>
      )}
    </section>
  );
}

// The panel's placeholder: the same flat panel, title line and divided rows, so nothing
// shifts when the data streams in. The panel is Deep Navy-Charcoal like the placeholders'
// default, so they take Slate Charcoal instead.
export function FeedPanelSkeleton({
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
