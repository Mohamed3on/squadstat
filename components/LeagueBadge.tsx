import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLeagueLogoUrl, getLeagueUrl, getLeagueStyle } from "@/lib/leagues";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

interface LeagueBadgeProps {
  league: string;
  /** Transfermarkt competition code, for the leagues the site doesn't cover.
   *  Without it a Championship or Torneo Clausura badge carries no logo at all,
   *  and the site's five are the only rows with one. */
  code?: string;
  variant?: "inline" | "badge";
}

export function LeagueBadge({ league, code, variant = "badge" }: LeagueBadgeProps) {
  const logoUrl = getLeagueLogoUrl(league) ?? (code ? leagueLogoUrl(code) : undefined);
  const url = getLeagueUrl(league);
  const logo = logoUrl && (
    <img src={logoUrl} alt="" className="w-3.5 h-3.5 object-contain rounded-sm bg-white/90 p-px" />
  );

  if (variant === "inline") {
    const content = (
      <>
        {logo}
        {league}
      </>
    );
    return url ? (
      <Link
        href={url}
        className="hidden sm:flex items-center gap-1 ml-auto text-xs uppercase tracking-wide text-text-secondary hover:underline"
      >
        {content}
      </Link>
    ) : (
      <span className="hidden sm:flex items-center gap-1 ml-auto text-xs uppercase tracking-wide text-text-secondary">
        {content}
      </span>
    );
  }

  // badge variant
  const style = getLeagueStyle(league);
  const badge = (
    <Badge
      className={cn(
        "text-[10px] sm:text-xs inline-flex items-center gap-1 hover:opacity-80 transition-opacity",
        style.bg,
        style.text,
      )}
    >
      {logo}
      {league}
    </Badge>
  );
  return url ? <Link href={url}>{badge}</Link> : badge;
}
