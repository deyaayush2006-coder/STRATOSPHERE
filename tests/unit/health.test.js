import { afterEach, describe, expect, it, vi } from "vitest";
import { checkHealth } from "@/lib/health";

// A stand-in for supabase-js: from().select().limit() resolves to `result`
// after `delayMs`.
function fakeClient({ result = { error: null }, delayMs = 0 } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      calls.push(table);
      return {
        select: () => ({
          limit: () => new Promise((resolve) => setTimeout(() => resolve(result), delayMs)),
        }),
      };
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("checkHealth", () => {
  it("is ok when the database answers", async () => {
    const client = fakeClient();
    const health = await checkHealth({ client });
    expect(health.status).toBe("ok");
    expect(health.checks.app.status).toBe("ok");
    expect(health.checks.database.status).toBe("ok");
    expect(typeof health.checks.database.latencyMs).toBe("number");
    expect(client.calls).toEqual(["sections"]);
  });

  it("is degraded when no database is configured", async () => {
    const health = await checkHealth({ client: null });
    expect(health.status).toBe("degraded");
    expect(health.checks.database).toEqual({ status: "not_configured" });
  });

  it("is down when the database returns an error, without exposing it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const health = await checkHealth({
      client: fakeClient({ result: { error: { message: "secret internal detail" } } }),
    });
    expect(health.status).toBe("down");
    expect(JSON.stringify(health)).not.toContain("secret internal detail");
    expect(console.error).toHaveBeenCalled();
  });

  it("is down when the database is too slow, instead of hanging", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const started = Date.now();
    const health = await checkHealth({ client: fakeClient({ delayMs: 500 }), timeoutMs: 50 });
    expect(health.status).toBe("down");
    expect(Date.now() - started).toBeLessThan(400);
  });

  it("is down when the client throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const client = {
      from() {
        throw new Error("boom");
      },
    };
    expect((await checkHealth({ client })).status).toBe("down");
  });

  it("reports the deployed commit", async () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123456789abcdef");
    expect((await checkHealth({ client: null })).version).toBe("0123456");
    vi.unstubAllEnvs();
  });
});
