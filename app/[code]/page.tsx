import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scorecard } from "@/components/Scorecard";
import { TEAMS, teamByCode } from "@/lib/course";

// One page per team code: /rich, /toner, /moff.
export async function generateStaticParams() {
  return TEAMS.map((t) => ({ code: t.code }));
}

export async function generateMetadata({ params }: PageProps<"/[code]">): Promise<Metadata> {
  const team = teamByCode((await params).code);
  return { title: team ? `${team.name} Scorecard · Tittyboyz Golf Outing 2026` : "Tittyboyz Golf Outing 2026" };
}

export default async function TeamPage({ params }: PageProps<"/[code]">) {
  const { code } = await params;
  const team = teamByCode(code);
  if (!team) notFound();
  return <Scorecard code={team.code} />;
}
