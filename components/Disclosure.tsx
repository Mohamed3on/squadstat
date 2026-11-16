import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/** Detail a reader opts into: a quiet chevron line that opens onto its content. */
export function Disclosure({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="group inline-flex items-center gap-1.5 py-1 text-sm text-text-secondary transition-colors hover:text-text-primary">
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90 motion-reduce:transition-none" />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
