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
      <span className="font-sans text-xs font-medium tracking-wide text-aurora2">{title}</span>

      <div className="mt-6 space-y-10">
        {usable.map((section, i) => (
          <article key={`${section.heading}-${i}`}>
            {section.heading && (
              <h3 className="text-xl md:text-2xl text-ink font-semibold tracking-[-0.02em]">
                {section.heading}
              </h3>
            )}

            {paragraphs(section.body).map((para, p) => (
              <p key={p} className="text-ink/65 mt-4 leading-relaxed max-w-2xl">
                {para}
              </p>
            ))}

            {(section.figures ?? []).length > 0 && (
              <dl className="grid sm:grid-cols-3 gap-6 mt-7 pt-6 border-t border-ink/10">
                {section.figures.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <dt className="font-sans text-xs font-medium tracking-wide text-ink/45">
                      {label}
                    </dt>
                    <dd className="font-sans text-base font-medium text-ink m-0">{value}</dd>
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
