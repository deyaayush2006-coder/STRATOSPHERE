import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "./fake-supabase";

let client;
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => client }));

const { sendMessage } = await import("@/lib/send-message");

const form = (fields) => {
  const data = new FormData();
  for (const [k, v] of Object.entries({ name: "Asha", email: "asha@example.com", subject: "Hi", message: "Hello", ...fields })) data.set(k, v);
  return data;
};
const stored = () => client.tables().contact_messages ?? [];

describe("contact form", () => {
  beforeEach(() => {
    client = fakeSupabase({ contact_messages: [] });
  });

  it("stores a valid message", async () => {
    expect(await sendMessage(form())).toEqual({ ok: true });
    expect(stored()).toHaveLength(1);
  });

  it("pretends to accept bot submissions but stores nothing", async () => {
    expect(await sendMessage(form({ website: "http://spam.example" }))).toEqual({ ok: true });
    expect(stored()).toHaveLength(0);
  });

  it("rejects a bad email and an empty message", async () => {
    expect((await sendMessage(form({ email: "not-an-email" }))).ok).toBe(false);
    expect((await sendMessage(form({ message: "   " }))).ok).toBe(false);
    expect(stored()).toHaveLength(0);
  });

  it("caps field lengths", async () => {
    await sendMessage(form({ name: "n".repeat(500), message: "m".repeat(9000) }));
    expect(stored()[0].name).toHaveLength(120);
    expect(stored()[0].message).toHaveLength(4000);
  });

  it("rate-limits one sender to 3 messages per 10 minutes", async () => {
    for (let i = 0; i < 3; i++) expect((await sendMessage(form())).ok).toBe(true);
    const fourth = await sendMessage(form());
    expect(fourth.ok).toBe(false);
    expect(stored()).toHaveLength(3);
  });

  it("shows a friendly error when the server key is missing", async () => {
    client = null;
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
      },
    }));
    vi.resetModules();
    const { sendMessage: send } = await import("@/lib/send-message");
    expect((await send(form())).ok).toBe(false);
  });
});
