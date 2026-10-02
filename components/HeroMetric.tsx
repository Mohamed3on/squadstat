import type { ReactNode } from "react";
/** A hero readout: label, figure, sub-line — and, below it, any small visual the
 *  figure needs to be read at a glance. */
export function HeroMetric({
  label,
  value,
  subline,
  accentClass,
  children,
}: {
  label: string;
  value: string;
  subline?: ReactNode;
  accentClass: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p
        className={`mt-1.5 truncate text-2xl font-value leading-none lg:text-xl xl:text-2xl ${accentClass}`}
      >
        {value}
      </p>
      {subline && <p className="mt-1.5 text-xs text-text-secondary">{subline}</p>}
      {children}
    </div>
  );
}
