"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AMEN, HCP, TEES, fmtPar, parClass, playersText, resultName, teamByCode, teamStats } from "@/lib/course";
import { useOuting } from "./OutingProvider";

export function Scorecard({ code }: { code: string }) {
  const team = teamByCode(code)!;
  const router = useRouter();
  const { state, loaded, apply, toast, setMyTeam } = useOuting();
  const scores = state.scores[team.id];
  const final = state.status === "complete";

  const [hole, setHole] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setMyTeam(team.id); }, [team.id, setMyTeam]);

  // Until someone taps a hole, show the first hole the team hasn't entered.
  const firstOpen = scores.findIndex((v) => v == null);
  const current = hole ?? (firstOpen < 0 ? 18 : firstOpen + 1);
  const par = state.pars[current - 1];
  const saved = scores[current - 1];
  const strokes = pending ?? saved ?? par;
  const st = teamStats(state, team.id);

  const pick = (n: number) => { setHole(n); setPending(null); };

  async function send(value: number | null) {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: team.code, hole: current, strokes: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Score not saved.");
      apply(data);
      if (value == null) { toast(`Hole ${current} cleared`); setPending(null); return; }
      toast(`Hole ${current}: ${value} · ${resultName(value, par)}`);
      const sc: (number | null)[] = data.scores[team.id];
      const after = sc.findIndex((v, i) => i >= current && v == null);
      const any = sc.findIndex((v) => v == null);
      pick(after >= 0 ? after + 1 : any >= 0 ? any + 1 : current);
    } catch (e) {
      setError(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "The connection dropped. Check your signal and tap Save again.");
    } finally { setSaving(false); }
  }

  const holeBtn = (n: number) => {
    const v = scores[n - 1];
    return (
      <button key={n} className="hole-btn" aria-pressed={n === current} onClick={() => pick(n)}
        aria-label={`Hole ${n}, ${v != null ? `${v} strokes` : "not entered"}`}>
        <span className="hn">{n}</span>
        <span className={`hs${v == null ? " empty" : ""}`}>{v ?? "·"}</span>
      </button>
    );
  };

  const saveLabel = saving ? "Saving…" : saved != null ? (saved === strokes ? `Hole ${current} saved` : `Update hole ${current}`) : `Save hole ${current}`;

  return (
    <section className="view">
      <div className="team-hero">
        <div>
          <h2>{team.name}</h2>
          <p>{playersText(team)}</p>
          <button type="button" className="switch" onClick={() => { setMyTeam(null); router.push("/scorecard?switch=1"); }}>Not your team? Switch</button>
        </div>
        <div className="mini">
          <div className={`n ${st.thru ? parClass(st.toPar) : "e"}`}>{st.thru ? fmtPar(st.toPar) : "E"}</div>
          <div className="l">{st.thru === 18 ? "Finished" : `Thru ${st.thru}`}</div>
        </div>
      </div>

      {final && <div className="final-lock">The Committee has closed the outing. Scores are final.</div>}
      {error && <div className="alert"><strong>Score not saved.</strong> {error}</div>}

      <div className="card">
        <div className="holes">
          <div className="nine-label">Front nine</div>
          <div className="nine">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(holeBtn)}</div>
          <div className="nine-label">Back nine</div>
          <div className="nine">{[10, 11, 12, 13, 14, 15, 16, 17, 18].map(holeBtn)}</div>
        </div>
      </div>

      <div className="card">
        <div className="entry">
          <div>
            <div className="hole-title">Hole {current}</div>
            <div className="hole-sub">
              Par {par} · Hcp {HCP[current - 1]}
              {AMEN.has(current) && <> · <span className="amen">Amen Corner</span></>}
              {saved != null && " · Saved"}
            </div>
            <div className="hole-yards">
              {TEES.map((t) => <span key={t.name}>{t.name} <b>{t.yards[current - 1]}</b></span>)}
            </div>
          </div>
          <div className="stepper">
            <button className="step" aria-label="One fewer stroke" disabled={final || strokes <= 1} onClick={() => setPending(strokes - 1)}>−</button>
            <div className="strokes" aria-live="polite">{strokes}</div>
            <button className="step" aria-label="One more stroke" disabled={final || strokes >= 15} onClick={() => setPending(strokes + 1)}>+</button>
          </div>
          <div className="result-name">{resultName(strokes, par)}</div>
          <div className="actions">
            <button className="btn primary" disabled={final || saving || !loaded} onClick={() => send(strokes)}>{saveLabel}</button>
          </div>
          {!final && saved != null && (
            <div className="actions"><button className="btn ghost" disabled={saving} onClick={() => send(null)}>Clear this hole</button></div>
          )}
          <p className="note">Enter your team score for each hole. Tap any hole above to fix a mistake.</p>
        </div>
      </div>
    </section>
  );
}
