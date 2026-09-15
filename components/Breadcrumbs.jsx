import Link from "next/link";

/* The trail back out of a deep page.
 *
 * Takes { label, href } and renders the last one as plain text — the page you
 * are already on is not a link anywhere. `aria-current="page"` is what says so
 * to a screen reader, which otherwise hears the trail as a list ending in a
 * stray word.
 *
 * The ordered list is not decoration either: it is the structure a search
 * engine reads the trail from, and it is what puts "Home › Projects › CanSat"
 * under the result instead of a bare URL.
 */
export default function Breadcrumbs({ trail = [], className = "" }) {
  if (trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;

          return (
            <li key={`${crumb.href ?? "current"}-${crumb.label}`} className="flex items-center gap-2">
              {last || !crumb.href ? (
                /* Truncated rather than wrapped: a long project name is the
                   last crumb, and on a phone it would otherwise push the trail
                   onto a second and third line above the title that repeats
                   it anyway. */
                <span aria-current={last ? "page" : undefined} className="text-ink/65 truncate max-w-[14rem]">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="hover:text-aurora2 transition-colors">
                  {crumb.label}
                </Link>
              )}

              {!last && (
                <span aria-hidden="true" className="text-ink/25">
                  ›
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
