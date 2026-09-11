import type { ReactNode } from "react";
export function HeroMetric({
  label,
  value,
  subline,
  accentClass,
}: {
  label: string;
  value: string;
  subline: ReactNode;
  accentClass: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p
        className={`mt-1.5 truncate text-2xl font-value leading-none lg:text-xl xl:text-2xl ${accentClass}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-text-secondary">{subline}</p>
    </div>
  );
}
