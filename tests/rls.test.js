// Row level security checks, run as the anon role against a LOCAL or
// dedicated test Supabase — never production. See README → Testing.
//
//   RLS_SUPABASE_URL                 e.g. http://127.0.0.1:54321
//   RLS_SUPABASE_ANON_KEY
//   RLS_SUPABASE_SERVICE_ROLE_KEY    local only; creates and removes fixtures
//
// The whole suite is skipped when the URL or anon key is missing.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_REF = "ldchcptirabijgahqrxk";

const URL = process.env.RLS_SUPABASE_URL;
const ANON_KEY = process.env.RLS_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.RLS_SUPABASE_SERVICE_ROLE_KEY;

const configured = Boolean(URL && ANON_KEY);

if (configured && URL.includes(PRODUCTION_REF)) {
  throw new Error("tests/rls.test.js must not run against the production project.");
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = configured ? createClient(URL, ANON_KEY, options) : null;
const service = configured && SERVICE_KEY ? createClient(URL, SERVICE_KEY, options) : null;

const RUN = `rls-${Date.now().toString(36)}`;
const fixtures = {};

const CONTENT_ROWS = {
  sections: () => ({ key: `${RUN}-section`, value: {} }),
  announcements: () => ({ slug: `${RUN}-anon`, title: "anon write" }),
  events: () => ({ slug: `${RUN}-anon`, title: "anon write" }),
  achievements: () => ({ title: "anon write" }),
  projects: () => ({ slug: `${RUN}-anon`, title: "anon write" }),
  project_parts: () => ({ project_id: fixtures.projectId, slug: `${RUN}-anon`, name: "anon write" }),
  cohorts: () => ({ year: `${RUN}-anon` }),
  cohort_members: () => ({ cohort_id: fixtures.cohortId, name: "anon write" }),
  media: () => ({ path: `${RUN}/anon.webp`, filename: "anon.webp" }),
  profiles: () => ({ id: "00000000-0000-0000-0000-000000000001", name: "anon write" }),
};

const RLS_DENIED = "42501";

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function seedFixtures() {
  const unpublished = { published: false, title: `${RUN} unpublished` };

  const [announcement] = await must(
    service.from("announcements").insert({ ...unpublished, slug: `${RUN}-hidden` }).select("id"),
    "fixture announcement"
  );
  const [event] = await must(
    service.from("events").insert({ ...unpublished, slug: `${RUN}-hidden` }).select("id"),
    "fixture event"
  );
  const [achievement] = await must(
    service.from("achievements").insert(unpublished).select("id"),
    "fixture achievement"
  );
  const [project] = await must(
    service.from("projects").insert({ ...unpublished, slug: `${RUN}-hidden` }).select("id"),
    "fixture project"
  );
  const [publishedProject] = await must(
    service.from("projects").insert({ title: `${RUN} public`, slug: `${RUN}-public`, published: true }).select("id"),
    "fixture published project"
  );
  const [cohort] = await must(service.from("cohorts").insert({ year: `${RUN}-cohort` }).select("id"), "fixture cohort");
  await must(
    service.from("cohort_members").insert({ cohort_id: cohort.id, name: "Fixture Member", email: `${RUN}@example.com` }),
    "fixture member"
  );
  const [message] = await must(
    service.from("contact_messages").insert({ email: `${RUN}@example.com`, message: "fixture" }).select("id"),
    "fixture message"
  );

  Object.assign(fixtures, {
    announcementId: announcement.id,
    eventId: event.id,
    achievementId: achievement.id,
    projectId: project.id,
    publishedProjectId: publishedProject.id,
    cohortId: cohort.id,
    messageId: message.id,
  });
}

async function removeFixtures() {
  if (!service) return;
  await service.from("contact_messages").delete().like("email", `${RUN}%`);
  await service.from("cohorts").delete().like("year", `${RUN}%`);
  await service.from("projects").delete().like("slug", `${RUN}%`);
  await service.from("events").delete().like("slug", `${RUN}%`);
  await service.from("announcements").delete().like("slug", `${RUN}%`);
  await service.from("achievements").delete().like("title", `${RUN}%`);
  await service.from("sections").delete().like("key", `${RUN}%`);
}

describe.skipIf(!configured)("RLS as anon", () => {
  beforeAll(async () => {
    if (service) await seedFixtures();
  });

  afterAll(removeFixtures);

  it("cannot read cohort_members.email", async () => {
    const { data, error } = await anon.from("cohort_members").select("id, email").limit(1);
    expect(data).toBeNull();
    expect(error?.code).toBe(RLS_DENIED);
  });

  it("cannot read cohort_members with select=*", async () => {
    const { error } = await anon.from("cohort_members").select("*").limit(1);
    expect(error?.code).toBe(RLS_DENIED);
  });

  it("can read the public member columns", async () => {
    const { error } = await anon
      .from("cohort_members")
      .select("id, cohort_id, name, role, dept, image, linkedin, sort_order")
      .limit(1);
    expect(error).toBeNull();
  });

  it("cannot insert into any content table", async () => {
    for (const [table, row] of Object.entries(CONTENT_ROWS)) {
      if (table === "project_parts" && !fixtures.projectId) continue;
      if (table === "cohort_members" && !fixtures.cohortId) continue;
      const { error } = await anon.from(table).insert(row());
      expect(error?.code, `${table} insert`).toBe(RLS_DENIED);
    }
  });

  it("cannot update or delete any content table", async () => {
    for (const table of Object.keys(CONTENT_ROWS)) {
      const column = table === "sections" ? "key" : "id";
      const notThere = table === "sections" ? "" : "00000000-0000-0000-0000-000000000000";

      const updated = await anon.from(table).update({ sort_order: 999 }).neq(column, notThere).select();
      expect(updated.data ?? [], `${table} update`).toHaveLength(0);

      const deleted = await anon.from(table).delete().neq(column, notThere).select();
      expect(deleted.data ?? [], `${table} delete`).toHaveLength(0);
    }
  });

  it("cannot insert directly into contact_messages", async () => {
    const { error } = await anon.from("contact_messages").insert({ email: "a@b.co", message: "hi" });
    expect(error?.code).toBe(RLS_DENIED);
  });

  describe.skipIf(!SERVICE_KEY)("with fixtures", () => {
    it("cannot read contact_messages", async () => {
      const { data } = await anon.from("contact_messages").select("id");
      expect(data ?? []).toHaveLength(0);
    });

    it.each([
      ["announcements", "announcementId"],
      ["events", "eventId"],
      ["achievements", "achievementId"],
      ["projects", "projectId"],
    ])("cannot read unpublished %s", async (table, key) => {
      const { data, error } = await anon.from(table).select("id").eq("id", fixtures[key]);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it("can read published rows", async () => {
      const { data, error } = await anon.from("projects").select("id").eq("id", fixtures.publishedProjectId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("anon updates really changed nothing", async () => {
      const { data } = await service.from("projects").select("sort_order").eq("id", fixtures.projectId).single();
      expect(data.sort_order).not.toBe(999);
    });
  });
});
