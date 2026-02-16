import Link from "next/link";
import {
  DISCOVERY_SECTION_LABELS,
  DISCOVERY_SECTION_ORDER,
  getDiscoveryPresetsBySection,
  getPresetTargetHref,
} from "@/lib/discovery-presets";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Scouting Boards",
  description:
    "Curated shortcuts to the highest-signal views across players, value analysis, injuries, and team performance.",
  path: "/discover",
  keywords: [
    "football scouting boards",
    "loan players ranking",
    "new signings performance",
    "injury impact rankings",
  ],
});

export default function DiscoverPage() {
  return (
    <div className="py-4 sm:py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-[var(--text-primary)] sm:text-3xl">Scouting Boards</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)]">
          Direct links to the best preset views. No extra pages, just fast access to the live filters.
        </p>
      </header>

      <div className="space-y-8">
        {DISCOVERY_SECTION_ORDER.map((section) => {
          const presets = getDiscoveryPresetsBySection(section);
          if (presets.length === 0) return null;

          return (
            <section key={section}>
              <h2 className="mb-3 text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                {DISCOVERY_SECTION_LABELS[section]}
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {presets.map((preset) => (
                  <article
                    key={preset.slug}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3"
                  >
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">{preset.title}</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{preset.description}</p>
                    <div className="mt-2 text-xs">
                      <Link
                        href={getPresetTargetHref(preset)}
                        className="text-[var(--accent-blue)] hover:underline"
                      >
                        Open view
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
