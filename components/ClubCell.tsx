import Link from "next/link";
import type { ReactNode } from "react";
import { getTeamDetailHref } from "@/lib/format";
import { crestUrl } from "@/lib/transfermarkt/image";

/**
 * A club as it reads inside a ranking row: crest, name, link to its own page.
 *
 * `children` is whatever that particular table pins to the name — a star for a
 * club topping two measures, a badge, nothing at all.
 */
export function ClubCell({
  id,
  name,
  children,
}: {
  id: string;
  name: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <img src={crestUrl(id)} alt="" loading="lazy" className="size-5 shrink-0 object-contain" />
      <Link href={getTeamDetailHref(id)} className="truncate text-sm font-bold hover:underline">
        {name}
      </Link>
      {children}
    </div>
  );
}
