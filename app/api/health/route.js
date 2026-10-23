import { checkHealth } from "@/lib/health";
import { supabasePublic } from "@/lib/supabase/public";

// GET /api/health: 200 when the app and the database are both fine, 503
// otherwise, with the details as JSON. Used by the uptime workflow and the
// deploy smoke test; safe to point any external monitor at.
//
// One instance answers repeat calls from the same 10-second window with the
// same result, so hammering this URL can't turn into load on the database.

export const dynamic = "force-dynamic";

const FRESH_MS = 10_000;
let last = null;

export async function GET() {
  const now = Date.now();
  if (!last || now - last.at > FRESH_MS) {
    last = { at: now, result: checkHealth({ client: supabasePublic }) };
  }
  const body = await last.result;

  return Response.json(
    { ...body, checkedAt: new Date(last.at).toISOString() },
    {
      status: body.status === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
