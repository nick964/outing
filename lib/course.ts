// Teams, course data, and scoring helpers shared by the server and the browser.

export type TeamId = "team1" | "team2" | "team3";
export type Team = { id: TeamId; code: string; name: string; players: string[] };

export const TEAMS: Team[] = [
  { id: "team1", code: "rich", name: "Team 1", players: ["Rich", "Fitz", "Andrews"] },
  { id: "team2", code: "toner", name: "Team 2", players: ["Nicky Robby", "Toner", "TJ"] },
  { id: "team3", code: "moff", name: "Team 3", players: ["Nick B", "Moff", "Dickson"] },
];

// John F. Byrne Golf Course, Philadelphia (from the course scorecard)
export const DEFAULT_COURSE = "John F. Byrne Golf Course";
export const DEFAULT_PARS = [4, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 5, 3, 3, 3, 5, 4, 4];
export const TEES = [
  { name: "Blue", rating: "65.0/117", yards: [373, 206, 264, 252, 168, 385, 300, 167, 308, 332, 159, 526, 120, 234, 163, 505, 300, 350] },
  { name: "White", rating: "63.9/116", yards: [320, 193, 254, 240, 162, 376, 293, 142, 293, 319, 155, 516, 89, 219, 156, 495, 270, 338] },
  { name: "Red", rating: "61.7/108", yards: [300, 149, 210, 228, 154, 226, 208, 133, 205, 290, 155, 506, 72, 184, 152, 480, 260, 254] },
];
export const HCP = [8, 10, 14, 18, 6, 2, 16, 12, 4, 7, 15, 3, 17, 5, 13, 11, 1, 9];
export const AMEN = new Set([11, 12, 13]);

export type Scores = Record<TeamId, (number | null)[]>;
export type OutingState = {
  status: "live" | "complete";
  winner: TeamId | null;
  pars: number[];
  course: string;
  scores: Scores;
};

export const emptyScores = (): Scores =>
  Object.fromEntries(TEAMS.map((t) => [t.id, Array(18).fill(null)])) as Scores;

export const teamById = (id: string | null | undefined) => TEAMS.find((t) => t.id === id);
export const teamByCode = (code: string | null | undefined) =>
  TEAMS.find((t) => t.code === String(code ?? "").trim().toLowerCase());

export const playersText = (t: Team) =>
  t.players.slice(0, -1).join(", ") + " & " + t.players[t.players.length - 1];
export const fmtPar = (n: number) => (n === 0 ? "E" : n > 0 ? `+${n}` : String(n));
export const parClass = (n: number) => (n < 0 ? "u" : n > 0 ? "o" : "e");

export function resultName(strokes: number, par: number) {
  if (strokes === 1) return "Hole in one!";
  const d = strokes - par;
  const names: Record<string, string> = {
    "-3": "Albatross", "-2": "Eagle", "-1": "Birdie", "0": "Par",
    "1": "Bogey", "2": "Double bogey", "3": "Triple bogey",
  };
  return names[String(d)] ?? (d > 0 ? `+${d}` : `${d}`);
}

export function teamStats(state: OutingState, id: TeamId) {
  let thru = 0, strokes = 0, toPar = 0;
  state.scores[id].forEach((v, i) => {
    if (v != null) { thru++; strokes += v; toPar += v - state.pars[i]; }
  });
  return { thru, strokes, toPar };
}

export type RankedRow = { t: Team; thru: number; strokes: number; toPar: number; pos: string };

export function ranked(state: OutingState): RankedRow[] {
  const rows = TEAMS.map((t) => ({ t, ...teamStats(state, t.id), pos: "–" }));
  rows.sort((a, b) => {
    if (!a.thru !== !b.thru) return a.thru ? -1 : 1;
    return a.toPar - b.toPar || b.thru - a.thru;
  });
  rows.forEach((r) => {
    if (!r.thru) return;
    const same = rows.filter((x) => x.thru && x.toPar === r.toPar);
    const first = rows.findIndex((x) => x.thru && x.toPar === r.toPar);
    r.pos = (same.length > 1 ? "T" : "") + (first + 1);
  });
  return rows;
}
