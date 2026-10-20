"use client";

import { useState, useSyncExternalStore } from "react";
import { TEAMS, fmtPar, playersText, ranked, teamById, teamStats } from "@/lib/course";
import { useOuting } from "./OutingProvider";

const PW_KEY = "tbz-admin";
const noSubscribe = () => () => {};
const readStoredPw = () => { try { return sessionStorage.getItem(PW_KEY); } catch { return null; } };

export function Admin() {
  const { state, loaded, apply, toast } = useOuting();
  const storedPw = useSyncExternalStore(noSubscribe, readStoredPw, () => null);
  const [pwOverride, setPassword] = useState<string | null | undefined>(undefined);
  const password = pwOverride === undefined ? storedPw : pwOverride;
  const [pwInput, setPwInput] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [winner, setWinner] = useState<string>("");
  const [pars, setPars] = useState<string[] | null>(null);
  const [course, setCourse] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");

  async function call(body: Record<string, unknown>, pw = password) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw Object.assign(new Error(data.error ?? "Couldn't save. Try again."), { status: res.status });
      apply(data);
      return true;
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401 && body.action !== "login") { setPassword(null); try { sessionStorage.removeItem(PW_KEY); } catch {} }
      if (body.action !== "login") toast(err.message || "Couldn't save. Try again.");
      return false;
    } finally { setBusy(false); }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const pw = pwInput.trim();
    const ok = await call({ action: "login" }, pw);
    setPwErr(!ok);
    if (ok) { setPassword(pw); setPwInput(""); try { sessionStorage.setItem(PW_KEY, pw); } catch {} }
  }

  if (!password) {
    return (
      <section className="view">
        <div className="card">
          <form className="panel" onSubmit={login}>
            <h3>The Committee</h3>
            <p className="note" style={{ textAlign: "left", margin: 0 }}>Organizer access only. Enter the Committee password.</p>
            <div className="row">
              <div className="field">
                <label htmlFor="pw">Password</label>
                <input id="pw" type="password" autoComplete="current-password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} />
              </div>
              <button className="btn primary" type="submit" disabled={busy} style={{ flex: "0 0 auto" }}>Enter</button>
            </div>
            {pwErr && <p className="note" style={{ textAlign: "left", margin: 0, color: "var(--under)" }}>That password isn&apos;t right. Try again.</p>}
          </form>
        </div>
      </section>
    );
  }

  const final = state.status === "complete";
  const leader = ranked(state)[0];
  const chosen = final ? state.winner ?? "" : winner || leader.t.id;
  const parVals = pars ?? state.pars.map(String);
  const parNums = parVals.map((p) => parseInt(p, 10) || 0);
  const add = (a: number[]) => a.reduce((x, y) => x + y, 0);

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast("Link copied"); } catch { toast("Press and hold the link to copy it"); }
  }

  const parInputs = (from: number) => (
    <div className="pars">
      {parVals.slice(from, from + 9).map((v, i) => (
        <label key={from + i}>{from + i + 1}
          <input type="number" inputMode="numeric" min={3} max={6} value={v}
            onChange={(e) => { const next = parVals.slice(); next[from + i] = e.target.value; setPars(next); }} />
        </label>
      ))}
    </div>
  );

  return (
    <section className="view">
      <div className="card"><div className="panel">
        <div className="sec-h"><h3>Outing status</h3><span className={`status-pill ${final ? "final" : "live"}`}>{final ? "Final" : "Live"}</span></div>
        <div className="row">
          <div className="field">
            <label htmlFor="winnerSel">Winner</label>
            <select id="winnerSel" value={chosen} disabled={final} onChange={(e) => setWinner(e.target.value)}>
              {TEAMS.map((t) => {
                const s = teamStats(state, t.id);
                return <option key={t.id} value={t.id}>{t.name} ({playersText(t)}) · {s.thru ? `${fmtPar(s.toPar)} thru ${s.thru}` : "no scores"}</option>;
              })}
            </select>
          </div>
          {!final && (
            <button className="btn gold" disabled={busy || !loaded} style={{ flex: "0 0 auto" }}
              onClick={async () => { if (await call({ action: "complete", winner: chosen })) toast(`Outing complete. ${teamById(chosen)?.name} wins!`); }}>
              Mark outing complete
            </button>
          )}
        </div>
        <p className="note" style={{ textAlign: "left", margin: 0 }}>
          {final
            ? `Final. ${teamById(state.winner)?.name ?? "A team"} is shown as champion and score entry is locked.`
            : "The current leader is preselected. Marking complete locks score entry and puts the champion on the leaderboard."}
        </p>
        {final && (
          <div className="row">
            <button className="btn ghost" disabled={busy} onClick={async () => { setWinner(""); if (await call({ action: "reopen" })) toast("Scoring reopened"); }}>Reopen scoring</button>
          </div>
        )}
      </div></div>

      <div className="card"><div className="panel">
        <h3>Course setup</h3>
        <div className="field">
          <label htmlFor="courseIn">Course name</label>
          <input id="courseIn" type="text" value={course ?? state.course} onChange={(e) => setCourse(e.target.value)} />
        </div>
        <div className="nine-label">Par by hole · Out</div>
        {parInputs(0)}
        <div className="nine-label">Par by hole · In</div>
        {parInputs(9)}
        <div className="row">
          <button className="btn primary" disabled={busy} style={{ flex: "0 0 auto" }}
            onClick={async () => {
              if (await call({ action: "course", pars: parNums, course: course ?? state.course })) { setPars(null); setCourse(null); toast("Course saved"); }
            }}>Save course</button>
          <span className="note" style={{ margin: 0 }}>Out {add(parNums.slice(0, 9))} · In {add(parNums.slice(9))} · Par {add(parNums)}</span>
        </div>
      </div></div>

      <div className="card"><div className="panel">
        <h3>Team codes</h3>
        <p className="note" style={{ textAlign: "left", margin: 0 }}>Send everyone the main link and give each team its code. Or send a team its direct link, which skips the code.</p>
        <div className="links">
          <div className="link-row">
            <code><strong>Everyone</strong> · {origin}</code>
            <button className="btn ghost" onClick={() => copy(origin)}>Copy</button>
          </div>
          {TEAMS.map((t) => (
            <div className="link-row" key={t.id}>
              <div style={{ minWidth: 0 }}>
                <div className="code-tag">{t.code.toUpperCase()}</div>
                <code>{t.name} ({playersText(t)}) · {origin}/{t.code}</code>
              </div>
              <button className="btn ghost" onClick={() => copy(`${origin}/${t.code}`)}>Copy</button>
            </div>
          ))}
        </div>
      </div></div>

      <div className="card"><div className="panel">
        <h3>Start over</h3>
        <p className="note" style={{ textAlign: "left", margin: 0 }}>Erases every hole score for all three teams. Use it after a test run.</p>
        <div className="row">
          {!confirmWipe ? (
            <button className="btn danger" onClick={() => setConfirmWipe(true)}>Clear all scores</button>
          ) : (
            <>
              <button className="btn danger" disabled={busy}
                onClick={async () => { if (await call({ action: "wipe" })) toast("All scores cleared"); setConfirmWipe(false); }}>
                Yes, erase everything
              </button>
              <button className="btn ghost" onClick={() => setConfirmWipe(false)}>Cancel</button>
            </>
          )}
        </div>
      </div></div>
    </section>
  );
}
