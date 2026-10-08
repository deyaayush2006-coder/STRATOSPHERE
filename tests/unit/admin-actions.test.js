import { beforeEach, describe, expect, it, vi } from "vitest";
import { cohortFromRow } from "@/lib/mappers";
import { fakeSupabase } from "./fake-supabase";

let client;
let staff;
const createUserSpy = vi.fn(async () => ({ error: null }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/content", () => ({ readContent: vi.fn(async () => ({})) }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => client,
  getStaff: async () => staff,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ auth: { admin: { createUser: createUserSpy } } }),
}));

const { createUser, saveSection } = await import("@/app/admin/actions");

const announcement = (id, slug) => ({ id, slug, title: slug, body: "", tag: "Update", date_label: "", pinned: false, published: true, sort_order: 0 });

describe("saving a collection never silently loses rows", () => {
  beforeEach(() => {
    staff = { id: "s1", role: "admin", is_active: true };
  });

  it("puts deleted rows back when a later step fails", async () => {
    client = fakeSupabase(
      { announcements: [announcement("a1", "keep"), announcement("a2", "old")] },
      { failOn: { "announcements.insert": "network error" } }
    );
    const items = [
      { _id: "a1", id: "keep", title: "Keep" },
      { id: "brand-new", title: "New" },
    ];
    await expect(saveSection("announcements", items)).rejects.toThrow(/network error/);
    expect(client.tables().announcements.map((r) => r.id).sort()).toEqual(["a1", "a2"]);
  });

  it("restores a removed cohort together with its members", async () => {
    const cohorts = [
      { id: "c1", year: "2025", sort_order: 0 },
      { id: "c2", year: "2026", sort_order: 1 },
    ];
    const members = [
      { id: "m1", cohort_id: "c1", name: "Old", role: "", dept: "", image: "", linkedin: "", email: "old@example.com", sort_order: 0 },
      { id: "m2", cohort_id: "c2", name: "New", role: "", dept: "", image: "", linkedin: "", email: "", sort_order: 0 },
    ];
    client = fakeSupabase(
      { cohorts, cohort_members: members },
      { failOn: { "cohort_members.insert": "timeout" }, cascade: { cohorts: [["cohort_members", "cohort_id"]] } }
    );
    const keep = cohortFromRow({ ...cohorts[1], cohort_members: [members[1]] });
    keep.members.push({ name: "Joiner", role: "", dept: "", image: "", linkedin: "", email: "" });

    await expect(saveSection("memberCohorts", [keep])).rejects.toThrow(/timeout/);
    expect(client.tables().cohorts.map((r) => r.id).sort()).toEqual(["c1", "c2"]);
    expect(client.tables().cohort_members.find((m) => m.id === "m1")?.email).toBe("old@example.com");
  });

  it("a successful save removes exactly the deleted rows", async () => {
    client = fakeSupabase({ announcements: [announcement("a1", "keep"), announcement("a2", "old")] });
    await saveSection("announcements", [{ _id: "a1", id: "keep", title: "Keep" }]);
    expect(client.tables().announcements.map((r) => r.id)).toEqual(["a1"]);
  });

  it("refuses to save without a staff session", async () => {
    staff = null;
    client = fakeSupabase({ announcements: [announcement("a1", "keep")] });
    await expect(saveSection("announcements", [])).rejects.toThrow(/session/);
    expect(client.tables().announcements).toHaveLength(1);
  });
});

describe("account creation", () => {
  it("marks staff in app_metadata (server-only), never in user_metadata", async () => {
    staff = { id: "s1", role: "admin", is_active: true };
    client = fakeSupabase({ profiles: [] });
    await createUser({ name: "Riya", email: "riya@example.com", password: "long-enough-1", role: "editor" });
    const args = createUserSpy.mock.calls.at(-1)[0];
    expect(args.app_metadata).toEqual({ staff: true, role: "editor" });
    expect(args.user_metadata).not.toHaveProperty("role");
  });

  it("only admins can create accounts", async () => {
    staff = { id: "s2", role: "editor", is_active: true };
    await expect(createUser({ name: "x", email: "x@example.com", password: "long-enough-1", role: "admin" })).rejects.toThrow(/admin/);
  });
});
