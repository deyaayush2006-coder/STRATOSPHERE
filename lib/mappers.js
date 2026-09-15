/* Translates between the database rows and the shape the site renders.
 *
 * The public components and the dashboard's schema both speak the original
 * flat objects — { when, date, time } for an event, { id, date, tag } for an
 * announcement — and this file is the only place that knows those are really
 * `when_status`, `date_label` and `time_label` in Postgres. Nothing else has
 * to care, so the components port over untouched and the editor schema stays
 * one line per field.
 *
 * Every editor item carries `_id`, the row's uuid. It is not in the schema so
 * no form ever shows it, but ObjectFields copies unknown keys through, which
 * is what lets a save update the existing row instead of replacing it. An item
 * created in the panel has no `_id` yet, and that is how a new row is spotted.
 */

const str = (v) => (v == null ? "" : String(v));
const bool = (v) => Boolean(v);
const arr = (v) => (Array.isArray(v) ? v : []);

/* An embedded PostgREST relation does not inherit the parent ORDER BY, so
   nested rows arrive in whatever order the planner chose. Sort them here,
   before the mapper drops sort_order on the way out. */
const byOrder = (rows) =>
  [...arr(rows)].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

/* Position in the list is the order on the site, so the index is the sort key.
   Sending it explicitly beats relying on insertion order, which a bulk upsert
   makes no promises about. */
const ordered = (items, toRow) => items.map((item, i) => ({ ...toRow(item, i), sort_order: i }));

// ------------------------------------------------------------ announcements

/* Anything Postgres or a datetime-local field hands over, normalised to one
   ISO string — or "" when there is nothing usable there, which is the signal
   the caller uses to fall back rather than render an Invalid Date. */
const iso = (v) => {
  if (!v) return "";
  const at = new Date(v);
  return Number.isNaN(at.getTime()) ? "" : at.toISOString();
};

export const announcementFromRow = (row) => ({
  _id: row.id,
  id: str(row.slug),
  date: str(row.date_label),
  /* The sort key, and the reason an announcement that has scrolled off the
     front page is still findable in the archive with the time it went up.
     created_at is the backstop for a row written before posted_at existed. */
  postedAt: iso(row.posted_at) || iso(row.created_at),
  tag: str(row.tag),
  title: str(row.title),
  body: str(row.body),
  pinned: bool(row.pinned),
  published: bool(row.published),
});

export const announcementsToRows = (items) =>
  ordered(items, (a, i) => ({
    id: a._id || undefined,
    slug: str(a.id) || `announcement-${i + 1}`,
    title: str(a.title),
    body: str(a.body),
    tag: str(a.tag) || "Update",
    date_label: str(a.date),
    /* An announcement written in the panel has no timestamp of its own, so it
       is stamped on the way in. One that already has one keeps it — editing a
       typo must not push an old post back to the top of the feed. */
    posted_at: iso(a.postedAt) || new Date().toISOString(),
    pinned: bool(a.pinned),
    published: a.published !== false,
  }));

// -------------------------------------------------------------------- events

export const eventFromRow = (row) => ({
  _id: row.id,
  when: str(row.when_status) || "upcoming",
  date: str(row.date_label),
  time: str(row.time_label),
  title: str(row.title),
  location: str(row.location),
  body: str(row.body),
  image: str(row.image),
  published: bool(row.published),
});

export const eventsToRows = (items) =>
  ordered(items, (e) => ({
    id: e._id || undefined,
    title: str(e.title),
    when_status: e.when === "past" ? "past" : "upcoming",
    date_label: str(e.date) || "TBD",
    time_label: str(e.time) || "TBD",
    location: str(e.location),
    body: str(e.body),
    image: str(e.image),
    published: e.published !== false,
  }));

// -------------------------------------------------------------- achievements

export const achievementFromRow = (row) => ({
  _id: row.id,
  year: str(row.year_label),
  // Orders the list and the archive, exactly as it does for announcements.
  postedAt: iso(row.posted_at) || iso(row.created_at),
  tag: str(row.tag),
  title: str(row.title),
  body: str(row.body),
  published: bool(row.published),
});

export const achievementsToRows = (items) =>
  ordered(items, (a) => ({
    id: a._id || undefined,
    title: str(a.title),
    year_label: str(a.year),
    tag: str(a.tag),
    body: str(a.body),
    // Stamped on the way in when there is none; an existing one is kept, so
    // fixing a typo never moves an old result to the top of the list.
    posted_at: iso(a.postedAt) || new Date().toISOString(),
    published: a.published !== false,
  }));

// ------------------------------------------------------------------ projects

export const projectPartFromRow = (row) => ({
  _id: row.id,
  slug: str(row.slug),
  name: str(row.name),
  blurb: str(row.blurb),
  image: str(row.image),
  detail: arr(row.detail),
  specs: arr(row.specs),
  // A .glb the reader can turn over, and the drawings behind it.
  model: str(row.model),
  modelCaption: str(row.model_caption),
  cad: arr(row.cad),
});

export const projectFromRow = (row) => ({
  _id: row.id,
  slug: str(row.slug),
  n: str(row.n),
  title: str(row.title),
  status: str(row.status),
  timeline: str(row.timeline),
  summary: str(row.summary),
  body: str(row.body),
  image: str(row.image),
  published: bool(row.published),
  model: str(row.model),
  modelCaption: str(row.model_caption),
  cad: arr(row.cad),
  thesis: arr(row.thesis),
  /* Flat rather than one telemetry object, because this shape is also what the
     dashboard's forms edit and those are a flat list of fields per item. The
     project page assembles the four back into one before rendering. */
  telemetryCsv: str(row.telemetry_csv),
  telemetryX: str(row.telemetry_x),
  telemetryTitle: str(row.telemetry_title),
  telemetryBlurb: str(row.telemetry_blurb),
  telemetryCharts: arr(row.telemetry_charts),
  parts: byOrder(row.project_parts).map(projectPartFromRow),
});

export const projectsToRows = (items) =>
  ordered(items, (p, i) => ({
    id: p._id || undefined,
    slug: str(p.slug) || `project-${i + 1}`,
    n: str(p.n),
    title: str(p.title),
    status: str(p.status),
    timeline: str(p.timeline),
    summary: str(p.summary),
    body: str(p.body),
    image: str(p.image),
    published: p.published !== false,
    model: str(p.model),
    model_caption: str(p.modelCaption),
    cad: arr(p.cad),
    thesis: arr(p.thesis),
    telemetry_csv: str(p.telemetryCsv),
    telemetry_x: str(p.telemetryX),
    telemetry_title: str(p.telemetryTitle),
    telemetry_blurb: str(p.telemetryBlurb),
    telemetry_charts: arr(p.telemetryCharts),
  }));

export const projectPartsToRows = (parts, projectId) =>
  ordered(arr(parts), (part, i) => ({
    id: part._id || undefined,
    project_id: projectId,
    slug: str(part.slug) || `part-${i + 1}`,
    name: str(part.name),
    blurb: str(part.blurb),
    image: str(part.image),
    detail: arr(part.detail),
    specs: arr(part.specs),
    model: str(part.model),
    model_caption: str(part.modelCaption),
    cad: arr(part.cad),
  }));

// ---------------------------------------------------------------- committees

export const cohortMemberFromRow = (row) => ({
  _id: row.id,
  name: str(row.name),
  role: str(row.role),
  dept: str(row.dept),
  image: str(row.image),
  linkedin: str(row.linkedin),
  email: str(row.email),
});

export const cohortFromRow = (row) => ({
  _id: row.id,
  year: str(row.year),
  tag: str(row.tag),
  blurb: str(row.blurb),
  current: bool(row.is_current),
  members: byOrder(row.cohort_members).map(cohortMemberFromRow),
});

export const cohortsToRows = (items) =>
  ordered(items, (c, i) => ({
    id: c._id || undefined,
    year: str(c.year) || `Year ${i + 1}`,
    tag: str(c.tag),
    blurb: str(c.blurb),
    is_current: bool(c.current),
  }));

export const cohortMembersToRows = (members, cohortId) =>
  ordered(arr(members), (m) => ({
    id: m._id || undefined,
    cohort_id: cohortId,
    name: str(m.name),
    role: str(m.role),
    dept: str(m.dept),
    image: str(m.image),
    linkedin: str(m.linkedin),
    email: str(m.email),
  }));
