"use server";

import { revalidatePath } from "next/cache";
import { createClient, getStaff } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readContent } from "@/lib/content";
import { DEFAULT_CONTENT, JSON_SECTIONS } from "@/lib/defaults";
import {
  achievementsToRows,
  announcementsToRows,
  cohortMembersToRows,
  cohortsToRows,
  eventsToRows,
  projectPartsToRows,
  projectsToRows,
} from "@/lib/mappers";

/* Everything the dashboard writes goes through here.
 *
 * These run on the server as the signed-in committee member, so the row level
 * security policies in the migration are the authorisation — application code
 * does not re-decide who may edit what. The one exception is account
 * management at the bottom, which needs the service role and therefore checks
 * the caller itself.
 */

// A filter that matches every row. PostgREST refuses an unfiltered delete, and
// this is the least surprising way to say "all of them".
const EVERY_ROW = "00000000-0000-0000-0000-000000000000";

const COLLECTIONS = {
  announcements: { table: "announcements", toRows: announcementsToRows, naturalKey: "slug" },
  events: { table: "events", toRows: eventsToRows, naturalKey: null },
  achievements: { table: "achievements", toRows: achievementsToRows, naturalKey: null },
  projects: {
    table: "projects",
    toRows: projectsToRows,
    naturalKey: "slug",
    child: { table: "project_parts", fk: "project_id", key: "parts", toRows: projectPartsToRows },
  },
  memberCohorts: {
    table: "cohorts",
    toRows: cohortsToRows,
    naturalKey: "year",
    child: { table: "cohort_members", fk: "cohort_id", key: "members", toRows: cohortMembersToRows },
  },
};

async function requireStaff() {
  const staff = await getStaff();
  if (!staff) throw new Error("Your session has expired. Sign in again.");
  return staff;
}

const fail = (error, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
};

const withoutId = ({ id, ...rest }) => rest;

/* Replaces a whole collection in one call.
 *
 * The dashboard edits a section as a single draft and saves it in one go — a
 * half-finished event should not be live while someone is still typing the
 * date into it — so this takes the finished array and makes the table match.
 *
 * The order below is the safety property. Deletes go first and only ever
 * remove rows the editor actually dropped; if any later step fails, the rows
 * that survived keep their previous values. Nothing is lost that the committee
 * did not ask to lose, which is the failure mode worth designing for.
 */
async function replaceCollection(supabase, key, items) {
  const cfg = COLLECTIONS[key];
  const list = Array.isArray(items) ? items : [];
  // rows[i] is list[i]; the pairing is what lets children find their parent.
  const rows = cfg.toRows(list);

  const existing = rows.filter((r) => r.id);
  const fresh = rows.filter((r) => !r.id).map(withoutId);
  const keptIds = existing.map((r) => r.id);

  // 1 — drop the rows the editor removed. Children cascade.
  let del = supabase.from(cfg.table).delete();
  del = keptIds.length
    ? del.not("id", "in", `(${keptIds.join(",")})`)
    : del.neq("id", EVERY_ROW);
  fail((await del).error, `Could not remove deleted ${key}`);

  // 2 — update the rows that were already there.
  if (existing.length) {
    fail((await supabase.from(cfg.table).upsert(existing)).error, `Could not save ${key}`);
  }

  /* 3 — insert the new ones. Separate from the upsert because PostgREST needs
     every object in a batch to carry the same keys, and a new row has no id. */
  let inserted = [];
  if (fresh.length) {
    const { data, error } = await supabase.from(cfg.table).insert(fresh).select();
    fail(error, `Could not add new ${key}`);
    inserted = data ?? [];
  }

  if (cfg.child) {
    await replaceChildren(supabase, cfg, list, rows, inserted);
  }
}

/* Project parts and committee members. Their parent may have been created a
   moment ago, so the new parents are matched back to the items they came from
   by their natural key — the slug or the year, which is unique by schema. */
async function replaceChildren(supabase, cfg, list, rows, inserted) {
  const { child } = cfg;

  const idFor = new Map(inserted.map((row) => [row[cfg.naturalKey], row.id]));
  const parents = rows.map((row, i) => ({
    item: list[i],
    id: row.id || idFor.get(row[cfg.naturalKey]),
  }));

  const parentIds = parents.map((p) => p.id).filter(Boolean);
  if (parentIds.length === 0) return;

  const childRows = parents.flatMap(({ item, id }) =>
    id ? child.toRows(item[child.key], id) : []
  );

  const keptIds = childRows.filter((r) => r.id).map((r) => r.id);

  /* Scoped to these parents only. A child of a parent that was deleted in step
     1 is already gone by cascade, and must not be matched here. */
  let del = supabase.from(child.table).delete().in(child.fk, parentIds);
  if (keptIds.length) del = del.not("id", "in", `(${keptIds.join(",")})`);
  fail((await del).error, `Could not remove deleted ${child.key}`);

  const update = childRows.filter((r) => r.id);
  const create = childRows.filter((r) => !r.id).map(withoutId);

  if (update.length) {
    fail((await supabase.from(child.table).upsert(update)).error, `Could not save ${child.key}`);
  }
  if (create.length) {
    fail((await supabase.from(child.table).insert(create)).error, `Could not add ${child.key}`);
  }
}

/* The public pages are cached; a save has to say so or the committee sits
   looking at the old home page wondering whether it worked. */
function refreshSite() {
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------ content

/* Everything the editor opens on, drafts included — the dashboard reads as the
   signed-in user, so unpublished rows come back here but not on the site. */
export async function loadContent() {
  await requireStaff();
  return readContent(await createClient());
}

export async function saveSection(key, value) {
  const staff = await requireStaff();
  const supabase = await createClient();

  if (JSON_SECTIONS.includes(key)) {
    const { error } = await supabase
      .from("sections")
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: staff.id });
    fail(error, `Could not save ${key}`);
  } else if (COLLECTIONS[key]) {
    await replaceCollection(supabase, key, value);
  } else {
    throw new Error(`Unknown section: ${key}`);
  }

  refreshSite();

  /* Hand back what is now in the database rather than echoing the draft. New
     rows have real ids after this, and the editor needs them or the next save
     would insert duplicates instead of updating what it just created. */
  const content = await readContent(supabase);
  return content[key];
}

export async function resetSection(key) {
  await requireStaff();
  const supabase = await createClient();

  if (JSON_SECTIONS.includes(key)) {
    // Deleting the row is the reset: with nothing stored, the reader falls
    // back to the bundled default all by itself.
    fail((await supabase.from("sections").delete().eq("key", key)).error, `Could not reset ${key}`);
  } else if (COLLECTIONS[key]) {
    await replaceCollection(supabase, key, DEFAULT_CONTENT[key]);
  } else {
    throw new Error(`Unknown section: ${key}`);
  }

  refreshSite();

  const content = await readContent(supabase);
  return content[key];
}

// ----------------------------------------------------------------- accounts

/* The service role bypasses row level security entirely, so unlike everything
   above, these have to check the caller themselves. */
async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") {
    throw new Error("Only an admin can manage accounts.");
  }
  return staff;
}

export async function listUsers() {
  await requireStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, is_active, created_at")
    .order("created_at", { ascending: true });

  fail(error, "Could not load the accounts");
  return data ?? [];
}

export async function createUser({ name, email, password, role }) {
  await requireAdmin();

  if (!password || password.length < 8) {
    throw new Error("The password needs to be at least 8 characters.");
  }

  const admin = createAdminClient();

  /* email_confirm skips the verification mail: the account is being made by an
     admin who already knows the person, and there is no public sign-up for a
     confirmation link to protect. The profile row is created by the trigger in
     the migration, which reads the name and role out of this metadata. */
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: role === "admin" ? "admin" : "editor" },
  });

  fail(error, "Could not create the account");
  return listUsers();
}

export async function updateUser(id, patch) {
  const me = await requireAdmin();
  const supabase = await createClient();

  /* Locking yourself out is a one-click mistake with no way back short of the
     Supabase dashboard, so the two changes that would do it are refused. */
  if (id === me.id && patch.is_active === false) {
    throw new Error("You cannot suspend your own account.");
  }
  if (id === me.id && patch.role && patch.role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }

  const fields = {};
  if (patch.name !== undefined) fields.name = patch.name;
  if (patch.role !== undefined) fields.role = patch.role === "admin" ? "admin" : "editor";
  if (patch.is_active !== undefined) fields.is_active = Boolean(patch.is_active);

  if (Object.keys(fields).length) {
    fail((await supabase.from("profiles").update(fields).eq("id", id)).error, "Could not update the account");
  }

  if (patch.password) {
    if (patch.password.length < 8) {
      throw new Error("The password needs to be at least 8 characters.");
    }
    const admin = createAdminClient();
    fail(
      (await admin.auth.admin.updateUserById(id, { password: patch.password })).error,
      "Could not set the password"
    );
  }

  return listUsers();
}

export async function deleteUser(id) {
  const me = await requireAdmin();
  if (id === me.id) throw new Error("You cannot delete your own account.");

  const admin = createAdminClient();
  // The profile row goes with it: it is ON DELETE CASCADE from auth.users.
  fail((await admin.auth.admin.deleteUser(id)).error, "Could not delete the account");

  return listUsers();
}

/* Changing your own password needs no elevated client — Supabase Auth checks
   the session, and the session is the proof. */
export async function changeOwnPassword(password) {
  await requireStaff();
  if (!password || password.length < 8) {
    throw new Error("The password needs to be at least 8 characters.");
  }

  const supabase = await createClient();
  fail((await supabase.auth.updateUser({ password })).error, "Could not change the password");
  return true;
}
