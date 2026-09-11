"use client";

import { useState, type ComponentProps } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Menu, HelpCircle, RefreshCw } from "lucide-react";
import { PlayerSearch } from "./PlayerSearch";
import { LEAGUES, getLeagueLogoUrl } from "@/lib/leagues";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

const PAGE_CACHE_MAP: Record<string, { tags?: string[]; workflow?: boolean }> = {
  "/form": { tags: ["form-analysis", "manager"] },
  "/expected-position": { tags: ["team-form", "manager"] },
  "/injured": { tags: ["injured"] },
  "/players": { workflow: true },
  "/value-analysis": { workflow: true },
  "/biggest-movers": { workflow: true },
  "/squad-values": { workflow: true },
  "/fee-vs-value": { tags: ["top-transfers"] },
  "/club-transfers": { tags: ["top-transfers"], workflow: true },
  "/leagues/champions-league": { tags: ["cl-values", "cl-results"] },
};

async function refreshPage(pathname: string) {
  const config = PAGE_CACHE_MAP[pathname];
  const fetches: Promise<Response>[] = [];

  if (!config || config.tags) {
    fetches.push(
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: config?.tags, path: pathname }),
      }),
    );
  }

  if (!config || config.workflow) {
    fetches.push(fetch("/api/refresh-data", { method: "POST" }));
  }

  const results = await Promise.all(fetches);
  const failures = results.filter((res) => !res.ok);
  if (failures.length > 0) {
    for (const res of failures) console.error(`[refresh] ${res.url} returned ${res.status}`);
    throw new Error("Refresh failed");
  }
}

type NavLink = { href: string; label: string };

// Three groups instead of eight top-level words. Each group is what the page is
// *about*, so the bar reads at a glance and every page is one hover away.
// A group is a label only, never a page: the mobile sheet renders it as a heading.
const NAV_GROUPS: readonly { label: string; items: readonly NavLink[] }[] = [
  {
    label: "Teams",
    items: [
      { href: "/form", label: "Recent Form" },
      { href: "/expected-position", label: "Value vs Table" },
      { href: "/squad-values", label: "Squad Values" },
      { href: "/injured", label: "Injury Impact" },
    ],
  },
  {
    label: "Players",
    items: [
      { href: "/players", label: "All Players" },
      { href: "/value-analysis", label: "Over/Under" },
      { href: "/biggest-movers", label: "Biggest Movers" },
    ],
  },
  {
    label: "Transfers",
    items: [
      { href: "/fee-vs-value", label: "Fee vs Value" },
      { href: "/club-transfers", label: "By Club" },
    ],
  },
];

// The Champions League rides with the leagues but stays out of lib/leagues.ts:
// LEAGUES drives the player pool, the colour maps and /leagues/[slug], none of
// which a cross-border cup belongs to. Its page is its own static segment.
const LEAGUE_NAV = [
  ...LEAGUES.map((l) => ({
    slug: l.slug,
    name: l.name,
    href: `/leagues/${l.slug}`,
    logoUrl: getLeagueLogoUrl(l.name),
  })),
  {
    slug: "champions-league",
    name: "Champions League",
    href: "/leagues/champions-league",
    logoUrl: leagueLogoUrl("CL"),
  },
];

type LeagueNavItem = (typeof LEAGUE_NAV)[number];

// One crest, no word. The six marks are the best-known logos in the sport and
// the audience reads them faster than the names; the name lives in a tooltip
// for the pointer and in the sheet for touch. The inactive ones sit at 60% so
// the strip reads as one quiet cluster, not six white tiles.
function LeagueCrest({ league, isActive }: { league: LeagueNavItem; isActive: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={league.href}
          aria-label={league.name}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-[opacity,background-color] duration-200",
            isActive
              ? "bg-elevated opacity-100 ring-1 ring-border-medium"
              : "opacity-60 hover:bg-elevated hover:opacity-100",
          )}
        >
          <img
            src={league.logoUrl}
            alt=""
            className="h-5 w-5 rounded-sm bg-white/90 object-contain p-px"
          />
        </Link>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{league.name}</TooltipContent>
    </Tooltip>
  );
}

// Desktop group: label in the bar, pages in a hover menu. The label brightens
// while any of its pages is the current one, so the bar still shows where you are.
function NavGroup({ group, pathname }: { group: (typeof NAV_GROUPS)[number]; pathname: string }) {
  const isActive = group.items.some((i) => i.href === pathname);
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          "h-8 rounded-md bg-transparent px-2.5 text-sm font-medium hover:bg-elevated hover:text-text-primary focus:bg-elevated focus:text-text-primary data-[state=open]:bg-elevated data-[state=open]:text-text-primary",
          isActive ? "text-text-primary" : "text-text-secondary",
        )}
      >
        {group.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="flex w-48 flex-col p-1.5">
          {group.items.map((item) => {
            const current = pathname === item.href;
            return (
              <li key={item.href}>
                <NavigationMenuLink asChild active={current}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2.5 py-2 text-sm transition-colors",
                      current
                        ? "bg-card-hover text-accent-hot"
                        : "text-text-secondary hover:bg-card-hover hover:text-text-primary focus:bg-card-hover focus:text-text-primary focus:outline-none",
                    )}
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </li>
            );
          })}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function SheetLink({
  href,
  label,
  isActive,
  className,
  children,
  ...rest
}: {
  href: string;
  label: string;
  isActive: boolean;
} & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      {...rest}
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[15px] font-medium transition-colors",
        isActive
          ? "bg-elevated text-accent-hot"
          : "text-text-secondary hover:bg-elevated hover:text-text-primary",
        className,
      )}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}

function SheetGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
      {children}
    </p>
  );
}

export function Header() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const [isRevalidating, setIsRevalidating] = useState(false);

  const handleBustCache = async () => {
    setIsRevalidating(true);
    try {
      await refreshPage(pathname);
      toast.success("Cache cleared — refreshing page");
      queryClient.clear();
      router.refresh();
    } catch (error) {
      console.error("[refresh] Cache bust failed:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRevalidating(false);
    }
  };

  const iconButton = "h-8 w-8 p-0 text-text-muted hover:text-text-primary";

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-black/90 backdrop-blur-xl">
      <div className="page-container flex h-14 items-center gap-3 sm:gap-4">
        {/* shrink-0: without it flex squeezes the logo below its text width and
            "SquadStat" overflows into the first nav item. */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <Image
            src="/icon.png"
            alt=""
            width={28}
            height={28}
            className="transition-opacity group-hover:opacity-80"
          />
          <span className="text-lg font-pixel tracking-tight text-text-primary transition-opacity group-hover:opacity-80 sm:text-xl">
            Squad<span className="text-accent-hot">Stat</span>
          </span>
        </Link>

        {/* Desktop: three groups, a hairline, six crests. One row where there were
            two, and it fits from a laptop width rather than only a monitor. */}
        <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
          <NavigationMenu delayDuration={80}>
            <NavigationMenuList className="gap-0.5 space-x-0">
              {NAV_GROUPS.map((g) => (
                <NavGroup key={g.label} group={g} pathname={pathname} />
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <span aria-hidden="true" className="h-5 w-px bg-border-subtle" />
          <nav aria-label="Leagues" className="flex items-center gap-1">
            {LEAGUE_NAV.map((l) => (
              <LeagueCrest key={l.slug} league={l} isActive={pathname === l.href} />
            ))}
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <PlayerSearch />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(iconButton, "hidden lg:inline-flex")}
              >
                <Link href="/how-it-works" aria-label="How it works">
                  <HelpCircle className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>How it works</TooltipContent>
          </Tooltip>
          {/* A maintenance action, not a goal: it used to be the only filled
              button on every page. Quiet icon now, spinning while it works. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleBustCache}
                disabled={isRevalidating}
                aria-label={isRevalidating ? "Refreshing data" : "Refresh data"}
                variant="ghost"
                size="sm"
                className={iconButton}
              >
                <RefreshCw className={cn("h-4 w-4", isRevalidating && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>
              {isRevalidating ? "Refreshing…" : "Refresh data"}
            </TooltipContent>
          </Tooltip>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-text-primary lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            {/* Flex column with the links as the only scrolling part, so the close
                button stays put instead of scrolling away with a nav that is
                taller than a phone screen. */}
            <SheetContent
              side="right"
              className="flex w-72 flex-col border-border-subtle bg-background"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="-mr-2 mt-2 min-h-0 flex-1 overflow-y-auto pr-2">
                {NAV_GROUPS.map((g) => (
                  <div key={g.label} className="mt-4 first:mt-0">
                    <SheetGroupLabel>{g.label}</SheetGroupLabel>
                    {g.items.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <SheetLink
                          href={item.href}
                          label={item.label}
                          isActive={pathname === item.href}
                        />
                      </SheetClose>
                    ))}
                  </div>
                ))}
                <div className="mt-4">
                  <SheetGroupLabel>Leagues</SheetGroupLabel>
                  {LEAGUE_NAV.map((l) => (
                    <SheetClose key={l.slug} asChild>
                      <SheetLink href={l.href} label={l.name} isActive={pathname === l.href}>
                        <img
                          src={l.logoUrl}
                          alt=""
                          className="h-5 w-5 rounded-sm bg-white/90 object-contain p-px"
                        />
                      </SheetLink>
                    </SheetClose>
                  ))}
                </div>
                <div className="mt-4 border-t border-border-subtle pt-3">
                  <SheetClose asChild>
                    <SheetLink
                      href="/how-it-works"
                      label="How it works"
                      isActive={pathname === "/how-it-works"}
                    >
                      <HelpCircle className="h-4 w-4 opacity-70" />
                    </SheetLink>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
