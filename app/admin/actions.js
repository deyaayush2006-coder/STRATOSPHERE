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

const firstRepeat = (values) => {
  const seen = new Set();
  for (const v of values) {
    if (!v) continue;
    if (seen.has(v)) return v;
    seen.add(v);
  }
  return undefined;
};

const withoutId = ({ id, ...rest }) => rest;

const MISSING_COLUMN = /Could not find the '([^']+)' column/i;

async function writeRows(run, rows, table) {
  let payload = rows;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await run(payload);
    if (!error) return { data };

    const missing = error.message?.match(MISSING_COLUMN)?.[1];
    if (!missing || !payload.some((row) => missing in row)) return { error };

    console.warn(
      `[content] ${table}.${missing} is not in the database, so it was not saved. ` +
        "Apply the migrations in supabase/migrations to keep it."
    );
    payload = payload.map(({ [missing]: _dropped, ...rest }) => rest);
  }

  return await run(payload);
}

async function replaceCollection(supabase, key, items) {
  const cfg = COLLECTIONS[key];
  const list = Array.isArray(items) ? items : [];
  const rows = cfg.toRows(list);

  const existing = rows.filter((r) => r.id);
  const fresh = rows.filter((r) => !r.id).map(withoutId);
  const keptIds = existing.map((r) => r.id);

  if (firstRepeat(keptIds)) {
    throw new Error(
      `Two ${key} entries are pointing at the same saved row, so nothing was saved. ` +
        "Delete one of them and make the copy again."
    );
  }
  if (cfg.naturalKey) {
    const clash = firstRepeat(rows.map((r) => r[cfg.naturalKey]));
    if (clash) {
      throw new Error(
        `Two ${key} entries share the ${cfg.naturalKey} "${clash}", which has to be unique. ` +
          "Change one of them and save again."
      );
    }
  }

  let del = supabase.from(cfg.table).delete();
  del = keptIds.length
    ? del.not("id", "in", `(${keptIds.join(",")})`)
    : del.neq("id", EVERY_ROW);
  fail((await del).error, `Could not remove deleted ${key}`);

  if (existing.length) {
    const { error } = await writeRows(
      (batch) => supabase.from(cfg.table).upsert(batch),
      existing,
      cfg.table
    );
    fail(error, `Could not save ${key}`);
  }

  let inserted = [];
  if (fresh.length) {
    const { data, error } = await writeRows(
      (batch) => supabase.from(cfg.table).insert(batch).select(),
      fresh,
      cfg.table
    );
    fail(error, `Could not add new ${key}`);
    inserted = data ?? [];
  }

  if (cfg.child) {
    await replaceChildren(supabase, cfg, list, rows, inserted);
  }
}

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

  if (firstRepeat(keptIds)) {
    throw new Error(
      `Two ${child.key} are pointing at the same saved row, so nothing was saved. ` +
        "Delete one of them and make the copy again."
    );
  }

  let del = supabase.from(child.table).delete().in(child.fk, parentIds);
  if (keptIds.length) del = del.not("id", "in", `(${keptIds.join(",")})`);
  fail((await del).error, `Could not remove deleted ${child.key}`);

  const update = childRows.filter((r) => r.id);
  const create = childRows.filter((r) => !r.id).map(withoutId);

  if (update.length) {
    const { error } = await writeRows(
      (batch) => supabase.from(child.table).upsert(batch),
      update,
      child.table
    );
    fail(error, `Could not save ${child.key}`);
  }
  if (create.length) {
    const { error } = await writeRows(
      (batch) => supabase.from(child.table).insert(batch),
      create,
      child.table
    );
    fail(error, `Could not add ${child.key}`);
  }
}

function refreshSite() {
  revalidatePath("/", "layout");
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

  const content = await readContent(supabase);
  return content[key];
}

export async function resetSection(key) {
  await requireStaff();
  const supabase = await createClient();

  if (JSON_SECTIONS.includes(key)) {
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

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    // app_metadata can only be set with the service role, so the database
    // trusts it (see migration 0007). user_metadata is user-editable.
    app_metadata: { staff: true, role: role === "admin" ? "admin" : "editor" },
  });

  fail(error, "Could not create the account");
  return listUsers();
}

export async function updateUser(id, patch) {
  const me = await requireAdmin();
  const supabase = await createClient();

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
  fail((await admin.auth.admin.deleteUser(id)).error, "Could not delete the account");

  return listUsers();
}

export async function changeOwnPassword(password) {
  await requireStaff();
  if (!password || password.length < 8) {
    throw new Error("The password needs to be at least 8 characters.");
  }

  const supabase = await createClient();
  fail((await supabase.auth.updateUser({ password })).error, "Could not change the password");
  return true;
}
