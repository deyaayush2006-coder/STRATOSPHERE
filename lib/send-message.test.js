import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const { createAdminClient } = await import("@/lib/supabase/admin");
const { sendMessage } = await import("./send-message");

// Just enough of the supabase-js query builder for send-message.js:
// count queries (select/gte/eq, awaited) and insert.
function fakeSupabase() {
  const rows = [];

  const client = {
    rows,
    insert: vi.fn(async (entry) => {
      rows.push({ ...entry, created_at: new Date().toISOString() });
      return { error: null };
    }),
    from() {
      const filters = [];
      const query = {
        select: () => query,
        gte: (column, value) => (filters.push((r) => r[column] >= value), query),
        eq: (column, value) => (filters.push((r) => r[column] === value), query),
        then: (resolve) => resolve({ count: rows.filter((r) => filters.every((f) => f(r))).length, error: null }),
        insert: client.insert,
      };
      return query;
    },
  };
  return client;
}

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

const valid = { name: "Asha", email: "asha@example.com", subject: "Hi", message: "Hello there", page: "/" };

let supabase;

beforeEach(() => {
  supabase = fakeSupabase();
  createAdminClient.mockReset();
  createAdminClient.mockImplementation(() => supabase);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("sendMessage", () => {
  it("stores a valid message", async () => {
    expect(await sendMessage(form(valid))).toEqual({ ok: true });
    expect(supabase.insert).toHaveBeenCalledTimes(1);
    expect(supabase.rows[0]).toMatchObject({ email: "asha@example.com", message: "Hello there" });
  });

  it("reports success but stores nothing when the honeypot is filled", async () => {
    expect(await sendMessage(form({ ...valid, website: "https://spam.example" }))).toEqual({ ok: true });
    expect(supabase.insert).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const result = await sendMessage(form({ ...valid, email: "not-an-email" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/valid email/i);
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("rejects an empty message", async () => {
    const result = await sendMessage(form({ ...valid, message: "   " }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/message/i);
    expect(supabase.insert).not.toHaveBeenCalled();
  });

  it("truncates over-long fields to 120/254/200/4000", async () => {
    await sendMessage(
      form({
        name: "n".repeat(500),
        email: `a@b.${"c".repeat(400)}`,
        subject: "s".repeat(500),
        message: "m".repeat(5000),
        page: "/",
      })
    );
    const [stored] = supabase.rows;
    expect(stored.name).toHaveLength(120);
    expect(stored.email).toHaveLength(254);
    expect(stored.subject).toHaveLength(200);
    expect(stored.message).toHaveLength(4000);
  });

  it("lowercases the email", async () => {
    await sendMessage(form({ ...valid, email: "Asha@Example.COM" }));
    expect(supabase.rows[0].email).toBe("asha@example.com");
  });

  it("rejects the 4th message from the same email inside 10 minutes", async () => {
    for (let i = 0; i < 3; i += 1) {
      expect(await sendMessage(form(valid))).toEqual({ ok: true });
    }
    const fourth = await sendMessage(form(valid));
    expect(fourth.ok).toBe(false);
    expect(fourth.error).toMatch(/try again/i);
    expect(supabase.rows).toHaveLength(3);

    expect(await sendMessage(form({ ...valid, email: "someone.else@example.com" }))).toEqual({ ok: true });
  });

  it("returns a friendly error when the admin client cannot be created", async () => {
    createAdminClient.mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
    });
    const result = await sendMessage(form(valid));
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/email us/i) });
    expect(result.error).not.toMatch(/SERVICE_ROLE/);
  });

  it("returns a friendly error when the insert fails", async () => {
    supabase.insert.mockResolvedValueOnce({ error: { message: "permission denied" } });
    const result = await sendMessage(form(valid));
    expect(result.ok).toBe(false);
    expect(result.error).not.toMatch(/permission denied/);
  });
});
