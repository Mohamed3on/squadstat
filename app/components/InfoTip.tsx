"use client";

import { Info } from "lucide-react";
import { HoverTip } from "@/components/HoverTip";

interface InfoTipProps {
  children: React.ReactNode;
  className?: string;
}

export function InfoTip({ children, className }: InfoTipProps) {
  return (
    <HoverTip
      trigger={
        <span className={`inline-flex cursor-help items-center ${className ?? ""}`}>
          <Info className="h-3.5 w-3.5 text-text-muted transition-colors hover:text-text-secondary" />
        </span>
      }
      className="max-w-xs sm:max-w-sm text-xs sm:text-sm leading-relaxed"
    >
      {children}
    </HoverTip>
  );
}
