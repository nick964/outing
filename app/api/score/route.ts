import { getState, setHole } from "@/lib/store";
import { teamByCode } from "@/lib/course";

// Body: { code: "azalea", hole: 1-18, strokes: 1-15 | null }. null clears the hole.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const team = teamByCode(body?.code);
  const hole = Number(body?.hole);
  const strokes = body?.strokes == null ? null : Number(body.strokes);

  if (!team) return Response.json({ error: "That team code isn't recognized." }, { status: 403 });
  if (!Number.isInteger(hole) || hole < 1 || hole > 18) return Response.json({ error: "Hole must be 1 to 18." }, { status: 400 });
  if (strokes != null && (!Number.isInteger(strokes) || strokes < 1 || strokes > 15)) {
    return Response.json({ error: "Strokes must be 1 to 15." }, { status: 400 });
  }
  if ((await getState()).status === "complete") {
    return Response.json({ error: "The outing is final. Scores are locked." }, { status: 409 });
  }

  await setHole(team.id, hole, strokes);
  return Response.json(await getState());
}
