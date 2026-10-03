import { cache } from "react";
import { supabasePublic } from "./supabase/public";
import { DEFAULT_CONTENT, JSON_SECTIONS } from "./defaults";
import { withEventSlugs } from "./slug";
import {
  achievementFromRow,
  announcementFromRow,
  cohortFromRow,
  eventFromRow,
  projectFromRow,
} from "./mappers";

const orDefault = (rows, key) => (rows && rows.length ? rows : DEFAULT_CONTENT[key]);

const finish = (content) => ({ ...content, events: withEventSlugs(content.events) });

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

const overlay = (bundledValue, savedValue) =>
  isPlainObject(bundledValue) && isPlainObject(savedValue)
    ? { ...bundledValue, ...savedValue }
    : savedValue;

async function fetchJsonSections(client) {
  const { data, error } = await client
    .from("sections")
    .select("key, value")
    .in("key", JSON_SECTIONS);

  if (error) throw error;

  const out = {};
  for (const row of data ?? []) {
    if (row.value != null) out[row.key] = row.value;
  }
  return out;
}

async function fetchTable(client, table, select, map, key) {
  const { data, error } = await client
    .from(table)
    .select(select)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return orDefault((data ?? []).map(map), key);
}

export async function readContent(client) {
  const bundled = { ...DEFAULT_CONTENT };

  if (!client) return finish(bundled);

  try {
    const [json, announcements, events, achievements, projects, memberCohorts] =
      await Promise.all([
        fetchJsonSections(client),
        fetchTable(client, "announcements", "*", announcementFromRow, "announcements"),
        fetchTable(client, "events", "*", eventFromRow, "events"),
        fetchTable(client, "achievements", "*", achievementFromRow, "achievements"),
        fetchTable(client, "projects", "*, project_parts(*)", projectFromRow, "projects"),
        fetchTable(client, "cohorts", "*, cohort_members(*)", cohortFromRow, "memberCohorts"),
      ]);

    for (const [key, value] of Object.entries(json)) {
      bundled[key] = overlay(bundled[key], value);
    }

    return finish({
      ...bundled,
      announcements,
      events,
      achievements,
      projects,
      memberCohorts,
    });
  } catch (error) {
    console.warn("[content] falling back to bundled defaults:", error.message);
    return finish(bundled);
  }
}

const withoutMemberEmails = (content) => ({
  ...content,
  memberCohorts: (content.memberCohorts ?? []).map((cohort) => ({
    ...cohort,
    members: (cohort.members ?? []).map(({ email, ...member }) => member),
  })),
});

export const getContent = cache(async () => withoutMemberEmails(await readContent(supabasePublic)));
