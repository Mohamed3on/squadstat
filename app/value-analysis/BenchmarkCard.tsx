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
    <div
      className="relative overflow-hidden rounded-2xl p-4 sm:p-6 animate-scale-in"
      style={{
        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 165, 0, 0.04) 100%)",
        border: "1px solid rgba(255, 215, 0, 0.3)",
        boxShadow: "0 0 60px rgba(255, 215, 0, 0.08), inset 0 1px 0 rgba(255, 215, 0, 0.1)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-20"
        style={{ background: "radial-gradient(circle at top right, rgba(255, 215, 0, 0.4), transparent 70%)" }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
        {/* Avatar + mobile name */}
        <div className="flex items-start gap-4 sm:block">
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-xl opacity-60"
              style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", filter: "blur(4px)" }}
            />
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover" style={{ border: "2px solid rgba(255, 215, 0, 0.5)" }} />
            ) : (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold" style={{ background: "var(--bg-elevated)", color: "#ffd700", border: "2px solid rgba(255, 215, 0, 0.5)" }}>
                {name.charAt(0)}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs"
              style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)", color: "#000", fontWeight: 700, boxShadow: "0 2px 8px rgba(255, 215, 0, 0.4)" }}
            >
              ★
            </div>
          </div>
          {/* Mobile name + subtitle */}
          <div className="flex-1 min-w-0 sm:hidden">
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-lg hover:underline block truncate" style={{ color: "#ffd700" }}>
              {name}
            </a>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </div>
          </div>
        </div>

        {/* Desktop name + subtitle + stats */}
        <div className="hidden sm:block flex-1 min-w-0">
          <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-xl hover:underline block truncate" style={{ color: "#ffd700" }}>
            {name}
          </a>
          <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            {desktopStats}
          </div>
        </div>

        {/* Desktop big numbers */}
        <div className="hidden sm:flex gap-6 shrink-0">
          {desktopBigNumbers}
        </div>

        {/* Mobile bottom */}
        <div className="sm:hidden flex items-center justify-between gap-3 pt-3" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.15)" }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            {mobileStats}
          </div>
          <div className="flex gap-4 shrink-0">
            {mobileBigNumbers}
          </div>
        </div>
      </div>

      {footer && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255, 215, 0, 0.15)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}

export function BigNumber({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
