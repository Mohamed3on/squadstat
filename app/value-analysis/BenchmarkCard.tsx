import Link from "next/link";
import { Star } from "lucide-react";
import type { ReactNode } from "react";

interface BenchmarkCardProps {
  name: string;
  imageUrl: string;
  href: string;
  subtitle: ReactNode;
  desktopStats: ReactNode;
  mobileStats: ReactNode;
  desktopBigNumbers: ReactNode;
  mobileBigNumbers: ReactNode;
  footer?: ReactNode;
}

export function BenchmarkCard({
  name,
  imageUrl,
  href,
  subtitle,
  desktopStats,
  mobileStats,
  desktopBigNumbers,
  mobileBigNumbers,
  footer,
}: BenchmarkCardProps) {
  return (
    // The benchmark is gold because it is the yardstick, not because it glows: a flat
    // card with a gold hairline, like every other surface on the site.
    <div className="relative overflow-hidden rounded-2xl border border-accent-gold/30 bg-card p-4 sm:p-6 animate-scale-in">
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        {/* Avatar + mobile name */}
        <div className="flex items-start gap-4 sm:block">
          <div className="relative shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-accent-gold/50"
              />
            ) : (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold bg-elevated text-accent-gold border-2 border-accent-gold/50">
                {name.charAt(0)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold text-background sm:h-6 sm:w-6">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            </div>
          </div>
          {/* Mobile name + subtitle */}
          <div className="flex-1 min-w-0 sm:hidden">
            <Link
              href={href}
              className="font-bold text-lg hover:underline block truncate text-accent-gold"
            >
              {name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
              {subtitle}
            </div>
          </div>
        </div>

        {/* Desktop name + subtitle + stats */}
        <div className="hidden sm:block flex-1 min-w-0">
          <Link
            href={href}
            className="font-bold text-xl hover:underline block truncate text-accent-gold"
          >
            {name}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">{subtitle}</div>
          <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
            {desktopStats}
          </div>
        </div>

        {/* Desktop big numbers */}
        <div className="hidden sm:flex gap-6 shrink-0">{desktopBigNumbers}</div>

        {/* Mobile bottom */}
        <div className="sm:hidden flex items-center justify-between gap-3 pt-3 border-t border-t-accent-gold/15">
          <div className="flex items-center gap-3 text-xs text-text-secondary">{mobileStats}</div>
          <div className="flex gap-4 shrink-0">{mobileBigNumbers}</div>
        </div>
      </div>

      {footer && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 flex items-center justify-between border-t border-t-accent-gold/15">
          {footer}
        </div>
      )}
    </div>
  );
}

export function BigNumber({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-medium font-value" style={{ color }}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-widest mt-0.5 text-text-secondary">{label}</div>
    </div>
  );
}
