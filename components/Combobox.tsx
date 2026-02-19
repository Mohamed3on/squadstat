"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const isDefault = !selected || selected.value === "all";

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
          <span className="truncate max-w-[140px]">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] rounded-xl border-border/60 p-0 shadow-xl shadow-black/50"
        align="start"
        sideOffset={6}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder || "Search..."} />
          <CommandList className="max-h-[220px]">
            <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">No results.</CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => (
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
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
