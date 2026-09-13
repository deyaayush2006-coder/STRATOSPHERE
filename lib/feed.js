/* Splitting a dated list into what is on the page and what is in the archive.
 *
 * Two sections work this way now — announcements and achievements — and they
 * work identically, so the rule lives here once rather than twice. The rule:
 * nothing is ever dropped. Lowering the visible count in the dashboard moves
 * entries into the archive, it does not delete them, and every one of them
 * keeps the moment it was posted. The front page can stay short without the
 * club losing its own record.
 *
 * Nothing in here knows what an announcement or an achievement *is*. It reads
 * three fields — postedAt, published, pinned — and the sections render their
 * own. That is what stops this becoming a second place where the shape of a
 * card is decided.
 */

const DEFAULTS = {
  visibleCount: 3,
  showArchive: true,
  archiveLabel: "Earlier entries",
};

/* The committee types into a text box, so this has to survive "", "  ", "abc"
   and 999 alike. 0 is a real answer — the pinned card only — and so is a
   ceiling, because a feed of two hundred would be nobody's intention. */
export function readSettings(settings, fallback = {}) {
  const base = { ...DEFAULTS, ...fallback };
  const raw = settings ?? {};
  const count = Number.parseInt(raw.visibleCount, 10);

  return {
    visibleCount: Number.isFinite(count) ? Math.min(Math.max(count, 0), 50) : base.visibleCount,
    showArchive: raw.showArchive !== false,
    archiveLabel: String(raw.archiveLabel || base.archiveLabel),
  };
}

const stamp = (item) => {
  const at = item?.postedAt ? new Date(item.postedAt) : null;
  return at && !Number.isNaN(at.getTime()) ? at.getTime() : null;
};

/* Newest first, and stable.
 *
 * An entry with no timestamp keeps the position the committee gave it in the
 * dashboard rather than being flung to one end: index is the tiebreak, and a
 * missing timestamp is compared as if it sat where it already is. That matters
 * most right after the upgrade, when nothing has been re-saved yet. */
export function sortByPosted(items) {
  return [...items]
    .map((item, index) => ({ item, index, at: stamp(item) }))
    .sort((x, y) => {
      if (x.at != null && y.at != null && x.at !== y.at) return y.at - x.at;
      return x.index - y.index;
    })
    .map(({ item }) => item);
}

/* What a section renders: an optional featured entry, a short recent list, and
   everything older folded away underneath.

   A pinned entry is deliberately outside the count. It is on the page because
   somebody pinned it, and a visible count of 1 should not then be the thing
   that hides it. Sections without a featured card pass allowPinned: false and
   the whole idea stays out of their way. */
export function splitFeed(items = [], settings, { allowPinned = false, fallback } = {}) {
  const { visibleCount, showArchive, archiveLabel } = readSettings(settings, fallback);

  const live = items.filter((item) => item && item.published !== false);
  const ordered = sortByPosted(live);

  const pinnedIndex = allowPinned ? ordered.findIndex((item) => item.pinned) : -1;
  const pinned = pinnedIndex === -1 ? null : ordered[pinnedIndex];
  const rest = pinnedIndex === -1 ? ordered : ordered.filter((_, i) => i !== pinnedIndex);

  return {
    pinned,
    recent: rest.slice(0, visibleCount),
    archived: showArchive ? rest.slice(visibleCount) : [],
    // Said plainly under the list even when the archive is switched off, so
    // "where did the rest go" always has an answer on the page.
    hiddenCount: Math.max(0, rest.length - visibleCount),
    showArchive,
    archiveLabel,
    visibleCount,
  };
}

/* Fixed locale and fixed zone, on purpose.
 *
 * These render on the server and then hydrate on a visitor's machine, and
 * letting either one pick up its own locale or timezone would make the two
 * disagree — which React reports as a hydration error. The club is in Kolkata,
 * so that is the clock every entry is stamped against. */
const KOLKATA = { timeZone: "Asia/Kolkata" };

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  ...KOLKATA,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateAndTime = new Intl.DateTimeFormat("en-GB", {
  ...KOLKATA,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatPosted(postedAt, { withTime = true } = {}) {
  if (!postedAt) return "";
  const at = new Date(postedAt);
  if (Number.isNaN(at.getTime())) return "";
  const formatted = (withTime ? dateAndTime : dateOnly).format(at);
  return withTime ? `${formatted} IST` : formatted;
}

/* The <time> element wants a machine-readable date, and it is not the same
   string a human reads. Empty means "no timestamp", and the caller leaves the
   attribute off rather than writing dateTime="". */
export function machineDate(postedAt) {
  if (!postedAt) return "";
  const at = new Date(postedAt);
  return Number.isNaN(at.getTime()) ? "" : at.toISOString();
}
