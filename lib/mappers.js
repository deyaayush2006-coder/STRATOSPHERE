import { slugify } from "./slug";

const str = (v) => (v == null ? "" : String(v));
const bool = (v) => Boolean(v);
const arr = (v) => (Array.isArray(v) ? v : []);

const byOrder = (rows) =>
  [...arr(rows)].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

const ordered = (items, toRow) => items.map((item, i) => ({ ...toRow(item, i), sort_order: i }));

const iso = (v) => {
  if (!v) return "";
  const at = new Date(v);
  return Number.isNaN(at.getTime()) ? "" : at.toISOString();
};

export const announcementFromRow = (row) => ({
  _id: row.id,
  id: str(row.slug),
  date: str(row.date_label),
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
    posted_at: iso(a.postedAt) || new Date().toISOString(),
    pinned: bool(a.pinned),
    published: a.published !== false,
  }));

export const eventFromRow = (row) => ({
  _id: row.id,
  slug: str(row.slug),
  when: str(row.when_status) || "upcoming",
  date: str(row.date_label),
  time: str(row.time_label),
  title: str(row.title),
  location: str(row.location),
  body: str(row.body),
  image: str(row.image),
  registerUrl: str(row.register_url),
  detail: arr(row.detail),
  gallery: arr(row.gallery),
  published: bool(row.published),
});

export const eventsToRows = (items) =>
  ordered(items, (e, i) => ({
    id: e._id || undefined,
    slug: slugify(e.slug) || slugify(e.title) || `event-${i + 1}`,
    title: str(e.title),
    when_status: e.when === "past" ? "past" : "upcoming",
    date_label: str(e.date) || "TBD",
    time_label: str(e.time) || "TBD",
    location: str(e.location),
    body: str(e.body),
    image: str(e.image),
    register_url: str(e.registerUrl),
    detail: arr(e.detail),
    gallery: arr(e.gallery),
    published: e.published !== false,
  }));

export const achievementFromRow = (row) => ({
  _id: row.id,
  year: str(row.year_label),
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
    posted_at: iso(a.postedAt) || new Date().toISOString(),
    published: a.published !== false,
  }));

export const projectPartFromRow = (row) => ({
  _id: row.id,
  slug: str(row.slug),
  name: str(row.name),
  blurb: str(row.blurb),
  image: str(row.image),
  detail: arr(row.detail),
  specs: arr(row.specs),
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
