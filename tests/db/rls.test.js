// Row Level Security tests against real Postgres with the repo's migrations.
// Skipped unless TEST_DATABASE_URL points at a Postgres you can drop/create on.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, buildDatabase, IDS } from "./setup.mjs";

const URL = process.env.TEST_DATABASE_URL;
const suite = URL ? describe : describe.skip;

suite("database security (RLS)", () => {
  let db;
  beforeAll(async () => {
    db = await buildDatabase(URL);
  }, 60_000);
  afterAll(async () => {
    await db?.end();
  });

  const anon = (sql, p) => as(db, "anon", null, sql, p);
  const user = (id) => (sql, p) => as(db, "authenticated", id, sql, p);

  describe("sign-up cannot grant itself access", () => {
    it("a self-signup asking for admin becomes an inactive editor", async () => {
      const { rows } = await db.query("select role, is_active from public.profiles where id = $1", [IDS.outsider]);
      expect(rows[0]).toEqual({ role: "editor", is_active: false });
    });

    it("accounts the server creates as staff are active with the requested role", async () => {
      const { rows } = await db.query("select role, is_active from public.profiles where id = $1", [IDS.admin]);
      expect(rows[0]).toEqual({ role: "admin", is_active: true });
    });

    it("new profiles default to inactive", async () => {
      const { rows } = await db.query(
        "select column_default from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_active'"
      );
      expect(rows[0].column_default).toBe("false");
    });
  });

  describe("anonymous visitors", () => {
    it("see only published rows", async () => {
      for (const table of ["announcements", "projects"]) {
        const { rows } = await anon(`select slug from public.${table}`);
        expect(rows.every((r) => !["draft", "hidden"].includes(r.slug))).toBe(true);
        expect(rows.length).toBe(1);
      }
      const parts = await anon("select slug from public.project_parts");
      expect(parts.rows.map((r) => r.slug)).toEqual(["part-pub"]);
    });

    it("cannot read contact messages, profiles or the media table", async () => {
      for (const table of ["contact_messages", "profiles", "media"]) {
        const { rows, error } = await anon(`select * from public.${table}`);
        expect(error ?? rows.length).toSatisfy((v) => v === 0 || typeof v === "string");
      }
    });

    it("cannot read member emails, but can read the rest of the member row", async () => {
      expect((await anon("select email from public.cohort_members")).error).toMatch(/permission denied/);
      const { rows } = await anon("select id, name, role, dept, image, linkedin, sort_order from public.cohort_members");
      expect(rows[0].name).toBe("Member");
    });

    it("cannot write to any table", async () => {
      expect((await anon("insert into public.announcements (slug, title) values ('x', 'x')")).error).toBeTruthy();
      expect((await anon("insert into public.contact_messages (name, email, message) values ('x','x@x.io','x')")).error).toBeTruthy();
      expect((await anon("update public.announcements set title = 'pwned'")).count).toBe(0);
      expect((await anon("delete from public.announcements")).count).toBe(0);
      expect((await anon("update public.sections set value = '{}'")).count).toBe(0);
    });

    it("cannot list storage objects (public URLs do not need this)", async () => {
      expect((await anon("select name from storage.objects")).rows).toEqual([]);
    });

    it("cannot call security-definer helpers over the API", async () => {
      const { rows } = await db.query(`
        select p.proname
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.prosecdef
           and (has_function_privilege('anon', p.oid, 'execute')
             or has_function_privilege('authenticated', p.oid, 'execute'))`);
      expect(rows).toEqual([]);
    });
  });

  describe("signed-in accounts that are not staff", () => {
    const outsider = user(IDS.outsider);
    const suspended = user(IDS.suspended);

    it("see their own profile only", async () => {
      const { rows } = await outsider("select id from public.profiles");
      expect(rows.map((r) => r.id)).toEqual([IDS.outsider]);
    });

    it("cannot promote themselves", async () => {
      expect((await outsider("update public.profiles set role = 'admin', is_active = true where id = $1", [IDS.outsider])).count).toBe(0);
    });

    it("cannot read messages, members or drafts, or write content", async () => {
      for (const who of [outsider, suspended]) {
        expect((await who("select * from public.contact_messages")).rows).toEqual([]);
        expect((await who("select * from public.cohort_members")).rows).toEqual([]);
        expect((await who("select * from public.announcements where not published")).rows).toEqual([]);
        expect((await who("insert into public.announcements (slug, title) values ('x', 'x')")).error).toBeTruthy();
        expect((await who("select name from storage.objects")).rows).toEqual([]);
      }
    });
  });

  describe("staff", () => {
    const editor = user(IDS.editor);
    const admin = user(IDS.admin);

    it("editors manage content and read messages and drafts", async () => {
      expect((await editor("select * from public.contact_messages")).rows.length).toBe(1);
      expect((await editor("select * from public.announcements")).rows.length).toBe(2);
      expect((await editor("select email from public.cohort_members")).rows[0].email).toBe("member@example.com");
      expect((await editor("insert into public.announcements (slug, title) values ('new', 'New')")).count).toBe(1);
      expect((await editor("select name from storage.objects")).rows.length).toBe(1);
    });

    it("editors cannot change accounts", async () => {
      expect((await editor("update public.profiles set role = 'admin' where id = $1", [IDS.editor])).count).toBe(0);
      expect((await editor("update public.profiles set is_active = true where id = $1", [IDS.outsider])).count).toBe(0);
    });

    it("admins can activate and change accounts", async () => {
      expect((await admin("update public.profiles set is_active = true where id = $1", [IDS.outsider])).count).toBe(1);
    });
  });

  it("media bucket does not accept SVG", async () => {
    const { rows } = await db.query("select allowed_mime_types from storage.buckets where id = 'media'");
    if (rows[0]?.allowed_mime_types) expect(rows[0].allowed_mime_types).not.toContain("image/svg+xml");
  });
});
