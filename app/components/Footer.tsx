import Link from "next/link";

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
      </div>
    </footer>
  );
}
