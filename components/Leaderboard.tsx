"use client";

import { AMEN, fmtPar, parClass, playersText, ranked, teamById, teamStats } from "@/lib/course";
import { useOuting } from "./OutingProvider";

const sum = (arr: (number | null)[], a: number, b: number) => {
  const s = arr.slice(a, b).filter((v): v is number => v != null);
  return s.length ? s.reduce((x, y) => x + y, 0) : "–";
};

function Mark({ v, par }: { v: number | null; par: number }) {
  if (v == null) return <span style={{ color: "var(--line)" }}>·</span>;
  const d = v - par;
  const cls = d <= -2 ? "eagle" : d === -1 ? "birdie" : d === 1 ? "bogey" : d >= 2 ? "double" : "";
  return <i className={`mk ${cls}`}>{v}</i>;
}

// One scorecard row: label, front nine, OUT, back nine, IN, TOT.
function CardRow({ label, cells, totals, className }: {
  label: string; cells: React.ReactNode[]; totals: [React.ReactNode, React.ReactNode, React.ReactNode]; className?: string;
}) {
  return (
    <tr className={className}>
      <td className="lbl">{label}</td>
      {cells.slice(0, 9).map((c, i) => <td key={i}>{c}</td>)}
      <td className="sum">{totals[0]}</td>
      {cells.slice(9).map((c, i) => <td key={i + 9}>{c}</td>)}
      <td className="sum">{totals[1]}</td>
      <td className="sum">{totals[2]}</td>
    </tr>
  );
}

export function Leaderboard() {
  const { state } = useOuting();
  const rows = ranked(state);
  const final = state.status === "complete";
  const champ = final ? teamById(state.winner) : undefined;
  const champStats = champ ? teamStats(state, champ.id) : null;
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <section className="view">
      {champ && champStats && (
        <div className="champ">
          <div className="eyebrow">Your 2026 Champions</div>
          <h2>{champ.name}: {playersText(champ)}</h2>
          <p>{champStats.thru ? `${fmtPar(champStats.toPar)} · ${champStats.strokes} strokes. ` : ""}Somebody fetch the green jackets.</p>
        </div>
      )}

      <div className="board">
        <div className="board-head">
          <h2>LEADERS</h2>
          <div className="meta">{final ? <span>Final results</span> : <><span className="live-dot" /><span>Live scoring</span></>}</div>
        </div>
        <div className="board-row colhead"><div>POS</div><div>TEAM</div><div>TO PAR</div><div>THRU</div></div>
        {rows.map((r, i) => {
          const isWin = final && state.winner === r.t.id;
          return (
            <div key={r.t.id} className={`board-row${i === 0 && r.thru ? " leader" : ""}${isWin ? " winner" : ""}`}>
              <div className="cell pos">{r.pos}</div>
              <div className="team-cell">
                <div className="tn">{r.t.name}{isWin && <span className="crown">WINNER</span>}</div>
                <div className="pl">{playersText(r.t)}</div>
              </div>
              <div className={`cell topar ${r.thru ? parClass(r.toPar) : "e"}`}>{r.thru ? fmtPar(r.toPar) : "–"}</div>
              <div className="cell thru">{!r.thru ? "–" : r.thru === 18 ? "F" : r.thru}<small>{r.thru ? `${r.strokes} STR` : "THRU"}</small></div>
            </div>
          );
        })}
        <div className="board-foot">{final ? "The Committee has declared the results official." : "Scores post within a few seconds of a team saving a hole."}</div>
      </div>

      <div className="sec-h"><h3>Hole by hole</h3><span>Swipe the card sideways on a phone</span></div>
      <div className="card">
        <div className="scroll">
          <table className="sc">
            <thead>
              <tr>
                <th className="lbl">Hole</th>
                {holes.slice(0, 9).map((n) => <th key={n} className={AMEN.has(n) ? "amen" : undefined}>{n}</th>)}
                <th className="sum">OUT</th>
                {holes.slice(9).map((n) => <th key={n} className={AMEN.has(n) ? "amen" : undefined}>{n}</th>)}
                <th className="sum">IN</th>
                <th className="sum">TOT</th>
              </tr>
            </thead>
            <tbody>
              <CardRow className="par" label="Par" cells={state.pars}
                totals={[sum(state.pars, 0, 9), sum(state.pars, 9, 18), sum(state.pars, 0, 18)]} />
              {rows.map((r) => {
                const sc = state.scores[r.t.id];
                return (
                  <CardRow key={r.t.id} label={r.t.name} cells={sc.map((v, i) => <Mark key={i} v={v} par={state.pars[i]} />)}
                    totals={[sum(sc, 0, 9), sum(sc, 9, 18), sum(sc, 0, 18)]} />
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="legend">
          <span><i className="mk eagle">3</i> Eagle or better</span>
          <span><i className="mk birdie">3</i> Birdie</span>
          <span><i className="mk bogey">5</i> Bogey</span>
          <span><i className="mk double">6</i> Double+</span>
          <span style={{ color: "var(--azalea)" }}>Pink holes 11–13: Amen Corner</span>
        </div>
      </div>
    </section>
  );
}
