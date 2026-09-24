export default function NationalTeamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="font-pixel mb-1 text-2xl text-text-primary sm:mb-2 sm:text-3xl">
          Most Valuable National Teams
        </h1>
        <p className="max-w-xl text-sm text-text-muted sm:text-base">
          What the world&apos;s hundred richest national squads are worth, and what that comes to
          per player.
        </p>
      </div>
      {children}
    </div>
  );
}
