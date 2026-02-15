export default function InjuredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[var(--text-primary)]">
          Injury Impact
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)]">
          Currently injured players ranked by market value across Europe&apos;s top 5 leagues. Team impact is the combined value of all sidelined squad members.
        </p>
      </div>
      {children}
    </div>
  );
}
