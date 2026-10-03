export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 60);
}

export function withEventSlugs(events = []) {
  const taken = new Map();

  return events.map((event) => {
    const base = slugify(event?.slug) || slugify(event?.title) || "event";
    const n = (taken.get(base) ?? 0) + 1;
    taken.set(base, n);

    return { ...event, slug: n === 1 ? base : `${base}-${n}` };
  });
}
