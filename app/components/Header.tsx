"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function revalidateAllCaches(): Promise<boolean> {
  const res = await fetch("/api/revalidate", { method: "POST" });
  return res.ok;
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
  { href: "/", label: "Teams" },
  { href: "/team-form", label: "Δ Pts" },
  { href: "/player-form", label: "Players" },
  { href: "/injured", label: "Injured" },
  { href: "/minutes-value", label: "Mins" },
] as const;

export function Header() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isRevalidating, setIsRevalidating] = useState(false);

  const handleBustCache = async () => {
    setIsRevalidating(true);
    try {
      await revalidateAllCaches();
      queryClient.clear();
      window.location.reload();
    } catch {
      setIsRevalidating(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(8,10,12,0.9)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-6">
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

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Button
                  key={href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "h-auto px-2 py-1.5 text-xs sm:px-3 sm:text-sm",
                    isActive && "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  )}
                >
                  <Link href={href}>{label}</Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00ff87] shadow-[0_0_8px_#00ff87]" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
              Live
            </span>
          </div>

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
                <span className="hidden sm:inline">Refreshing…</span>
              </>
            ) : (
              <>
                <RefreshIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
