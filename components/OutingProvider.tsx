"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DEFAULT_COURSE, DEFAULT_PARS, emptyScores, teamById, type OutingState, type TeamId } from "@/lib/course";

type Ctx = {
  state: OutingState;
  loaded: boolean;
  problem: string | null;
  apply: (s: OutingState) => void;
  refresh: () => Promise<void>;
  toast: (msg: string) => void;
  myTeam: TeamId | null;
  setMyTeam: (id: TeamId | null) => void;
};

const OutingContext = createContext<Ctx | null>(null);
const POLL_MS = 5000;
const TEAM_KEY = "tbz-team";
const noSubscribe = () => () => {};
const readStoredTeam = () => {
  try { const v = localStorage.getItem(TEAM_KEY); return teamById(v) ? (v as TeamId) : null; } catch { return null; }
};

export function useOuting() {
  const ctx = useContext(OutingContext);
  if (!ctx) throw new Error("useOuting must be used inside <OutingProvider>");
  return ctx;
}

export function OutingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OutingState>(() => ({
    status: "live", winner: null, pars: DEFAULT_PARS.slice(), course: DEFAULT_COURSE, scores: emptyScores(),
  }));
  const [loaded, setLoaded] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; n: number } | null>(null);
  const storedTeam = useSyncExternalStore(noSubscribe, readStoredTeam, () => null);
  const [teamOverride, setMyTeamState] = useState<TeamId | null | undefined>(undefined);
  const myTeam = teamOverride === undefined ? storedTeam : teamOverride;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((s: OutingState) => { setState(s); setLoaded(true); }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      apply(data);
      setProblem(data.noDatabase ? "The scores database isn't connected, so scores won't stick. The organizer needs to add Upstash Redis in Vercel." : null);
    } catch {
      setProblem("Can't reach the scoreboard. Check your signal; it'll catch up on its own.");
    }
  }, [apply]);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const id = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, POLL_MS);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(first); clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [refresh]);

  const setMyTeam = useCallback((id: TeamId | null) => {
    setMyTeamState(id);
    try { if (id) localStorage.setItem(TEAM_KEY, id); else localStorage.removeItem(TEAM_KEY); } catch {}
  }, []);

  const toast = useCallback((text: string) => {
    setToastMsg({ text, n: Date.now() });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  return (
    <OutingContext.Provider value={{ state, loaded, problem, apply, refresh, toast, myTeam, setMyTeam }}>
      {problem && <div className="wrap"><div className="alert" style={{ marginTop: 16 }}><strong>Heads up.</strong> {problem}</div></div>}
      {children}
      <div className={`toast${toastMsg ? " show" : ""}`} role="status">{toastMsg?.text}</div>
    </OutingContext.Provider>
  );
}
