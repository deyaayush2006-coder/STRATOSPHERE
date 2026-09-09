import { cache } from "react";
import { supabasePublic } from "./supabase/public";
import { DEFAULT_CONTENT, JSON_SECTIONS } from "./defaults";
import {
  achievementFromRow,
  announcementFromRow,
  cohortFromRow,
  eventFromRow,
  projectFromRow,
} from "./mappers";

/* Reads the whole site out of Supabase in one pass.
 *
 * Called from the server components that render the pages, so a visitor gets
 * finished HTML rather than a spinner that fills in later.
 *
 * Two rules hold everywhere below:
 *   - an empty table falls back to the bundled default, so a fresh project
 *     still serves the real club site instead of a page of blank sections;
 *   - a failed query is logged and falls back the same way, so the site does
 *     not go down with the database.
 */

const orDefault = (rows, key) => (rows && rows.length ? rows : DEFAULT_CONTENT[key]);

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

/* Takes the client rather than reaching for one, because who is asking
   changes the answer: the anon client sees only published rows, while the
   dashboard's signed-in client sees drafts as well. Same queries either way —
   the row level security policies do the filtering. */
export async function readContent(client) {
  const bundled = { ...DEFAULT_CONTENT };

  // Supabase not configured yet. The bundled content is a complete site, so
  // this is a normal state to be in rather than an error to report.
  if (!client) return bundled;

  try {
    const [json, announcements, events, achievements, projects, memberCohorts] =
      await Promise.all([
        fetchJsonSections(client),
        fetchTable(client, "announcements", "*", announcementFromRow, "announcements"),
        fetchTable(client, "events", "*", eventFromRow, "events"),
        fetchTable(client, "achievements", "*", achievementFromRow, "achievements"),
        /* One round trip, not one per project: PostgREST embeds the parts and
           the members through the foreign keys. */
        fetchTable(client, "projects", "*, project_parts(*)", projectFromRow, "projects"),
        fetchTable(client, "cohorts", "*, cohort_members(*)", cohortFromRow, "memberCohorts"),
      ]);

    /* Per key, not deep: a section the committee has saved is authoritative in
       full. Merging field by field would make a deleted event undeletable. */
    return {
      ...bundled,
      ...json,
      announcements,
      events,
      achievements,
      projects,
      memberCohorts,
    };
  } catch (error) {
    /* Project paused, keys missing, or the schema has not been applied yet.
       The bundled content is a complete site, so serve that and say why. */
    console.warn("[content] falling back to bundled defaults:", error.message);
    return bundled;
  }
}

/* What the public pages call.
 *
 * Wrapped in cache() because the layout and the page both want the whole bag,
 * and so do generateMetadata and generateStaticParams. Without it, one render
 * of the home page would run these six queries three or four times over; with
 * it, the first call does the work and the rest get the same promise. */
export const getContent = cache(() => readContent(supabasePublic));
