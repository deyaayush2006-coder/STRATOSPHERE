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

// A real column on each table, so an update can only come back empty
// because of RLS and never because the column does not exist.
const PATCH = {
  sections: { value: {} },
  media: { alt: "anon write" },
  profiles: { name: "anon write" },
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

beforeAll(async () => {
  if (service) await seedFixtures();
});

afterAll(removeFixtures);

describe.skipIf(!configured)("RLS as anon", () => {
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

      const updated = await anon.from(table).update(PATCH[table] ?? { sort_order: 999 }).neq(column, notThere).select(column);
      expect(updated.error, `${table} update`).toBeNull();
      expect(updated.data, `${table} update`).toHaveLength(0);

      const deleted = await anon.from(table).delete().neq(column, notThere).select(column);
      expect(deleted.error, `${table} delete`).toBeNull();
      expect(deleted.data, `${table} delete`).toHaveLength(0);
    }
  });

  it.each(["handle_new_user", "is_staff", "is_admin"])("cannot call rpc/%s", async (fn) => {
    const { error } = await anon.rpc(fn);
    expect(error, fn).not.toBeNull();
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

async function signedIn(email, password) {
  const client = createClient(URL, ANON_KEY, options);
  await must(client.auth.signInWithPassword({ email, password }), `sign in ${email}`);
  return client;
}

describe.skipIf(!configured || !SERVICE_KEY)("RLS as signed-in users", () => {
  const password = `Rls-${RUN}-pw`;
  const staffEmail = `${RUN}-staff@example.com`;
  const outsiderEmail = `${RUN}-outsider@example.com`;
  const userIds = [];
  let staff;
  let outsider;

  beforeAll(async () => {
    // The same two steps as createUser in app/admin/actions.js.
    const created = await must(
      service.auth.admin.createUser({
        email: staffEmail,
        password,
        email_confirm: true,
        user_metadata: { name: "RLS Staff" },
        app_metadata: { role: "editor" },
      }),
      "create staff"
    );
    userIds.push(created.user.id);
    await must(service.from("profiles").update({ is_active: true }).eq("id", created.user.id), "activate staff");

    // A public sign-up that asks for admin through user metadata.
    const signup = await anon.auth.signUp({
      email: outsiderEmail,
      password,
      options: { data: { name: "Outsider", role: "admin" } },
    });
    if (signup.error) {
      const fallback = await must(
        service.auth.admin.createUser({ email: outsiderEmail, password, email_confirm: true }),
        "create outsider"
      );
      userIds.push(fallback.user.id);
    } else {
      userIds.push(signup.data.user.id);
    }

    staff = await signedIn(staffEmail, password);
    outsider = await signedIn(outsiderEmail, password);
  });

  afterAll(async () => {
    for (const id of userIds) await service.auth.admin.deleteUser(id);
    await service.from("announcements").delete().like("slug", `${RUN}%`);
  });

  it("a self-made account gets no staff role, whatever its metadata says", async () => {
    const { data } = await service.from("profiles").select("role, is_active").eq("email", outsiderEmail).single();
    expect(data).toEqual({ role: "editor", is_active: false });
  });

  it("staff can create, read, update and delete content", async () => {
    const slug = `${RUN}-staff`;
    const [row] = await must(
      staff.from("announcements").insert({ slug, title: "Staff draft", published: false }).select("id"),
      "staff insert"
    );

    const read = await must(staff.from("announcements").select("id").eq("id", row.id), "staff read");
    expect(read).toHaveLength(1);

    const updated = await must(
      staff.from("announcements").update({ title: "Staff edit" }).eq("id", row.id).select("title"),
      "staff update"
    );
    expect(updated).toEqual([{ title: "Staff edit" }]);

    const deleted = await must(staff.from("announcements").delete().eq("id", row.id).select("id"), "staff delete");
    expect(deleted).toHaveLength(1);
  });

  it("staff can read member emails and contact messages", async () => {
    const { error: emailError } = await staff.from("cohort_members").select("email").limit(1);
    expect(emailError).toBeNull();
    const { error: messageError } = await staff.from("contact_messages").select("id").limit(1);
    expect(messageError).toBeNull();
  });

  it("a non-staff account cannot write content", async () => {
    const { error } = await outsider.from("announcements").insert({ slug: `${RUN}-outsider`, title: "nope" });
    expect(error?.code).toBe(RLS_DENIED);

    const updated = await outsider.from("projects").update({ title: "nope" }).eq("id", fixtures.projectId).select();
    expect(updated.data ?? []).toHaveLength(0);

    const { data } = await service.from("projects").select("title").eq("id", fixtures.projectId).single();
    expect(data.title).not.toBe("nope");
  });

  it("a non-staff account cannot read contact messages or unpublished rows", async () => {
    const { data: messages } = await outsider.from("contact_messages").select("id");
    expect(messages ?? []).toHaveLength(0);

    const { data: hidden, error } = await outsider.from("announcements").select("id").eq("id", fixtures.announcementId);
    expect(error).toBeNull();
    expect(hidden).toHaveLength(0);
  });

  it("a non-staff account cannot change its own role", async () => {
    const { data } = await outsider.from("profiles").update({ role: "admin", is_active: true }).eq("email", outsiderEmail).select();
    expect(data ?? []).toHaveLength(0);
  });
});
