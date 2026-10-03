const DEFAULTS = {
  visibleCount: 3,
  showArchive: true,
  archiveLabel: "Earlier entries",
};

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

export function sortByPosted(items) {
  return [...items]
    .map((item, index) => ({ item, index, at: stamp(item) }))
    .sort((x, y) => {
      if (x.at != null && y.at != null && x.at !== y.at) return y.at - x.at;
      return x.index - y.index;
    })
    .map(({ item }) => item);
}

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
    hiddenCount: Math.max(0, rest.length - visibleCount),
    showArchive,
    archiveLabel,
    visibleCount,
  };
}

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

export function machineDate(postedAt) {
  if (!postedAt) return "";
  const at = new Date(postedAt);
  return Number.isNaN(at.getTime()) ? "" : at.toISOString();
}
