"use client";

import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toggleVariants } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";

const inputClass = "h-7 text-xs tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function RangeFilter({ label, min, max, onMinChange, onMaxChange }: {
  label: string;
  min: number | null;
  max: number | null;
  onMinChange: (v: string | null) => void;
  onMaxChange: (v: string | null) => void;
}) {
  const active = min !== null || max !== null;
  return (
    <Popover>
      <PopoverTrigger
        data-state={active ? "on" : "off"}
        className={cn(toggleVariants({ size: "sm", variant: "outline" }), "gap-1.5 rounded-lg tabular-nums")}
      >
        {active ? `${label}: ${min ?? "0"}–${max ?? "∞"}` : label}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-text-secondary">{label} range</label>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} placeholder="Min" value={min ?? ""} onChange={(e) => onMinChange(e.target.value || null)} className={inputClass} />
            <span className="text-xs text-text-muted">–</span>
            <Input type="number" min={0} placeholder="Max" value={max ?? ""} onChange={(e) => onMaxChange(e.target.value || null)} className={inputClass} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
