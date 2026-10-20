import { connection } from "next/server";
import { getState, usingMemoryStore } from "@/lib/store";

export async function GET() {
  await connection();
  const state = await getState();
  const noDatabase = usingMemoryStore && process.env.NODE_ENV === "production";
  return Response.json({ ...state, noDatabase }, { headers: { "Cache-Control": "no-store" } });
}
