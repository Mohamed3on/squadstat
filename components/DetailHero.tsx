import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function DetailHero({ children }: { children: ReactNode }) {
  return (
    // A flat Slate Charcoal panel on grid paper: the colour on these pages lives in
    // the metric figures, so the surface itself carries none.
    <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-card p-5 animate-blur-in motion-reduce:animate-none sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(88,166,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(88,166,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {children}
      </div>
    </section>
  );
}

export function DetailHeroSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-card p-5 sm:p-7 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">{children}</div>
    </div>
  );
}

export function DetailPageShell({
  backHref,
  backLabel,
  children,
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="full-bleed pt-6 pb-12 sm:pt-8 sm:pb-16">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
        <BackLink href={backHref} label={backLabel} />
        {children}
      </div>
    </div>
  );
}

export function DetailPageShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="full-bleed pt-6 pb-12 sm:pt-8 sm:pb-16">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
        <Skeleton className="mb-4 h-5 w-36" />
        {children}
      </div>
    </div>
  );
}
