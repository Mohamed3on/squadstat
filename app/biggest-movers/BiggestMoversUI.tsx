"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarketValueMoversUI } from "@/app/components/MarketValueMoversUI";
import type { MarketValueMoversResult } from "@/app/types";

interface BiggestMoversUIProps {
  losers: MarketValueMoversResult;
  winners: MarketValueMoversResult;
}

export function BiggestMoversUI({ losers, winners }: BiggestMoversUIProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const defaultTab = tab === "winners" ? "winners" : "losers";

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className="mb-4 sm:mb-6">
        <TabsTrigger value="losers">
          Biggest Falls
          <span className="ml-1.5 text-xs text-text-muted font-value">{losers.repeatMovers.length}</span>
        </TabsTrigger>
        <TabsTrigger value="winners">
          Biggest Rises
          <span className="ml-1.5 text-xs text-text-muted font-value">{winners.repeatMovers.length}</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="losers">
        <MarketValueMoversUI data={losers} variant="losers" />
      </TabsContent>
      <TabsContent value="winners">
        <MarketValueMoversUI data={winners} variant="winners" />
      </TabsContent>
    </Tabs>
  );
}
