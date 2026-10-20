"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teamById, teamByCode } from "@/lib/course";
import { useOuting } from "./OutingProvider";

// /scorecard: send a phone that already checked in to its team page, otherwise ask for the code.
export function CodeEntry() {
  const router = useRouter();
  const { myTeam, setMyTeam, toast } = useOuting();
  const [code, setCode] = useState("");
  const [bad, setBad] = useState(false);

  useEffect(() => {
    const switching = new URLSearchParams(window.location.search).has("switch");
    const t = teamById(myTeam);
    if (t && !switching) router.replace(`/${t.code}`);
  }, [myTeam, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = teamByCode(code);
    setBad(!t);
    if (!t) return;
    setMyTeam(t.id);
    toast(`Welcome, ${t.players.join(", ")}`);
    router.push(`/${t.code}`);
  }

  return (
    <section className="view">
      <div className="card">
        <form className="panel code-panel" onSubmit={submit}>
          <div className="eyebrow" style={{ textAlign: "center" }}>Check in at the first tee</div>
          <h3 style={{ textAlign: "center" }}>Enter your team code</h3>
          <p className="note">The organizer sent your team a one-word code. You only need to enter it once on each phone.</p>
          <input id="codeIn" className="code-input" type="text" autoComplete="off" autoCapitalize="characters"
            spellCheck={false} aria-label="Team code" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
          {bad && <p className="note" style={{ color: "var(--under)" }}>That code doesn&apos;t match a team. Check the spelling and try again.</p>}
          <button className="btn primary" type="submit" style={{ width: "100%" }}>Go to our scorecard</button>
        </form>
      </div>
    </section>
  );
}
