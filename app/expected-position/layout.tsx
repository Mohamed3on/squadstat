export default function ExpectedPositionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-pixel mb-1 sm:mb-2 text-text-primary">
          Expected Position vs Actual
        </h1>
        <p className="text-sm sm:text-base text-text-muted">
          Each team&apos;s expected position is derived from their squad market value rank within the league. The delta shows how many points they&apos;re ahead or behind what their spending level predicts.
        </p>
      </div>
      {children}
    </div>
  );
}
