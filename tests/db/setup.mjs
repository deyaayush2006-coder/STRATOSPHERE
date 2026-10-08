// Builds a throwaway database: Supabase stub + every migration in order + seed.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MIGRATIONS = join(ROOT, "supabase/migrations");

export const IDS = {
  admin: "00000000-0000-4000-8000-0000000000a1",
  editor: "00000000-0000-4000-8000-0000000000e1",
  suspended: "00000000-0000-4000-8000-0000000000e2",
  outsider: "00000000-0000-4000-8000-0000000000b1",
};

export async function buildDatabase(adminUrl, dbName = "strat_rls") {
  const admin = new pg.Client({ connectionString: adminUrl });
  await admin.connect();
  await admin.query(`drop database if exists ${dbName} with (force)`);
  await admin.query(`create database ${dbName}`);
  await admin.end();

  const url = new URL(adminUrl);
  url.pathname = `/${dbName}`;
  const db = new pg.Client({ connectionString: url.toString() });
  await db.connect();

  await db.query(readFileSync(join(ROOT, "tests/db/supabase-stub.sql"), "utf8"));
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.query(readFileSync(join(MIGRATIONS, file), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${file} failed: ${error.message}`);
    }
  }

  // Accounts as GoTrue would create them. Only app_metadata is trusted.
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
       ($1, 'admin@example.com',    '{"name":"Admin"}',  '{"staff":true,"role":"admin"}'),
       ($2, 'editor@example.com',   '{"name":"Editor"}', '{"staff":true,"role":"editor"}'),
       ($3, 'old@example.com',      '{"name":"Old"}',    '{"staff":true,"role":"editor"}'),
       ($4, 'attacker@example.com', '{"name":"x","role":"admin"}', '{}')`,
    [IDS.admin, IDS.editor, IDS.suspended, IDS.outsider]
  );
  await db.query(`update public.profiles set is_active = false where id = $1`, [IDS.suspended]);

  await db.query(`
    insert into public.announcements (slug, title, published) values ('live', 'Live', true), ('draft', 'Draft', false);
    insert into public.projects (slug, title, published) values ('pub', 'Pub', true), ('hidden', 'Hidden', false);
    insert into public.project_parts (project_id, slug, name)
      select id, 'part-' || slug, 'Part' from public.projects;
    insert into public.cohorts (year) values ('2026');
    insert into public.cohort_members (cohort_id, name, email)
      select id, 'Member', 'member@example.com' from public.cohorts;
    insert into public.contact_messages (name, email, subject, message) values ('A', 'a@example.com', 'Hi', 'Secret message');
    insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
    insert into storage.objects (bucket_id, name) values ('media', 'team/photo.webp');
  `);

  return db;
}

// Run one statement as an API role with the given JWT subject, then roll back.
export async function as(db, role, sub, sql, params = []) {
  await db.query("begin");
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ role, sub: sub ?? "" }),
    ]);
    const res = await db.query(sql, params);
    return { rows: res.rows, count: res.rowCount };
  } catch (error) {
    return { error: error.message };
  } finally {
    await db.query("rollback");
  }
}
