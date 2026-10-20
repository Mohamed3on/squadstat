export default function SquadProfitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-4 sm:py-8">
      <div className="mb-4 sm:mb-8">
        <h1 className="font-pixel mb-1 text-2xl text-text-primary sm:mb-2 sm:text-3xl">
          Squad Profit
        </h1>
        <p className="max-w-xl text-sm text-text-muted sm:text-base">
          Today&apos;s squad value against what the club paid for it, biggest gap first. Share is
          the gap as a part of today&apos;s value. ★ marks a club that moved by a bigger share than
          every club above it.
        </p>
      </div>
      {children}
    </div>
  );
}
