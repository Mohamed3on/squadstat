export default function SquadValuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="font-pixel mb-1 text-2xl text-text-primary sm:mb-2 sm:text-3xl">
          Most Valuable Squads
        </h1>
        <p className="max-w-xl text-sm text-text-muted sm:text-base">
          What the world&apos;s hundred richest squads are worth, what that comes to per player, and
          how much of it sits in the first-choice eighteen.
        </p>
      </div>
      {children}
    </div>
  );
}
