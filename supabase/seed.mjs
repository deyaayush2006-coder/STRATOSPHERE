/* Fills a fresh Supabase project with the site as it ships, and creates the
 * first admin account.
 *
 *   npm run seed            fill anything that is still empty
 *   npm run seed -- --force wipe the content tables first and re-fill them
 *
 * Run it once, after applying supabase/migrations/0001_init.sql. It reads the
 * same lib/defaults.js the site falls back to, so the seed and the bundled
 * content can never drift apart.
 *
 * Uses the service role key, which bypasses row level security — that is why
 * it is a script you run from a terminal and not anything the site can reach.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { DEFAULT_CONTENT, JSON_SECTIONS } from "../lib/defaults.js";
import {
  achievementsToRows,
  announcementsToRows,
  cohortMembersToRows,
  cohortsToRows,
  eventsToRows,
  projectPartsToRows,
  projectsToRows,
} from "../lib/mappers.js";

dotenv.config({ path: ".env.local" });
dotenv.config(); // .env, for anyone who keeps it there instead

const FORCE = process.argv.includes("--force");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local and fill both in from\n" +
      "Supabase -> Project Settings -> API."
  );
  process.exit(1);
}

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const check = (error, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
};

const withoutId = ({ id, ...rest }) => rest;

async function countRows(table) {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true });
  check(error, `Could not read ${table}`);
  return count ?? 0;
}

/* Every table is skipped when it already holds something, so re-running the
   seed can never overwrite a committee's real edits by accident. --force is
   the deliberate way to start over. */
async function seedTable(table, rows, label) {
  const existing = await countRows(table);

  if (existing > 0 && !FORCE) {
    console.log(`  ${label}: ${existing} already there, left alone`);
    return null;
  }

  if (existing > 0) {
    check(
      (await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")).error,
      `Could not clear ${table}`
    );
  }

  const { data, error } = await supabase.from(table).insert(rows.map(withoutId)).select();
  check(error, `Could not seed ${table}`);
  console.log(`  ${label}: ${data.length} added`);
  return data;
}

async function seedContent() {
  console.log("\nContent");

  await seedTable("announcements", announcementsToRows(DEFAULT_CONTENT.announcements), "announcements");
  await seedTable("events", eventsToRows(DEFAULT_CONTENT.events), "events");
  await seedTable("achievements", achievementsToRows(DEFAULT_CONTENT.achievements), "achievements");

  /* Parents first, then their children against the ids that came back. Matched
     on the natural key rather than on array position, because an insert makes
     no promise about the order it returns rows in. */
  const projects = await seedTable("projects", projectsToRows(DEFAULT_CONTENT.projects), "projects");
  if (projects) {
    const idBySlug = new Map(projects.map((p) => [p.slug, p.id]));
    const parts = DEFAULT_CONTENT.projects.flatMap((p) =>
      projectPartsToRows(p.parts, idBySlug.get(p.slug))
    );
    if (parts.length) {
      check((await supabase.from("project_parts").insert(parts.map(withoutId))).error, "project parts");
      console.log(`  project parts: ${parts.length} added`);
    }
  }

  const cohorts = await seedTable("cohorts", cohortsToRows(DEFAULT_CONTENT.memberCohorts), "committees");
  if (cohorts) {
    const idByYear = new Map(cohorts.map((c) => [c.year, c.id]));
    const members = DEFAULT_CONTENT.memberCohorts.flatMap((c) =>
      cohortMembersToRows(c.members, idByYear.get(c.year))
    );
    if (members.length) {
      check((await supabase.from("cohort_members").insert(members.map(withoutId))).error, "members");
      console.log(`  committee members: ${members.length} added`);
    }
  }

  console.log("\nPage copy");
  for (const key of JSON_SECTIONS) {
    const { data: existing } = await supabase.from("sections").select("key").eq("key", key).maybeSingle();

    if (existing && !FORCE) {
      console.log(`  ${key}: already there, left alone`);
      continue;
    }

    check(
      (await supabase.from("sections").upsert({ key, value: DEFAULT_CONTENT[key] })).error,
      `Could not seed ${key}`
    );
    console.log(`  ${key}: written`);
  }
}

/* The first account has to come from outside the app: the dashboard can create
   accounts, but only once someone can sign in to it. Every account after this
   one is made from the Accounts tab, not from here. */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Club Admin";

  console.log("\nFirst admin");

  if (!email || !password) {
    console.log("  ADMIN_EMAIL / ADMIN_PASSWORD not set, skipped");
    return;
  }

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  check(listError, "Could not list the existing accounts");

  const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) {
    console.log(`  ${email} already exists, left alone`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "admin" },
  });
  check(error, "Could not create the admin account");

  /* The trigger in the migration writes the profile from that metadata. Assert
     it landed as an admin — a silent editor-level first account would lock the
     Accounts tab for good. */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role !== "admin") {
    check(
      (await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user.id)).error,
      "Could not promote the first account"
    );
  }

  console.log(`  ${email} created as an admin`);
  console.log("  Change this password from the dashboard, then clear it out of .env.local.");
}

try {
  console.log(`Seeding ${URL}${FORCE ? "  (--force: existing content will be replaced)" : ""}`);
  await seedContent();
  await seedAdmin();
  console.log("\nDone.\n");
} catch (error) {
  console.error(`\nFailed: ${error.message}\n`);
  process.exit(1);
}
