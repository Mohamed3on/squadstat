import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DISCOVERY_PRESETS,
  type DiscoverySection,
  getDiscoveryPresetsBySection,
  getPresetTargetHref,
} from "@/lib/discovery-presets";

interface DiscoveryLinkGridProps {
  title: string;
  description?: string;
  section?: DiscoverySection;
  maxItems?: number;
  className?: string;
  currentPath?: string;
  currentAliases?: string[];
}

export function DiscoveryLinkGrid({
  title,
  description,
  section,
  maxItems,
  className,
  currentPath,
  currentAliases = [],
}: DiscoveryLinkGridProps) {
  const presets = section ? getDiscoveryPresetsBySection(section) : DISCOVERY_PRESETS;
  const currentHrefSet = new Set([
    ...(currentPath ? [currentPath] : []),
    ...currentAliases,
  ]);
  const filteredPresets = currentHrefSet.size > 0
    ? presets.filter((preset) => !currentHrefSet.has(getPresetTargetHref(preset)))
    : presets;
  const visiblePresets = maxItems ? filteredPresets.slice(0, maxItems) : filteredPresets;

  if (visiblePresets.length === 0) return null;

  return (
    <section className={cn("mt-8 sm:mt-10", className)}>
      <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePresets.map((preset) => (
          <article
            key={preset.slug}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3"
          >
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{preset.title}</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{preset.description}</p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <Link href={getPresetTargetHref(preset)} className="text-[var(--accent-blue)] hover:underline">
                Open view
              </Link>
            </div>
          </article>
        ))}
      </div>

      {(section || maxItems) && (
        <div className="mt-3">
          <Link href="/discover" className="text-sm text-[var(--accent-hot)] hover:underline">
            View all boards
          </Link>
        </div>
      )}
    </section>
  );
}
