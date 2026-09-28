import FooterContact from "./FooterContact";
import SocialIcon, { socialLabel } from "./SocialIcon";

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
const ADMIN_PATH = (process.env.NEXT_PUBLIC_ADMIN_PATH || "admin").replace(/^\/+|\/+$/g, "");
const ADMIN_HREF = `/${ADMIN_PATH}`;

/* Matched on the heading rather than on position, so reordering the columns in
   the dashboard does not move the link out of Useful Links. */
const isUsefulLinks = (col) => /useful/i.test(col?.title || "");

/* `compact` drops the contact block and leaves the links and the copyright.
 *
 * FooterContact already takes itself off the detail pages, and it decides that
 * from the pathname because the layout that renders this has no idea which
 * route is open. That cannot answer for the 404, which has no route of its own
 * — it is whatever address was mistyped — so the caller says so instead.
 *
 * Two mechanisms for one block, which is worth being explicit about: the
 * pathname check is a rule about a kind of page, and this is one page saying
 * what it wants. Neither is a special case of the other. */
export default function Footer({ contact = {}, footerCols = [], compact = false }) {
  const { address = [], hours = [], email = "", phone = "", socials = [] } = contact;

  /* A row with no address is skipped rather than rendered as a dead icon —
     the dashboard says so in the field's own hint, and a half-filled entry is
     the normal state of a form someone is still working through. */
  const accounts = socials.filter((s) => s?.url);

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
      className="mt-16 mx-auto mb-4 rounded-3xl glass scroll-mt-28 px-6 md:px-10 py-14"
    >
      <div className="max-w-6xl mx-auto">
        {/* Rendering nothing here is already handled below: the links row
            carries first:border-t-0 first:pt-0, so when the contact block is
            absent it becomes the first child and drops the rule and the
            padding that were only ever there to separate it from this. */}
        {!compact && <FooterContact address={address} email={email} />}

        {/* Four columns now, so the step to four waits for lg rather than
            happening at md. At md this row is 768px wide at its narrowest and
            the Contact us column carries an email address on a single
            unbreakable line — a quarter of that is not enough for it, and it
            would push the row wider than the page. Two-by-two until there is
            room for four. */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10 py-10 border-t border-ink/[0.08] first:border-t-0 first:pt-0">
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
                    className="text-sm text-ink/60 hover:text-aurora2 transition-colors w-fit inline-flex items-center gap-1.5"
                  >
                    Admin
                    <span aria-hidden="true" className="font-mono text-[10px] text-ink/35">
                      ↗
                    </span>
                  </a>
                )}
              </div>
            </div>
          ))}
          </nav>

          {/* The -ml-16 that used to pull this left is gone with the third
              column: it was nudging one cell of a three-up row, and in a
              four-up one it put this heading out of line with the other
              three and over the edge of the column before it. */}
          <div>
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
              {/* break-words, not nowrap. An email address is one unbreakable
                  token, and a quarter-width column is narrower than this one
                  is — held on one line it ran 82px past its own column and
                  onto Office hours at 1024. */}
              <p className="text-ink/60 break-words">
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
          {accounts.length > 0 && (
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35 mb-4">
                Follow us
              </h4>
              <ul className="flex flex-wrap items-center gap-3">
                {accounts.map((s) => {
                  const name = s.label || socialLabel(s.platform);
                  return (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={name}
                        title={name}
                        className="grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink/70 transition
                          hover:border-aurora2/50 hover:text-aurora2 focus-visible:outline focus-visible:outline-2
                          focus-visible:outline-offset-2 focus-visible:outline-aurora2"
                      >
                        <SocialIcon platform={s.platform} className="h-[18px] w-[18px]" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        

        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-between pt-6 border-t border-ink/10 text-xs text-ink/40">
          <span>Made By Aerospace Club</span>
          <span>© Copyright 2026 STRATOSPHERE</span>
        </div>
      </div>
    </footer>
  );
}