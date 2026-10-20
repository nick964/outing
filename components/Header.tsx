"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { teamByCode } from "@/lib/course";
import { useOuting } from "./OutingProvider";

export function Header() {
  const path = usePathname();
  const { state } = useOuting();
  const onScorecard = path === "/scorecard" || !!teamByCode(path.slice(1));
  return (
    <header className="club">
      <div className="wrap">
        <div className="eyebrow">Saturday · October 24, 2026</div>
        <h1 className="wordmark">The Tittyboyz <em>Golf Outing</em> 2026</h1>
        <div className="subline">{state.course ? `${state.course} · ` : ""}A tradition unlike any other</div>
        <nav className="tabs">
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>Leaderboard</Link>
          <Link href="/scorecard" aria-current={onScorecard ? "page" : undefined}>Our Scorecard</Link>
        </nav>
      </div>
    </header>
  );
}
