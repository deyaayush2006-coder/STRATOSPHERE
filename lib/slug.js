/* Title to URL slug, and the one rule about it the whole site agrees on.
 *
 * It lives here rather than in the dashboard's schema because both ends need
 * it. The dashboard derives a slug as the committee types an event name; the
 * content layer falls back to one for a row written before events had the
 * column at all. schema.js re-exports this, so there is still one
 * implementation and the URL the dashboard shows is the URL the site serves.
 */
export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 60);
}

/* Every event carrying a slug, and no two carrying the same one.
 *
 * Applied once, in the content layer, so the cards on the home page and the
 * pages they link to are reading the same answer. Doing it at each call site
 * instead is how you get a card linking to /events/jalastra and a route that
 * only knows about /events/jalastra-2.
 *
 * Three things have to hold for that:
 *
 *   - an event with no slug still gets a page, because the column is newer
 *     than the rows in it and a committee that has not opened the dashboard
 *     since should not find every event 404ing;
 *   - a title that slugifies to nothing — all punctuation, or a script the
 *     transliteration drops — still gets something addressable;
 *   - two events that land on the same slug get told apart rather than one
 *     of them silently shadowing the other. The suffix rule is the same one
 *     the migration's backfill uses, so a row that arrives here unslugged
 *     gets the URL it will keep once the dashboard saves it.
 */
export function withEventSlugs(events = []) {
  const taken = new Map();

  return events.map((event) => {
    const base = slugify(event?.slug) || slugify(event?.title) || "event";
    const n = (taken.get(base) ?? 0) + 1;
    taken.set(base, n);

    return { ...event, slug: n === 1 ? base : `${base}-${n}` };
  });
}
