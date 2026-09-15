/* The long write-up on a project — the part that is closer to a report than to
 * a card.
 *
 * Each entry is a heading and a block of prose. The prose is split on blank
 * lines, so a member can paste several paragraphs into one textarea and get
 * paragraphs out, rather than having to add a row per paragraph the way the
 * shorter part descriptions do. That is the only formatting there is, and it
 * is on purpose: the alternative is accepting markup from the dashboard and
 * rendering it, which means either shipping a parser or trusting HTML typed
 * into a form.
 */

const paragraphs = (body) =>
  String(body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export default function Thesis({ sections = [], title = "Technical write-up" }) {
  const usable = sections.filter((s) => s?.heading || s?.body);
  if (usable.length === 0) return null;

  return (
    <section className="mt-12">
      <span className="mono-label">{title}</span>

      <div className="mt-6 space-y-10">
        {usable.map((section, i) => (
          <article key={`${section.heading}-${i}`}>
            {section.heading && (
              <h3 className="text-xl md:text-2xl text-ink font-semibold tracking-[-0.02em]">
                {section.heading}
              </h3>
            )}

            {/* max-w-2xl rather than the full column: this is body copy, and a
                line of it running the whole width of a 6xl page is about 140
                characters, which is roughly twice a comfortable measure. */}
            {paragraphs(section.body).map((para, p) => (
              <p key={p} className="text-ink/65 mt-4 leading-relaxed max-w-2xl">
                {para}
              </p>
            ))}

            {(section.figures ?? []).length > 0 && (
              <dl className="grid sm:grid-cols-3 gap-6 mt-7 pt-6 border-t border-ink/10">
                {section.figures.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35">
                      {label}
                    </dt>
                    <dd className="font-mono text-base text-ink m-0">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
