"use client";

import Image from "next/image";
import Link from "next/link";
import trophy from "@/public/trophy.jpg";
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
        {path === "/" && (
          <Image
            className="crest"
            src={trophy}
            alt="A gold statue of a golfer holding up a phone, standing on a trophy pedestal"
            sizes="80px"
            placeholder="blur"
            loading="eager"
          />
        )}
        <div className="eyebrow">Saturday · October 24, 2026</div>
        <h1 className="wordmark">The Tittyboyz <em>Golf Outing</em> 2026</h1>
        <div className="subline">{state.course ? `${state.course} · ` : ""}A tradition unlike any other</div>
        {/* Tabs under the header on wide screens; a fixed thumb bar at the bottom on phones. */}
        <nav className="tabs">
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
            Leaderboard
          </Link>
          <Link href="/scorecard" aria-current={onScorecard ? "page" : undefined}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 21V3l11 4.5L6 12" /></svg>
            Our Scorecard
          </Link>
        </nav>
      </div>
    </header>
  );
}
