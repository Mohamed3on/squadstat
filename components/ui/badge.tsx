import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent-hot)] text-[var(--bg-base)]",
        secondary:
          "border-transparent bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
        destructive:
          "border-transparent bg-red-500/10 text-red-500",
        outline:
          "border-[var(--border-subtle)] text-[var(--text-secondary)]",
        success:
          "border-transparent bg-green-500/10 text-green-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
