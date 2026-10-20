"use client";

import { AMEN, fmtPar, parClass, playersText, ranked, teamById, teamStats, type OutingState, type RankedRow } from "@/lib/course";
import { useOuting } from "./OutingProvider";

const sum = (arr: (number | null)[], a: number, b: number) => {
  const s = arr.slice(a, b).filter((v): v is number => v != null);
  return s.length ? s.reduce((x, y) => x + y, 0) : "–";
};

function Mark({ v, par }: { v: number | null; par: number }) {
  if (v == null) return <span className="dot">·</span>;
  const d = v - par;
  const cls = d <= -2 ? "eagle" : d === -1 ? "birdie" : d === 1 ? "bogey" : d >= 2 ? "double" : "";
  return <i className={`mk ${cls}`}>{v}</i>;
}

// One nine of the scorecard (holes from+1 … from+9). Two of these fit a phone without sideways scrolling.
function NineTable({ state, rows, from }: { state: OutingState; rows: RankedRow[]; from: 0 | 9 }) {
  const holes = Array.from({ length: 9 }, (_, i) => from + i + 1);
  const total = from === 0 ? "OUT" : "IN";
  return (
    <table className="sc">
      <thead>
        <tr>
          <th className="lbl">Hole</th>
          {holes.map((n) => <th key={n} className={AMEN.has(n) ? "amen" : undefined}>{n}</th>)}
          <th className="sum">{total}</th>
        </tr>
      </thead>
      <tbody>
        <tr className="par">
          <td className="lbl">Par</td>
          {holes.map((n) => <td key={n}>{state.pars[n - 1]}</td>)}
          <td className="sum">{sum(state.pars, from, from + 9)}</td>
        </tr>
        {rows.map((r) => {
          const sc = state.scores[r.t.id];
          return (
            <tr key={r.t.id}>
              <td className="lbl">{r.t.name.replace("Team ", "T")}</td>
              {holes.map((n) => <td key={n}><Mark v={sc[n - 1]} par={state.pars[n - 1]} /></td>)}
              <td className="sum">{sum(sc, from, from + 9)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Leaderboard() {
  const { state, updatedAt } = useOuting();
  const rows = ranked(state);
  const final = state.status === "complete";
  const champ = final ? teamById(state.winner) : undefined;
  const champStats = champ ? teamStats(state, champ.id) : null;
  const updated = updatedAt ? new Date(updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

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
          <div className="meta">
            {final ? <span>Final results</span> : <><span className="live-dot" /><span>Live</span></>}
            {updated && <span>· Updated {updated}</span>}
          </div>
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
        <div className="board-foot">{final ? "The Committee has declared the results official." : "Updates on its own every few seconds."}</div>
      </div>

      <div className="sec-h"><h3>Hole by hole</h3></div>
      <div className="card">
        <NineTable state={state} rows={rows} from={0} />
        <NineTable state={state} rows={rows} from={9} />
        <div className="legend">
          <span><i className="mk eagle">3</i> Eagle+</span>
          <span><i className="mk birdie">3</i> Birdie</span>
          <span><i className="mk bogey">5</i> Bogey</span>
          <span><i className="mk double">6</i> Double+</span>
          <span className="amen-key">11–13 Amen Corner</span>
        </div>
      </div>
    </section>
  );
}
