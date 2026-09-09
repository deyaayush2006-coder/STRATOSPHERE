/* What the dashboard shows, field by field.
 *
 * Every form in the panel is generated from this file — there is no bespoke
 * form per section. Adding a field to a card on the site means adding one line
 * here, not writing another editor. Keys must match `backend/config/sections.js`.
 *
 * Field types are rendered by fields.jsx:
 *   text | textarea | select | checkbox | image | stringList | pairList | list
 */

const SLUG_HINT = "Used in the page URL. Lowercase, dashes, no spaces.";

export const SECTIONS = [
  {
    key: "announcements",
    label: "Announcements",
    icon: "📣",
    kind: "list",
    itemName: "announcement",
    blurb:
      "The updates feed on the home page. One entry can be pinned to the top as the featured card.",
    title: (a) => a.title,
    subtitle: (a) => [a.date, a.tag].filter(Boolean).join(" · "),
    flag: (a) => (a.published === false ? "Draft" : a.pinned ? "Pinned" : null),
    blank: () => ({ id: "", date: "", tag: "Update", title: "", body: "", pinned: false, published: true }),
    fields: [
      { name: "title", label: "Headline", type: "text", required: true },
      { name: "id", label: "Id", type: "text", hint: SLUG_HINT, slugFrom: "title" },
      { name: "date", label: "Date", type: "text", hint: "Free text — April 2026, or Dates TBD" },
      { name: "tag", label: "Tag", type: "text", hint: "Recap, Upcoming, Result…" },
      { name: "body", label: "Body", type: "textarea", rows: 7 },
      { name: "pinned", label: "Pin as the featured announcement", type: "checkbox" },
      { name: "published", label: "Show this on the site", type: "checkbox" },
    ],
  },

  {
    key: "events",
    label: "Events",
    icon: "🗓️",
    kind: "list",
    itemName: "event",
    blurb:
      "Workshops and competitions. Upcoming and past are split automatically by the Status field.",
    title: (e) => e.title,
    subtitle: (e) => [e.date, e.location].filter(Boolean).join(" · "),
    flag: (e) => (e.published === false ? "Draft" : e.when === "upcoming" ? "Upcoming" : null),
    blank: () => ({
      when: "upcoming",
      date: "TBD",
      time: "TBD",
      title: "",
      location: "",
      body: "",
      image: "",
      published: true,
    }),
    fields: [
      { name: "title", label: "Event name", type: "text", required: true },
      {
        name: "when",
        label: "Status",
        type: "select",
        options: [
          { value: "upcoming", label: "Upcoming — shows in the top grid" },
          { value: "past", label: "Past — shows in the archive grid" },
        ],
      },
      { name: "date", label: "Date", type: "text", hint: "TBD is fine" },
      { name: "time", label: "Time", type: "text", hint: "Enter TBD to hide the time on the card" },
      { name: "location", label: "Location", type: "text" },
      { name: "body", label: "Description", type: "textarea", rows: 5 },
      { name: "image", label: "Poster", type: "image" },
      { name: "published", label: "Show this on the site", type: "checkbox" },
    ],
  },

  {
    key: "projects",
    label: "Projects",
    icon: "🚀",
    kind: "list",
    itemName: "project",
    blurb:
      "Each project gets its own page. Add parts to turn that page into a multi-section write-up.",
    title: (p) => p.title,
    subtitle: (p) => [p.status, p.timeline].filter(Boolean).join(" · "),
    flag: (p) =>
      p.published === false ? "Draft" : p.parts?.length ? `${p.parts.length} parts` : null,
    blank: () => ({
      slug: "",
      n: "",
      title: "",
      status: "Ongoing",
      timeline: "",
      summary: "",
      body: "",
      image: "",
      published: true,
      parts: [],
    }),
    fields: [
      { name: "title", label: "Project name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", hint: SLUG_HINT, slugFrom: "title", required: true },
      { name: "n", label: "Number", type: "text", hint: "The small 01 / 02 label on the card" },
      { name: "status", label: "Status", type: "text", hint: "Ongoing, Completed, Paused…" },
      { name: "timeline", label: "Timeline", type: "text", hint: "e.g. Jan 2025 - Ongoing" },
      {
        name: "summary",
        label: "Card summary",
        type: "textarea",
        rows: 3,
        hint: "One or two lines, shown on the home page",
      },
      {
        name: "body",
        label: "Overview",
        type: "textarea",
        rows: 6,
        hint: "Shown on the project page when there are no parts",
      },
      { name: "image", label: "Cover image", type: "image" },
      { name: "published", label: "Show this on the site", type: "checkbox" },
      {
        name: "parts",
        label: "Parts",
        type: "list",
        itemName: "part",
        hint: "Leave empty and the project page just shows the overview above",
        title: (part) => part.name,
        subtitle: (part) => part.blurb,
        blank: () => ({ slug: "", name: "", blurb: "", image: "", detail: [], specs: [] }),
        fields: [
          { name: "name", label: "Part name", type: "text", required: true },
          { name: "slug", label: "URL slug", type: "text", hint: SLUG_HINT, slugFrom: "name" },
          { name: "blurb", label: "Short blurb", type: "text", hint: "Shown under the name in the side index" },
          { name: "image", label: "Image", type: "image" },
          { name: "detail", label: "Paragraphs", type: "stringList", itemName: "paragraph", multiline: true },
          { name: "specs", label: "Specs", type: "pairList", keyLabel: "Label", valueLabel: "Value" },
        ],
      },
    ],
  },

  {
    key: "memberCohorts",
    label: "Committees",
    icon: "👥",
    kind: "list",
    itemName: "committee year",
    blurb:
      "One entry per academic year, oldest first. Tick Current on the committee running the club now.",
    title: (c) => c.year,
    subtitle: (c) => `${c.members?.length ?? 0} members${c.tag ? ` · ${c.tag}` : ""}`,
    flag: (c) => (c.current ? "Current" : null),
    blank: () => ({ year: "", tag: "", current: false, blurb: "", members: [] }),
    fields: [
      { name: "year", label: "Academic year", type: "text", required: true, hint: "e.g. 2026–27" },
      { name: "tag", label: "Tag", type: "text", hint: "Founded, Growth, Current…" },
      { name: "blurb", label: "One-line summary", type: "textarea", rows: 2 },
      { name: "current", label: "This is the committee running the club now", type: "checkbox" },
      {
        name: "members",
        label: "Members",
        type: "list",
        itemName: "member",
        title: (m) => m.name,
        subtitle: (m) => m.role,
        compact: true,
        blank: () => ({ name: "", role: "", dept: "", image: "", linkedin: "", email: "" }),
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "role", label: "Role", type: "text" },
          { name: "dept", label: "Department", type: "text" },
          { name: "image", label: "Photo", type: "image", hint: "Left empty, the card shows their initials" },
          { name: "linkedin", label: "LinkedIn URL", type: "text" },
          { name: "email", label: "Email", type: "text", hint: "Shown only when there is no LinkedIn link" },
        ],
      },
    ],
  },

  {
    key: "achievements",
    label: "Achievements",
    icon: "🏆",
    kind: "list",
    itemName: "achievement",
    blurb: "The results list. Newest first reads best here.",
    title: (a) => a.title,
    subtitle: (a) => [a.year, a.tag].filter(Boolean).join(" · "),
    flag: (a) => (a.published === false ? "Draft" : null),
    blank: () => ({ year: "", tag: "", title: "", body: "", published: true }),
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "year", label: "When", type: "text", hint: "e.g. January 2025" },
      { name: "tag", label: "Tag", type: "text", hint: "Competition, Research, Recognition…" },
      { name: "body", label: "Description", type: "textarea", rows: 5 },
      { name: "published", label: "Show this on the site", type: "checkbox" },
    ],
  },

  {
    key: "about",
    label: "About",
    icon: "📄",
    kind: "object",
    blurb: "The About section: the opening lines, the two pillars, and the four numbers underneath.",
    fields: [
      { name: "lead", label: "Lead paragraph", type: "textarea", rows: 3 },
      { name: "body", label: "Body paragraphs", type: "stringList", itemName: "paragraph", multiline: true },
      {
        name: "pillars",
        label: "Pillars",
        type: "list",
        itemName: "pillar",
        hint: "Laid out in two columns — a third entry would need a design change",
        title: (p) => p.title,
        blank: () => ({ title: "", body: "" }),
        fields: [
          { name: "title", label: "Heading", type: "text", required: true },
          { name: "body", label: "Body", type: "textarea", rows: 5 },
        ],
      },
      {
        name: "facts",
        label: "Numbers",
        type: "list",
        itemName: "number",
        hint: "Four fit the row cleanly",
        title: (f) => `${f.value} — ${f.label}`,
        compact: true,
        blank: () => ({ label: "", value: "" }),
        fields: [
          { name: "value", label: "Figure", type: "text", required: true, hint: "e.g. 60+" },
          { name: "label", label: "Caption", type: "text", required: true },
        ],
      },
    ],
  },

  {
    key: "contact",
    label: "Contact & hours",
    icon: "✉️",
    kind: "object",
    blurb: "Shown in the footer, in two places. The email also powers the Email us link.",
    fields: [
      { name: "email", label: "Email", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "address", label: "Address", type: "stringList", itemName: "line", hint: "One line per row" },
      { name: "hours", label: "Office hours", type: "pairList", keyLabel: "Day(s)", valueLabel: "Hours" },
    ],
  },

  {
    key: "site",
    label: "Backdrop & logo",
    icon: "🖼️",
    kind: "object",
    blurb: "The images behind everything: the fixed backdrop, the nav logo, and the hero video.",
    fields: [
      { name: "backdrop", label: "Page backdrop", type: "image", hint: "Held at low opacity behind every section" },
      { name: "logo", label: "Nav logo", type: "image" },
      {
        name: "heroVideo",
        label: "Hero video",
        type: "text",
        hint: "A path under public/ (e.g. /vid.mp4) or a full URL. Video is not uploaded through this panel.",
      },
    ],
  },

  {
    key: "showcaseClips",
    label: "Video showcase",
    icon: "🎬",
    kind: "list",
    itemName: "clip",
    blurb:
      "Footage from the field. The first clip is the large one. Leave this empty and the whole section is hidden.",
    title: (c) => c.title,
    subtitle: (c) => c.meta,
    blank: () => ({ title: "", meta: "", src: "", poster: "" }),
    fields: [
      { name: "title", label: "Caption", type: "text", required: true },
      { name: "meta", label: "Eyebrow", type: "text", hint: "The small label above the caption" },
      { name: "src", label: "Video path", type: "text", hint: "e.g. /videos/flight-01.mp4 — put the file in public/" },
      { name: "poster", label: "Poster frame", type: "image" },
    ],
  },

  {
    key: "navLinks",
    label: "Navigation",
    icon: "🧭",
    kind: "list",
    itemName: "link",
    blurb: "The menu behind the Menu button. Section links look like /#events.",
    title: (l) => l.label,
    subtitle: (l) => l.href,
    compact: true,
    blank: () => ({ label: "", href: "" }),
    fields: [
      { name: "label", label: "Label", type: "text", required: true },
      { name: "href", label: "Link", type: "text", required: true, hint: "/#events, /projects/cansat, or a full URL" },
    ],
  },

  {
    key: "footerCols",
    label: "Footer links",
    icon: "🔗",
    kind: "list",
    itemName: "column",
    blurb: "The link columns in the footer.",
    title: (c) => c.title,
    subtitle: (c) => `${c.links?.length ?? 0} links`,
    blank: () => ({ title: "", links: [] }),
    fields: [
      { name: "title", label: "Column heading", type: "text", required: true },
      {
        name: "links",
        label: "Links",
        type: "list",
        itemName: "link",
        compact: true,
        title: (l) => l.label,
        subtitle: (l) => l.href,
        blank: () => ({ label: "", href: "" }),
        fields: [
          { name: "label", label: "Label", type: "text", required: true },
          { name: "href", label: "Link", type: "text", required: true },
        ],
      },
    ],
  },
];

export const sectionByKey = Object.fromEntries(SECTIONS.map((s) => [s.key, s]));

/* Title to URL slug. Anything that is not a letter or digit becomes a dash. */
export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 60);
}
