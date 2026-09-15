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

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

/* A saved section, over the bundled one of the same name.
 *
 * One level deep, and only when both sides are plain objects. That last part
 * is the whole subtlety: some sections *are* arrays — footerCols, navLinks,
 * showcaseClips — and spreading an array into an object turns it into
 * { 0: …, 1: … }, which nothing downstream survives. Those replace wholesale,
 * which is also what they should do.
 *
 * For an object section, a key the saved copy does not have falls back to the
 * bundled one. That is not a way for old content to creep back: a field the
 * committee clears is saved as "" or [], which is present and therefore wins.
 * The only keys that fall through are the ones that did not exist when the
 * section was last saved — a field added by a code change, which is exactly
 * the case this is for. Without it, every new field in `contact` or `about`
 * would read empty on every install that has ever pressed Save, and the only
 * fix would be asking the committee to re-save a form they cannot see the new
 * field on yet.
 */
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

    /* A saved section wins, field by field for the object-shaped ones and
       wholesale for the list-shaped ones — see `overlay` above for why the two
       differ. The record tables are never merged at all: a deleted event has
       to stay deleted, and those have already fallen back as whole tables in
       fetchTable if they were empty. */
    for (const [key, value] of Object.entries(json)) {
      bundled[key] = overlay(bundled[key], value);
    }

    return {
      ...bundled,
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
