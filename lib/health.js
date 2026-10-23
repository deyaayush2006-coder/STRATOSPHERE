// What /api/health reports. Kept apart from the route so tests can hand in a
// fake database client.
//
//   ok        the app answers and the database answered a read in time
//   degraded  the app answers but no database is configured, so the site is
//             serving its bundled defaults
//   down      the database is configured but failed or timed out

export const DB_TIMEOUT_MS = 3000;

async function checkDatabase(client, timeoutMs) {
  if (!client) return { status: "not_configured" };

  const started = Date.now();
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`no answer within ${timeoutMs} ms`)), timeoutMs);
    });
    // The cheapest read there is: one row's key from a table anon may read.
    const { error } = await Promise.race([client.from("sections").select("key").limit(1), timeout]);
    if (error) throw new Error(error.message);
    return { status: "ok", latencyMs: Date.now() - started };
  } catch (err) {
    // The reason goes to the server log only; the response stays generic.
    console.error("[health] database check failed:", err.message);
    return { status: "down", latencyMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth({ client, timeoutMs = DB_TIMEOUT_MS } = {}) {
  const database = await checkDatabase(client, timeoutMs);
  const status =
    database.status === "ok" ? "ok" : database.status === "not_configured" ? "degraded" : "down";

  return {
    status,
    checks: { app: { status: "ok" }, database },
    version: (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 7),
  };
}
