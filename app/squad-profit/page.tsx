import { createPageMetadata } from "@/lib/metadata";
import { getSquadProfit } from "@/lib/squad-profit";
import { SquadProfitTable } from "./SquadProfitTable";

export const metadata = createPageMetadata({
  title: "Squad Profit",
  description:
    "Which clubs' squads are worth far more than they paid for them, and which are worth less — by euros and by share, with the clubs no one beats on both starred.",
  path: "/squad-profit",
  keywords: [
    "squad value vs transfer spend",
    "value added by club",
    "best recruitment football",
    "worst recruitment football",
    "purchase value vs market value",
  ],
});

export const dynamic = "force-dynamic";

export default async function SquadProfitPage() {
  const { winners, losers } = await getSquadProfit();
  return (
    <div className="space-y-8 sm:space-y-10">
      <SquadProfitTable title="Worth more than they cost" clubs={winners} />
      <SquadProfitTable title="Worth less than they cost" clubs={losers} />
    </div>
  );
}
