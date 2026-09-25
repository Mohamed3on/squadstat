"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsTouchDevice } from "@/lib/hooks/use-touch-device";
import { cn } from "@/lib/utils";

/**
 * Extra detail behind a trigger: a tooltip on hover, or a popover on tap where a
 * touch screen has no hover to give. `onOpenChange` lets the detail load lazily.
 */
export function HoverTip({
  trigger,
  children,
  className,
  onOpenChange,
}: {
  trigger: React.ReactElement;
  children: React.ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const isTouch = useIsTouchDevice();
  const [Root, Trigger, Content] = isTouch
    ? [Popover, PopoverTrigger, PopoverContent]
    : [Tooltip, TooltipTrigger, TooltipContent];

  return (
    <Root onOpenChange={onOpenChange}>
      <Trigger asChild>{trigger}</Trigger>
      <Content
        side="bottom"
        align="center"
        sideOffset={8}
        avoidCollisions
        collisionPadding={16}
        className={cn(
          "p-3 bg-card text-text-primary border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          className,
        )}
      >
        {children}
      </Content>
    </Root>
  );
}
