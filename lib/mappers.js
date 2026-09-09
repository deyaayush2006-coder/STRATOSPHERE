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

export const announcementFromRow = (row) => ({
  _id: row.id,
  id: str(row.slug),
  date: str(row.date_label),
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
