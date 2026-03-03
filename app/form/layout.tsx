export default function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-text-primary">
          Recent Form
        </h1>
        <p className="text-sm sm:text-base text-text-muted">
          Who&apos;s hot and who&apos;s not across Europe&apos;s top 5 leagues. Teams ranked by how often they lead
          categories (points, GD, goals scored, goals conceded) across their last 5, 10, 15, and 20 matches.
        </p>
      </div>
      {children}
    </div>
  );
}
