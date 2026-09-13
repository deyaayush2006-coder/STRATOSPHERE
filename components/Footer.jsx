import ContactForm from "./ContactForm";

/* Where the committee's dashboard answers.
 *
 * Read from the same environment variable the middleware routes on, so the
 * link follows the panel whenever it is renamed instead of pointing at a path
 * that has stopped existing. Inlined at build time, which is why it can sit at
 * module scope in a server component.
 *
 * Worth knowing: the panel is served from an unguessable path precisely so it
 * stays out of crawlers and scanner wordlists, and linking to it here gives
 * that up — the URL is now on every page of the site. The login and the row
 * level security policies are the actual security boundary, so the panel is no
 * weaker for it; what is lost is the quiet. Drop this link, not the rename, if
 * the club would rather keep it.
 */
const ADMIN_PATH = (process.env.NEXT_PUBLIC_ADMIN_PATH || "control-tower").replace(/^\/+|\/+$/g, "");
const ADMIN_HREF = `/${ADMIN_PATH}`;

/* Matched on the heading rather than on position, so reordering the columns in
   the dashboard does not move the link out of Useful Links. */
const isUsefulLinks = (col) => /useful/i.test(col?.title || "");

export default function Footer({ contact = {}, footerCols = [] }) {
  const { address = [], hours = [], email = "", phone = "" } = contact;

  /* The admin link hangs off a column, so there has to be one. A committee
     that clears every footer column in the dashboard would otherwise take the
     way back into the dashboard with it. */
  const columns = footerCols.length ? footerCols : [{ title: "Useful Links", links: [] }];

  /* Which column it joins. Falls back to the first, so the link survives the
     heading being renamed as well. */
  const adminCol = Math.max(columns.findIndex(isUsefulLinks), 0);

  return (
    <footer
      id="contact"
      className="mt-16 mx-4 mb-4 rounded-3xl glass scroll-mt-28 px-6 md:px-10 py-14"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 grid md:grid-cols-2 gap-10 md:gap-14 items-start">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold text-aurora2 tracking-[-0.02em]">
              Our Address
            </h3>
            <address className="not-italic font-mono text-sm text-ink/65 leading-relaxed mt-4">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>

            <h3 className="text-2xl md:text-3xl font-semibold text-aurora2 tracking-[-0.02em] mt-10">
              Email us
            </h3>
            <a
              href={`mailto:${email}`}
              className="inline-block font-mono text-sm text-ink/65 hover:text-aurora2 transition-colors mt-4"
            >
              {email}
            </a>
          </div>

          <ContactForm />
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-10 py-10 border-t border-ink/[0.08]">
          <nav className="flex flex-wrap gap-x-2 gap-y-8">
          {columns.map((c, i) => (
            // the flex gap is shared, so nudge only the third column
            <div key={c.title} className={i === 2 ? "lg:ml-8" : undefined}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
                {c.title}
              </h4>
              <div className="flex flex-col gap-2.5 items-start">
                {(c.links ?? []).map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="text-sm text-ink/60 hover:text-ink transition-colors w-fit"
                  >
                    {l.label}
                  </a>
                ))}

                {/* Rendered here rather than added to the editable link list,
                    so it cannot be lost by a footer edit and always points at
                    wherever the panel is currently served from. */}
                {i === adminCol && (
                  <a
                    href={ADMIN_HREF}
                    rel="nofollow"
                    className="text-sm text-ink/60 hover:text-aurora2 transition-colors w-fit inline-flex items-center gap-1.5"
                  >
                    Admin Portal
                    <span aria-hidden="true" className="font-mono text-[10px] text-ink/35">
                      ↗
                    </span>
                  </a>
                )}
              </div>
            </div>
          ))}
          </nav>

          <div className="md:-ml-16">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
              Contact us
            </h4>
            <div className="flex flex-col gap-2.5 font-mono text-[13px] leading-relaxed">
              <p className="text-ink/60">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="text-ink/60 whitespace-nowrap">
                Email:{" "}
                <a
                  href={`mailto:${email}`}
                  className="text-ink/80 underline underline-offset-2 hover:text-aurora2 transition-colors"
                >
                  {email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-mono text-[10px] gap-5 uppercase tracking-[0.22em] text-ink/35 mb-4">
              Office hours
            </h4>
            <dl className="flex flex-col gap-5 text-sm">
              {hours.map(([day, time]) => (
                <div key={day}>
                  <dt className="text-ink/60">{day}</dt>
                  <dd className="text-aurora2 font-mono text-[13px] m-0 mt-0.5">{time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-between pt-6 border-t border-ink/10 text-xs text-ink/40">
          <span>Made By Aerospace Club</span>
          <span>© Copyright 2026 STRATOSPHERE</span>
        </div>
      </div>
    </footer>
  );
}
