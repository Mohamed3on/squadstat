"use client";

import Link from "next/link";
import { Users } from "lucide-react";

// Small icon button next to a nation name → that nation's page and squad.
export function NationLink({ href, team }: { href: string; team: string }) {
  return (
    <Link
      href={href}
      className="nat-players"
      title={`${team} squad`}
      aria-label={`View ${team}'s squad`}
      onClick={(e) => e.stopPropagation()}
    >
      <Users size={13} aria-hidden />
    </Link>
  );
}
