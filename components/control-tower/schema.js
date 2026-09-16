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

/* The posted time, on one line of a list row.
   Fixed locale and fixed zone because this renders on the server first and
   then hydrates — letting either end pick its own would make the two disagree.
   Asia/Kolkata is the clock the committee is working to. */
const POSTED = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function postedLabel(item) {
  if (!item?.postedAt) return "";
  const at = new Date(item.postedAt);
  return Number.isNaN(at.getTime()) ? "" : POSTED.format(at);
}

export const SECTIONS = [
  {
    key: "announcements",
    label: "Announcements",
    icon: "📣",
    kind: "list",
    itemName: "announcement",
    blurb:
      "Everything the club has ever posted. One entry can be pinned to the top as the featured card; how many of the rest reach the home page is set under Announcement display. Nothing here is ever dropped from the record — older entries move into the archive on the page.",
    title: (a) => a.title,
    subtitle: (a) => [postedLabel(a), a.date, a.tag].filter(Boolean).join(" · "),
    flag: (a) => (a.published === false ? "Draft" : a.pinned ? "Pinned" : null),
    blank: () => ({
      id: "",
      date: "",
      postedAt: new Date().toISOString(),
      tag: "Update",
      title: "",
      body: "",
      pinned: false,
      published: true,
    }),
    fields: [
      { name: "title", label: "Headline", type: "text", required: true },
      { name: "id", label: "Id", type: "text", hint: SLUG_HINT, slugFrom: "title", unique: true },
      { name: "date", label: "Date", type: "text", hint: "Free text — April 2026, or Dates TBD" },
      {
        name: "postedAt",
        label: "Posted",
        type: "datetime",
        hint: "The real time this went up. It decides the order of the feed and the archive, and it is what the card shows once the free-text date above stops being enough to place it. Left empty, it is stamped when you save.",
      },
      { name: "tag", label: "Tag", type: "text", hint: "Recap, Upcoming, Result…" },
      { name: "body", label: "Body", type: "textarea", rows: 7 },
      { name: "pinned", label: "Pin as the featured announcement", type: "checkbox" },
      { name: "published", label: "Show this on the site", type: "checkbox" },
    ],
  },

  {
    key: "announcementSettings",
    label: "Announcement display",
    icon: "🔢",
    kind: "object",
    blurb:
      "How much of the feed reaches the home page. This only changes what is on display — every announcement stays on record with the time it was posted, and the ones that do not fit fold into the archive underneath.",
    fields: [
      {
        name: "visibleCount",
        label: "Recent announcements on the page",
        type: "number",
        min: 0,
        max: 50,
        hint: "How many of the newest ones show under the featured card. The pinned card is always on the page and is not counted here. Set 0 to show the pinned card on its own.",
      },
      {
        name: "showArchive",
        label: "Offer the older ones in an archive below",
        type: "checkbox",
      },
      {
        name: "archiveLabel",
        label: "Archive heading",
        type: "text",
        hint: "The wording on the button that opens it.",
      },
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
      model: "",
      modelCaption: "",
      cad: [],
      thesis: [],
      telemetryTitle: "",
      telemetryBlurb: "",
      telemetryX: "",
      telemetryCsv: "",
      telemetryCharts: [],
      parts: [],
    }),
    fields: [
      { name: "title", label: "Project name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", hint: SLUG_HINT, slugFrom: "title", required: true, unique: true },
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
        name: "model",
        label: "3D model",
        type: "text",
        hint:
          "A .glb or .gltf file, which visitors can drag to rotate on the project page. " +
          "Put the file in public/models/ and write the path here (e.g. /models/f22-raptor.glb), " +
          "or paste a full URL. Export it from your CAD tool as glTF and keep it under about " +
          "10 MB — it downloads before it can be shown. Leave empty and no model is shown.",
      },
      {
        name: "modelCaption",
        label: "Model caption",
        type: "text",
        hint: "Shown under the model — the scale, the revision, what it was exported from",
      },
      {
        name: "cad",
        label: "CAD drawings & renders",
        type: "list",
        itemName: "drawing",
        hint:
          "Shown as a grid on the project page; clicking one opens it full size. " +
          "Images only — the model above is the interactive one.",
        title: (s) => s.caption || s.src,
        compact: true,
        blank: () => ({ src: "", caption: "" }),
        fields: [
          { name: "src", label: "Image", type: "image", required: true },
          {
            name: "caption",
            label: "Caption",
            type: "text",
            hint: "What the drawing shows. Also what a screen reader reads out.",
          },
        ],
      },
      {
        name: "thesis",
        label: "Technical write-up",
        type: "list",
        itemName: "section",
        hint:
          "The long-form report on the project — design rationale, analysis, testing, results. " +
          "One entry per section; leave the whole thing empty and the page stops at the parts above.",
        title: (s) => s.heading,
        subtitle: (s) => (s.body || "").slice(0, 80),
        blank: () => ({ heading: "", body: "", figures: [] }),
        fields: [
          { name: "heading", label: "Section heading", type: "text", required: true },
          {
            name: "body",
            label: "Body",
            type: "textarea",
            rows: 10,
            hint: "Leave a blank line between paragraphs and they come out as paragraphs.",
          },
          {
            name: "figures",
            label: "Key figures",
            type: "pairList",
            keyLabel: "Label",
            valueLabel: "Value",
            hint: "Optional — shown as a row under the section, e.g. Apogee / 412 m",
          },
        ],
      },

      {
        name: "telemetryTitle",
        label: "Flight data — heading",
        type: "text",
        hint: "e.g. Launch 3 — 14 March 2026. Left empty it reads Telemetry.",
      },
      {
        name: "telemetryBlurb",
        label: "Flight data — intro",
        type: "textarea",
        rows: 3,
        hint: "A line or two about the flight this data came from",
      },
      {
        name: "telemetryCsv",
        label: "Flight data — CSV",
        type: "textarea",
        rows: 10,
        hint:
          "Paste the cleaned log, first row the column names: time,altitude,pressure,temperature. " +
          "Charts and the peak/min/final figures are worked out from this. " +
          "Long logs are thinned for drawing — the figures are always taken from every row. " +
          "Leave empty and the whole flight-data section is hidden.",
      },
      {
        name: "telemetryX",
        label: "Flight data — x axis column",
        type: "text",
        hint:
          "The column every chart is plotted against. Left empty, a column called time " +
          "(or t, seconds, elapsed) is used, and failing that the first numeric one.",
      },
      {
        name: "telemetryCharts",
        label: "Flight data — charts",
        type: "list",
        itemName: "chart",
        hint:
          "Which columns get a chart, in order. Leave this empty and every numeric column " +
          "other than the x axis gets one.",
        title: (c) => c.label || c.field,
        subtitle: (c) => [c.field, c.unit].filter(Boolean).join(" · "),
        compact: true,
        blank: () => ({ field: "", label: "", unit: "" }),
        fields: [
          {
            name: "field",
            label: "Column name",
            type: "text",
            required: true,
            hint: "Exactly as it is spelled in the CSV header",
          },
          { name: "label", label: "Chart title", type: "text", hint: "e.g. Altitude" },
          { name: "unit", label: "Unit", type: "text", hint: "e.g. m, hPa, °C" },
        ],
      },

      {
        name: "parts",
        label: "Parts",
        type: "list",
        itemName: "part",
        hint: "Leave empty and the project page just shows the overview above",
        title: (part) => part.name,
        subtitle: (part) => part.blurb,
        blank: () => ({
          slug: "",
          name: "",
          blurb: "",
          image: "",
          detail: [],
          specs: [],
          model: "",
          modelCaption: "",
          cad: [],
        }),
        fields: [
          { name: "name", label: "Part name", type: "text", required: true },
          { name: "slug", label: "URL slug", type: "text", hint: SLUG_HINT, slugFrom: "name", unique: true },
          { name: "blurb", label: "Short blurb", type: "text", hint: "Shown under the name in the side index" },
          { name: "image", label: "Image", type: "image" },
          { name: "detail", label: "Paragraphs", type: "stringList", itemName: "paragraph", multiline: true },
          { name: "specs", label: "Specs", type: "pairList", keyLabel: "Label", valueLabel: "Value" },
          {
            name: "model",
            label: "3D model",
            type: "text",
            hint:
              "A .glb or .gltf for this part specifically, shown under it and rotatable. " +
              "Path under public/models/ or a full URL. The project's own model is set further up.",
          },
          { name: "modelCaption", label: "Model caption", type: "text" },
          {
            name: "cad",
            label: "CAD drawings & renders",
            type: "list",
            itemName: "drawing",
            hint: "Shown as a grid under this part",
            title: (s) => s.caption || s.src,
            compact: true,
            blank: () => ({ src: "", caption: "" }),
            fields: [
              { name: "src", label: "Image", type: "image", required: true },
              { name: "caption", label: "Caption", type: "text" },
            ],
          },
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
      { name: "year", label: "Academic year", type: "text", required: true, unique: true, hint: "e.g. 2026–27" },
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
    blurb:
      "Everything the club has won, run or finished. How many of the most recent reach the home page is set under Achievement display — the rest move into the archive on the page rather than off the record.",
    title: (a) => a.title,
    subtitle: (a) => [postedLabel(a), a.year, a.tag].filter(Boolean).join(" · "),
    flag: (a) => (a.published === false ? "Draft" : null),
    blank: () => ({
      year: "",
      postedAt: new Date().toISOString(),
      tag: "",
      title: "",
      body: "",
      published: true,
    }),
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "year", label: "When", type: "text", hint: "e.g. January 2025, or just 2025" },
      {
        name: "postedAt",
        label: "Happened",
        type: "datetime",
        hint: "The real date behind the label above. It decides the order of the list and the archive, and it is what the row shows once the label stops being enough to place it. Left empty, it is stamped when you save.",
      },
      { name: "tag", label: "Tag", type: "text", hint: "Competition, Research, Recognition…" },
      { name: "body", label: "Description", type: "textarea", rows: 5 },
      { name: "published", label: "Show this on the site", type: "checkbox" },
    ],
  },

  {
    key: "achievementSettings",
    label: "Achievement display",
    icon: "🔢",
    kind: "object",
    blurb:
      "How much of the results list reaches the home page. This only changes what is on display — every achievement stays on record with its date, and the ones that do not fit fold into the archive underneath.",
    fields: [
      {
        name: "visibleCount",
        label: "Recent achievements on the page",
        type: "number",
        min: 0,
        max: 50,
        hint: "How many of the most recent ones show. Everything older moves into the archive below them.",
      },
      {
        name: "showArchive",
        label: "Offer the older ones in an archive below",
        type: "checkbox",
      },
      {
        name: "archiveLabel",
        label: "Archive heading",
        type: "text",
        hint: "The wording on the button that opens it.",
      },
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
    blurb:
      "The footer: the paragraph about the club, how to reach it, and the accounts it is on. " +
      "The email also powers the Email us link on the contact form.",
    fields: [
      {
        name: "blurb",
        label: "Footer paragraph",
        type: "textarea",
        rows: 4,
        hint: "The first column of the footer — two or three lines on who the club is",
      },
      { name: "email", label: "Email", type: "text" },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        hint: "Shown in the footer and made dialable. Leave empty to hide the line.",
      },
      { name: "address", label: "Address", type: "stringList", itemName: "line", hint: "One line per row" },
      { name: "hours", label: "Office hours", type: "pairList", keyLabel: "Day(s)", valueLabel: "Hours" },
      {
        name: "socials",
        label: "Follow us",
        type: "list",
        itemName: "account",
        hint:
          "The icon row in the footer. Leave it empty and the whole Follow Us column is hidden — " +
          "better than an empty column, and better than a wrong handle.",
        title: (s) => s.label || s.platform,
        subtitle: (s) => s.url,
        compact: true,
        blank: () => ({ platform: "instagram", url: "", label: "" }),
        fields: [
          {
            name: "platform",
            label: "Platform",
            type: "select",
            options: [
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "facebook", label: "Facebook" },
              { value: "x", label: "X (Twitter)" },
              { value: "youtube", label: "YouTube" },
              { value: "github", label: "GitHub" },
              { value: "link", label: "Something else — generic link icon" },
            ],
          },
          {
            name: "url",
            label: "Profile URL",
            type: "text",
            required: true,
            hint: "The full address, https:// and all. A row with no URL is skipped.",
          },
          {
            name: "label",
            label: "Name it reads out as",
            type: "text",
            hint: "Optional — for screen readers. Left empty it uses the platform name.",
          },
        ],
      },
    ],
  },

  {
    key: "site",
    label: "Backdrop & logo",
    icon: "🖼️",
    kind: "object",
    blurb: "What sits behind everything: the backdrop reel, the still behind it, and the nav logo.",
    fields: [
      {
        name: "heroVideo",
        label: "Backdrop video",
        type: "text",
        hint: "Plays behind the whole site at low opacity. A path under public/ (e.g. /vid.mp4) or a full URL. Video is not uploaded through this panel — leave it empty to use the still on its own.",
      },
      {
        name: "backdrop",
        label: "Backdrop still",
        type: "image",
        hint: "The video's poster while it loads, and what shows instead of it for anyone who has asked for less motion.",
      },
      { name: "logo", label: "Nav logo", type: "image" },
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
