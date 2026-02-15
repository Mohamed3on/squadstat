"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

const PAGE_TAGS: Record<string, string[]> = {
  "/form": ["form-analysis", "manager"],
  "/team-form": ["team-form"],
  "/injured": ["injured"],
};

const STATIC_DATA_PAGES = new Set(["/players", "/value-analysis"]);

async function revalidateCaches(pathname: string): Promise<"revalidated" | "dispatched"> {
  if (STATIC_DATA_PAGES.has(pathname)) {
    const res = await fetch("/api/refresh-data", { method: "POST" });
    if (!res.ok) throw new Error("Failed to trigger data refresh");
    return "dispatched";
  }
  const tags = PAGE_TAGS[pathname];
  const res = await fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tags ? { tags } : {}),
  });
  if (!res.ok) throw new Error("Failed to revalidate");
  return "revalidated";
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/form", label: "Recent Form" },
  { href: "/team-form", label: "Value vs Table" },
  { href: "/players", label: "Players" },
  { href: "/value-analysis", label: "Value Analysis" },
  { href: "/injured", label: "Injury Impact" },
] as const;

export function Header() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isRevalidating, setIsRevalidating] = useState(false);

  const handleBustCache = async () => {
    setIsRevalidating(true);
    try {
      const result = await revalidateCaches(pathname);
      if (result === "dispatched") {
        toast.info("Data refresh started — check back in a few minutes");
        setIsRevalidating(false);
      } else {
        queryClient.clear();
        window.location.reload();
      }
    } catch {
      setIsRevalidating(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(8,10,12,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/icon.png"
            alt="FormTracker"
            width={28}
            height={28}
            className="transition-opacity group-hover:opacity-80"
          />
          <h1 className="text-lg font-black tracking-tight text-[var(--text-primary)] transition-opacity group-hover:opacity-80 sm:text-xl">
            Form<span className="text-[var(--accent-hot)]">Tracker</span>
          </h1>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Button
                key={href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "h-auto px-3 py-1.5 text-sm",
                  isActive && "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                )}
              >
                <Link href={href}>{label}</Link>
              </Button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={handleBustCache}
            disabled={isRevalidating}
            aria-label={isRevalidating ? "Refreshing data" : "Refresh data"}
            variant={isRevalidating ? "secondary" : "default"}
            size="sm"
            className="h-auto p-2 sm:px-4 sm:py-2"
          >
            {isRevalidating ? (
              <>
                <SpinnerIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Refreshing Data…</span>
              </>
            ) : (
              <>
                <RefreshIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh Data</span>
              </>
            )}
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-[var(--text-primary)] sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-64 border-[var(--border-subtle)] bg-[var(--bg-base)]"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map(({ href, label }) => {
                  const isActive = pathname === href;
                  return (
                    <SheetClose key={href} asChild>
                      <Link
                        href={href}
                        className={cn(
                          "rounded-md px-3 py-2.5 text-base font-medium transition-colors",
                          isActive
                            ? "bg-[var(--bg-elevated)] text-[var(--accent-hot)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
