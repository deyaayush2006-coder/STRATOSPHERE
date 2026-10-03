"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WINDOW_MINUTES = 10;
const PER_SENDER = 3;
const SITE_WIDE = 50;

function field(formData, key, max) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

async function countSince(supabase, table, since, email) {
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if (email) query = query.eq("email", email);
  const { count, error } = await query;
  return error ? 0 : count ?? 0;
}

async function isFlooding(supabase, table, email) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const [mine, all] = await Promise.all([
    email ? countSince(supabase, table, since, email) : 0,
    countSince(supabase, table, since),
  ]);
  return mine >= PER_SENDER || all >= SITE_WIDE;
}

async function store(table, entry, label) {
  let supabase;
  try {
    supabase = createAdminClient();
  } catch (err) {
    console.error(`${label}:`, err.message);
    return { ok: false, error: "This form is not set up yet. Please email us instead." };
  }

  if (await isFlooding(supabase, table, entry.email)) {
    return { ok: false, error: "Lots of messages are coming in right now. Please try again in a few minutes." };
  }

  const { error } = await supabase.from(table).insert(entry);
  if (error) {
    console.error(`${label}:`, error.message);
    return { ok: false, error: "Could not send that. Please try again later." };
  }

  return { ok: true };
}

export async function sendMessage(formData) {
  if (formData.get("website")) return { ok: true };

  const entry = {
    name: field(formData, "name", 120),
    email: field(formData, "email", 254).toLowerCase(),
    subject: field(formData, "subject", 200),
    message: field(formData, "message", 4000),
    page: field(formData, "page", 200),
  };

  if (!EMAIL.test(entry.email)) {
    return { ok: false, error: "Enter a valid email so we can reply." };
  }
  if (!entry.message) {
    return { ok: false, error: "Write a message before sending." };
  }

  return store("contact_messages", entry, "contact form");
}
