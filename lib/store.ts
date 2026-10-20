import { Redis } from "@upstash/redis";
import { DEFAULT_COURSE, DEFAULT_PARS, TEAMS, emptyScores, type OutingState, type TeamId } from "./course";

// Upstash Redis when its env vars are present (Vercel Marketplace sets KV_REST_API_*),
// otherwise an in-memory store so `npm run dev` works with no setup.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export const usingMemoryStore = !redis;

const HOLES_KEY = "tbz:holes";
const OUTING_KEY = "tbz:outing";

type Outing = Omit<OutingState, "scores">;
const defaultOuting = (): Outing => ({ status: "live", winner: null, pars: DEFAULT_PARS.slice(), course: DEFAULT_COURSE });

const memory = { holes: new Map<string, number>(), outing: defaultOuting() };

const holeField = (team: TeamId, hole: number) => `${team}-${hole}`;

function cleanOuting(raw: unknown): Outing {
  const d = defaultOuting();
  if (!raw || typeof raw !== "object") return d;
  const v = raw as Partial<Outing>;
  return {
    status: v.status === "complete" ? "complete" : "live",
    winner: TEAMS.some((t) => t.id === v.winner) ? (v.winner as TeamId) : null,
    pars: Array.isArray(v.pars) && v.pars.length === 18 ? v.pars.map((n) => (Number.isInteger(n) ? n : 4)) : d.pars,
    course: typeof v.course === "string" && v.course ? v.course : d.course,
  };
}

export async function getState(): Promise<OutingState> {
  let holes: Record<string, unknown>;
  let outing: unknown;
  if (redis) {
    const [h, o] = await Promise.all([redis.hgetall<Record<string, unknown>>(HOLES_KEY), redis.get(OUTING_KEY)]);
    holes = h ?? {};
    outing = o;
  } else {
    holes = Object.fromEntries(memory.holes);
    outing = memory.outing;
  }
  const scores = emptyScores();
  for (const [field, val] of Object.entries(holes)) {
    const [team, hole] = field.split("-");
    const n = Number(val), h = Number(hole);
    if (team in scores && Number.isInteger(h) && h >= 1 && h <= 18 && Number.isInteger(n) && n >= 1 && n <= 15) {
      scores[team as TeamId][h - 1] = n;
    }
  }
  return { ...cleanOuting(outing), scores };
}

export async function setHole(team: TeamId, hole: number, strokes: number | null) {
  const f = holeField(team, hole);
  if (redis) {
    if (strokes == null) await redis.hdel(HOLES_KEY, f);
    else await redis.hset(HOLES_KEY, { [f]: strokes });
  } else if (strokes == null) memory.holes.delete(f);
  else memory.holes.set(f, strokes);
}

export async function updateOuting(patch: Partial<Outing>) {
  const current = redis ? cleanOuting(await redis.get(OUTING_KEY)) : memory.outing;
  const next = cleanOuting({ ...current, ...patch });
  if (redis) await redis.set(OUTING_KEY, next);
  else memory.outing = next;
}

export async function clearAllScores() {
  if (redis) await redis.del(HOLES_KEY);
  else memory.holes.clear();
}
