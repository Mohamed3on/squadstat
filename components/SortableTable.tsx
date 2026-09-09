"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectNative } from "@/components/ui/select-native";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * One column of a ranking table: what it is called, and what it sorts on.
 *
 * A column without a `value` is still labelled, it just isn't sortable — which
 * is what a position number wants, since it re-sorts to nothing.
 */
export interface SortColumn<T, K extends string = string> {
  key: K;
  label: string;
  /** Numbers sit right and read largest-first; text sits left and reads A→Z. */
  numeric?: boolean;
  value?: (row: T) => number | string;
  /** Extra classes for the header cell, e.g. hiding a column below a breakpoint. */
  className?: string;
}

export interface SortState<K extends string> {
  key: K;
  desc: boolean;
}

/**
 * Sorting for a table of rows, shared by the site's ranking tables.
 *
 * `columns` must be a module-level constant: it is a dependency of the memo, so
 * an array rebuilt inline re-sorts every row on every render.
 */
export function useTableSort<T, K extends string>(
  rows: readonly T[],
  columns: readonly SortColumn<T, K>[],
  initial: K,
) {
  // Money and counts want largest-first; a name or a league wants A→Z.
  const natural = (key: K): SortState<K> => ({
    key,
    desc: columns.find((c) => c.key === key)?.numeric ?? true,
  });
  const [sort, setSort] = useState<SortState<K>>(() => natural(initial));

  const sorted = useMemo(() => {
    const value = columns.find((c) => c.key === sort.key)?.value;
    if (!value) return [...rows];
    const ordered = [...rows].sort((a, b) => {
      const [x, y] = [value(a), value(b)];
      return typeof x === "string" ? x.localeCompare(String(y)) : x - Number(y);
    });
    return sort.desc ? ordered.reverse() : ordered;
  }, [rows, columns, sort]);

  return {
    sort,
    rows: sorted,
    /** A header click: the active column flips direction, a new one starts natural. */
    toggle: (key: K) => setSort((s) => (s.key === key ? { key, desc: !s.desc } : natural(key))),
    /** The mobile picker only ever chooses a column, so it takes the natural direction. */
    pick: (key: K) => setSort(natural(key)),
    flip: () => setSort((s) => ({ ...s, desc: !s.desc })),
  };
}

/** The whole header row — sortable columns as buttons, the rest as plain labels. */
export function SortableHeader<T, K extends string>({
  columns,
  sort,
  onToggle,
}: {
  columns: readonly SortColumn<T, K>[];
  sort: SortState<K>;
  onToggle: (key: K) => void;
}) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((col) => (
          <TableHead
            key={col.key}
            className={cn(col.numeric ? "text-right" : "text-left", col.className)}
          >
            {col.value ? (
              <button
                onClick={() => onToggle(col.key)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 hover:text-text-primary",
                  sort.key === col.key && "text-text-primary",
                )}
              >
                {col.label}
                <span className="text-xs opacity-60">
                  {sort.key === col.key ? (sort.desc ? "▼" : "▲") : "↕"}
                </span>
              </button>
            ) : (
              col.label
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

/** The mobile stand-in for clickable headers: pick a column, then a direction. */
export function SortPicker<T, K extends string>({
  columns,
  sort,
  onPick,
  onFlip,
  label,
}: {
  columns: readonly SortColumn<T, K>[];
  sort: SortState<K>;
  onPick: (key: K) => void;
  onFlip: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <SelectNative
        aria-label={label}
        value={sort.key}
        onChange={(e) => onPick(e.target.value as K)}
      >
        {columns
          .filter((col) => col.value)
          .map((col) => (
            <option key={col.key} value={col.key}>
              Sort by {col.label.toLowerCase()}
            </option>
          ))}
      </SelectNative>
      <Button
        variant="outline"
        size="sm"
        className="h-10 shrink-0 px-3"
        aria-label={sort.desc ? "Sort ascending" : "Sort descending"}
        onClick={onFlip}
      >
        <span aria-hidden="true">{sort.desc ? "▼" : "▲"}</span>
      </Button>
    </div>
  );
}
