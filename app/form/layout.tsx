export default function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-[var(--text-primary)]">
          Recent Form
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)]">
          Who&apos;s hot and who&apos;s not across Europe&apos;s top 5 leagues. We compare the last 5, 10, 15, and 20
          matches and highlight teams that lead (or trail) in at least 2 of: points, goal difference, goals scored,
          goals conceded.
        </p>
      </div>
      {children}
    </div>
  );
}
