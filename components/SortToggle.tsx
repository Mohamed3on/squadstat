"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** The sort row above a player list: picking an option sorts by it, largest
 *  first, and picking it again flips the direction. */
export function SortToggle<K extends string>({
  options,
  value,
  asc,
  onChange,
}: {
  options: readonly { key: K; label: string }[];
  value: K;
  asc: boolean;
  onChange: (key: K, asc: boolean) => void;
}) {
  return (
    // Bleed must match .page-container's 12px mobile padding (px-3) — -mx-5 pushed
    // this 8px past each viewport edge on every squad and league page.
    <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => (v ? onChange(v as K, false) : onChange(value, !asc))}
        className="rounded-lg overflow-hidden border border-border-subtle w-max"
      >
        {options.map(({ key, label }) => (
          <ToggleGroupItem
            key={key}
            value={key}
            className="px-2.5 py-2 sm:py-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide rounded-none border-0 flex items-center gap-1 text-text-muted transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.97] data-[state=on]:bg-elevated data-[state=on]:text-text-primary"
          >
            {label}
            {value === key && <span className="text-[10px]">{asc ? "▲" : "▼"}</span>}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
