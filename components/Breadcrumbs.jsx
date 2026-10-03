import Link from "next/link";

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
