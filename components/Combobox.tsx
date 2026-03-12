"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type ComboboxOption = { value: string; label: string };
export type ComboboxGroup = { heading: string; options: ComboboxOption[] };

export function Combobox({
  value,
  onChange,
  options,
  groups,
  placeholder,
  searchPlaceholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: ComboboxOption[];
  groups?: ComboboxGroup[];
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const allOptions = options ?? groups?.flatMap((g) => g.options) ?? [];
  const selected = allOptions.find((o) => o.value === value);
  const isDefault = !selected || selected.value === "all";

  const renderItem = (option: ComboboxOption) => (
    <CommandItem
      key={option.value}
      value={option.label}
      onSelect={() => {
        onChange(option.value === value ? "" : option.value);
        setOpen(false);
      }}
    >
      <Check className={cn("shrink-0 transition-opacity", value === option.value ? "opacity-100" : "opacity-0")} />
      {option.label}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-8 items-center justify-between gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 text-xs transition-all",
            "hover:border-border hover:bg-accent",
            "data-[state=open]:border-border data-[state=open]:bg-accent",
            isDefault ? "text-muted-foreground" : "text-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-48 rounded-xl border-border/60 p-0 shadow-xl shadow-black/50"
        align="start"
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder || "Search..."} />
          <CommandList className="max-h-[220px]">
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">No results.</CommandEmpty>
            {groups ? (
              groups.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading} className="p-1">
                  {group.options.map(renderItem)}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup className="p-1">
                {allOptions.map(renderItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
