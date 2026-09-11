"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Trophy, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { formatMarketValue } from "@/lib/format";
import { normalizeForSearch } from "@/lib/normalize";
import { SITE_PAGES, type SitePage } from "@/lib/site-pages";

interface SearchPlayer {
  id: string;
  name: string;
  club: string;
  position: string;
  league: string;
  nationality: string;
  imageUrl: string;
  marketValue: number;
}

interface SearchTeam {
  id: string;
  name: string;
  logoUrl: string;
}

interface SearchIndex {
  players: SearchPlayer[];
  teams: SearchTeam[];
}

type ScoredResult =
  | { type: "player"; data: SearchPlayer; score: number }
  | { type: "team"; data: SearchTeam; score: number }
  | { type: "page"; data: SitePage; score: number };

// Score: lower = better. name startsWith (0) > name contains (1) > secondary field (2)
function scoreName(normalized: string, q: string): number {
  return normalized.startsWith(q) ? 0 : normalized.includes(q) ? 1 : -1;
}

// Pages are static, so they're normalized once at module load and searchable
// before the player index has arrived.
const NORMALIZED_PAGES = SITE_PAGES.map((p) => ({
  name: normalizeForSearch(p.name),
  keywords: (p.keywords ?? []).map(normalizeForSearch),
}));

function scorePage(i: number, q: string): number {
  const n = NORMALIZED_PAGES[i];
  const byName = scoreName(n.name, q);
  if (byName >= 0) return byName;
  return n.keywords.some((k) => k.startsWith(q)) ? 2 : -1;
}

const EMPTY_INDEX: SearchIndex = { players: [], teams: [] };

// Rank among equal scores: competitions, then pages, then players by value, then teams.
function tieRank(r: ScoredResult): number {
  if (r.type === "page") return r.data.kind === "competition" ? 0 : 1;
  return r.type === "player" ? 2 : 3;
}

export function PlayerSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const fetchedRef = useRef(false);

  const fetchIndex = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/players/search")
      .then((r) => {
        if (!r.ok) throw new Error(`Search index returned ${r.status}`);
        return r.json();
      })
      .then((data) =>
        setIndex(Array.isArray(data) ? { players: data, teams: [] } : { ...EMPTY_INDEX, ...data }),
      )
      .catch((err) => {
        console.error("[PlayerSearch] Failed to load search index:", err);
        fetchedRef.current = false;
        setIndex(EMPTY_INDEX);
      });
  }, []);

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Prefetch after idle
  useEffect(() => {
    const timer = setTimeout(fetchIndex, 3000);
    return () => clearTimeout(timer);
  }, [fetchIndex]);

  // Also fetch immediately on open
  useEffect(() => {
    if (open) fetchIndex();
  }, [open, fetchIndex]);

  // Reset query on close
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Pre-compute normalized strings once when index changes (not on every keystroke)
  const normalizedIndex = useMemo(() => {
    if (!index) return null;
    return {
      players: index.players.map((p) => ({
        name: normalizeForSearch(p.name),
        club: normalizeForSearch(p.club),
        league: normalizeForSearch(p.league),
        nationality: normalizeForSearch(p.nationality),
        position: normalizeForSearch(p.position),
      })),
      teams: index.teams.map((t) => normalizeForSearch(t.name)),
    };
  }, [index]);

  const results = useMemo((): ScoredResult[] => {
    if (query.length === 0) return [];
    const q = normalizeForSearch(query);
    if (q.length === 0) return [];
    const scored: ScoredResult[] = [];

    for (let i = 0; i < SITE_PAGES.length; i++) {
      const score = scorePage(i, q);
      if (score >= 0) scored.push({ type: "page", data: SITE_PAGES[i], score });
    }
    if (!index || !normalizedIndex) return scored.slice(0, 8);

    for (let i = 0; i < index.players.length; i++) {
      const n = normalizedIndex.players[i];
      let score = scoreName(n.name, q);
      if (
        score < 0 &&
        (n.club.includes(q) ||
          n.league.includes(q) ||
          n.nationality.includes(q) ||
          n.position.includes(q))
      ) {
        score = 2;
      }
      if (score >= 0) scored.push({ type: "player", data: index.players[i], score });
    }
    for (let i = 0; i < index.teams.length; i++) {
      const score = scoreName(normalizedIndex.teams[i], q);
      if (score >= 0) scored.push({ type: "team", data: index.teams[i], score });
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const rankDiff = tieRank(a) - tieRank(b);
      if (rankDiff !== 0) return rankDiff;
      const aVal = a.type === "player" ? a.data.marketValue : 0;
      const bVal = b.type === "player" ? b.data.marketValue : 0;
      return bVal - aVal;
    });

    return scored.slice(0, 8);
  }, [index, normalizedIndex, query]);

  const handleSelect = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 px-2 text-text-muted hover:text-text-primary"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border border-border-subtle bg-elevated px-1.5 font-mono text-[10px] text-text-muted lg:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[30%] translate-y-0 gap-0 overflow-hidden rounded-2xl border-border-subtle/60 bg-[var(--bg-card)] p-0 shadow-2xl shadow-black/40 sm:max-w-xl [&>button]:hidden">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for players, teams, competitions, or pages
          </DialogDescription>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search players, teams, or pages..."
              value={query}
              onValueChange={setQuery}
              wrapperClassName="border-border-subtle/40 px-4"
              className="h-12 text-sm placeholder:text-text-muted"
            />
            <CommandList className="max-h-80 p-1.5">
              {query.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-text-muted">
                  <Search className="h-5 w-5 opacity-30" />
                  <p className="text-sm">
                    {index ? "Search players, teams, and pages" : "Loading\u2026"}
                  </p>
                  <p className="text-xs opacity-50">Try a name, club, competition, or page</p>
                </div>
              ) : results.length === 0 ? (
                <CommandEmpty className="py-12 text-text-muted">No results found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {results.map((r) => {
                    const href =
                      r.type === "page"
                        ? r.data.href
                        : `${r.type === "player" ? "/players" : "/teams"}/${r.data.id}`;
                    return (
                      <CommandItem
                        key={href}
                        value={href}
                        onSelect={() => handleSelect(href)}
                        className="gap-3 rounded-xl px-3 py-2.5 data-[selected=true]:bg-white/5"
                      >
                        {r.type === "player" ? (
                          <PlayerAvatar
                            name={r.data.name}
                            imageUrl={r.data.imageUrl}
                            className="h-9 w-9 rounded-lg border border-border-subtle/50"
                          />
                        ) : r.type === "team" || r.data.logoUrl ? (
                          <img
                            src={r.data.logoUrl}
                            alt={r.data.name}
                            className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle/50 bg-elevated text-text-muted">
                            {r.data.kind === "competition" ? (
                              <Trophy className="h-4 w-4" />
                            ) : (
                              <LayoutGrid className="h-4 w-4" />
                            )}
                          </span>
                        )}
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-sm text-text-primary">{r.data.name}</span>
                          {r.type === "player" && (
                            <span className="truncate text-xs text-text-muted">
                              {r.data.position} · {r.data.club}
                            </span>
                          )}
                        </div>
                        <span className="font-value text-xs text-text-muted">
                          {r.type === "player"
                            ? formatMarketValue(r.data.marketValue)
                            : r.type === "team"
                              ? "Team"
                              : r.data.kind === "competition"
                                ? "Competition"
                                : "Page"}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
