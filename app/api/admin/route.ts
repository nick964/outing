import { timingSafeEqual } from "node:crypto";
import { clearAllScores, getState, updateOuting } from "@/lib/store";
import { TEAMS, type TeamId } from "@/lib/course";

// Set ADMIN_PASSWORD in Vercel. Locally it falls back to "greenjacket".
function passwordOk(given: unknown) {
  const expected = process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "greenjacket");
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!passwordOk(body?.password)) {
    return Response.json({ error: "That password isn't right." }, { status: 401 });
  }

  switch (body.action) {
    case "login":
      break;
    case "complete": {
      if (!TEAMS.some((t) => t.id === body.winner)) return Response.json({ error: "Pick a winner." }, { status: 400 });
      await updateOuting({ status: "complete", winner: body.winner as TeamId });
      break;
    }
    case "reopen":
      await updateOuting({ status: "live", winner: null });
      break;
    case "course": {
      const pars = Array.isArray(body.pars) && body.pars.length === 18
        ? body.pars.map((n: unknown) => Math.min(6, Math.max(3, Math.round(Number(n)) || 4)))
        : undefined;
      const course = typeof body.course === "string" ? body.course.trim().slice(0, 80) : undefined;
      await updateOuting({ ...(pars && { pars }), ...(course !== undefined && { course }) });
      break;
    }
    case "wipe":
      await clearAllScores();
      break;
    default:
      return Response.json({ error: "Unknown action." }, { status: 400 });
  }
  return Response.json(await getState());
}
