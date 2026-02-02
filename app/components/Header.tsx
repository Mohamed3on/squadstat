"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

async function revalidateAllCaches(): Promise<boolean> {
  // Single call clears all caches including underperformers (via revalidateTag)
  const res = await fetch("/api/revalidate", { method: "POST" });
  return res.ok;
}

export function Header() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isRevalidating, setIsRevalidating] = useState(false);

  const handleBustCache = async () => {
    setIsRevalidating(true);
    try {
      await revalidateAllCaches();
      queryClient.clear();
      // Trigger a page reload to refetch with fresh cache
      window.location.reload();
    } catch {
      setIsRevalidating(false);
    }
  };

  const isHome = pathname === "/";
  const isPlayerScout = pathname === "/player-form";
  const isInjured = pathname === "/injured";

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: "rgba(8, 10, 12, 0.9)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo/Title */}
          <Link href="/" className="group">
            <h1
              className="text-xl font-black tracking-tight transition-opacity group-hover:opacity-80"
              style={{ color: "var(--text-primary)" }}
            >
              Form<span style={{ color: "var(--accent-hot)" }}>Tracker</span>
            </h1>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isHome ? "var(--bg-elevated)" : "transparent",
                color: isHome ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Teams
            </Link>
            <Link
              href="/player-form"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isPlayerScout ? "var(--bg-elevated)" : "transparent",
                color: isPlayerScout ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Players
            </Link>
            <Link
              href="/injured"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isInjured ? "var(--bg-elevated)" : "transparent",
                color: isInjured ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Injured
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#00ff87", boxShadow: "0 0 8px #00ff87" }}
            />
            <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--text-muted)" }}>
              Live
            </span>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleBustCache}
            disabled={isRevalidating}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: isRevalidating ? "var(--bg-elevated)" : "var(--accent-hot)",
              color: isRevalidating ? "var(--text-muted)" : "var(--bg-base)",
              boxShadow: isRevalidating ? "none" : "var(--shadow-glow-hot)",
            }}
          >
            {isRevalidating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
