export default function BiggestMoversLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black mb-1 sm:mb-2 text-text-primary">
          Biggest Movers
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-xl">
          Every 6 months, Transfermarkt updates player market values. We track the biggest risers and fallers each window — and flag the players who keep showing up.
        </p>
      </div>
      {children}
    </div>
  );
}
