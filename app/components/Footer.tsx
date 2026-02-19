import Link from "next/link";

const QUICK_VIEW_LINKS = [
  { href: "/discover", label: "All quick views" },
  { href: "/players?signing=loan&sort=value", label: "Top valued loans" },
  { href: "/players?signing=transfer&sort=ga", label: "Highest scoring signings" },
  { href: "/value-analysis?dTab=bargains&mode=ga", label: "Best bargains" },
  { href: "/injured?tab=teams", label: "Biggest injury losses" },
  { href: "/team-form?league=Premier+League", label: "PL value vs table" },
] as const;

export function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{
        borderColor: "var(--border-subtle)",
        background: "rgba(8, 10, 12, 0.9)",
      }}
    >
      <div className="page-container py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Data from{" "}
            <Link
              href="https://www.transfermarkt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors duration-150 hover:opacity-80"
              style={{ color: "var(--accent-blue)" }}
            >
              Transfermarkt
            </Link>
            {" "}&middot; Built by{" "}
            <Link
              href="https://mohamed3on.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium transition-colors duration-150 hover:opacity-80"
              style={{ color: "var(--accent-hot)" }}
            >
              Mohamed Oun
            </Link>
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/mohamed3on"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors duration-150 hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              GitHub
            </Link>
            <Link
              href="https://techcitiesindex.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors duration-150 hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              Tech Cities Index
            </Link>
            <Link
              href="https://x.com/mohamed3on"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm transition-colors duration-150 hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              X
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--border-subtle)] pt-3 text-xs">
          <span className="font-medium text-[var(--text-secondary)]">Quick Views</span>
          {QUICK_VIEW_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
