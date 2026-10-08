import { describe, expect, it } from "vitest";
import { getContent, PUBLIC_MEMBER_COLUMNS, readContent } from "@/lib/content";
import { fakeSupabase } from "./fake-supabase";

const memberQuery = (client) => client.calls.find((c) => c.table === "cohorts").columns;

describe("member emails never reach the public site", () => {
  it("the public read asks the database for explicit member columns, without email", async () => {
    const client = fakeSupabase();
    await readContent(client);
    expect(memberQuery(client)).toBe(`*, cohort_members(${PUBLIC_MEMBER_COLUMNS})`);
    expect(PUBLIC_MEMBER_COLUMNS).not.toMatch(/email/);
  });

  it("only the admin read selects every member column", async () => {
    const client = fakeSupabase();
    await readContent(client, { includePrivate: true });
    expect(memberQuery(client)).toBe("*, cohort_members(*)");
  });

  it("getContent strips emails even from bundled defaults", async () => {
    const { memberCohorts } = await getContent();
    for (const cohort of memberCohorts) {
      for (const member of cohort.members) expect(member).not.toHaveProperty("email");
    }
  });

  it("falls back to bundled content when the database errors", async () => {
    const client = fakeSupabase({}, { failOn: { "announcements.select": "boom" } });
    const content = await readContent(client);
    expect(content.announcements.length).toBeGreaterThan(0);
  });
});
