import Image from "next/image";
import RichText from "./RichText";
import { isOptimisable, mediaUrl } from "@/lib/media-url";
import { slugify } from "@/lib/slug";

// Headed sections of prose (with LaTeX), an optional diagram each and an
// optional row of key figures. Used by project, event and Learn write-ups.

/** The anchor id each section gets when `anchors` is on, for a contents list. */
export function sectionAnchor(section, i) {
  return `${slugify(section?.heading) || "section"}-${i + 1}`;
}

export default function Thesis({ sections = [], title = "Technical write-up", anchors = false }) {
  const usable = sections.filter((s) => s?.heading || s?.body || s?.image);
  if (usable.length === 0) return null;

  return (
    <section className="mt-12">
      {title && <span className="font-sans text-xs font-medium tracking-wide text-aurora2">{title}</span>}

      <div className={`${title ? "mt-6 " : ""}space-y-10`}>
        {usable.map((section, i) => (
          <article
            key={`${section.heading}-${i}`}
            id={anchors ? sectionAnchor(section, i) : undefined}
            className={anchors ? "scroll-mt-28" : undefined}
          >
            {section.heading && (
              <h3 className="text-xl md:text-2xl text-ink font-semibold tracking-[-0.02em]">
                {section.heading}
              </h3>
            )}

            <RichText
              text={section.body}
              paragraphClassName="text-ink/65 mt-4 leading-relaxed max-w-2xl"
              displayClassName="mt-4 max-w-2xl text-ink/85"
            />

            {section.image && (
              <figure className="mt-6 max-w-2xl">
                <a
                  href={mediaUrl(section.image)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-2xl bg-panel ring-1 ring-ink/10 hover:ring-aurora2/40 transition"
                  aria-label={`Open full size: ${section.caption || section.heading || "diagram"}`}
                >
                  <Image
                    src={mediaUrl(section.image)}
                    alt={section.caption || section.heading || "Diagram"}
                    width={1200}
                    height={800}
                    sizes="(max-width: 768px) 100vw, 672px"
                    unoptimized={!isOptimisable(section.image)}
                    className="h-auto w-full object-contain"
                  />
                </a>
                {section.caption && (
                  <figcaption className="font-sans text-sm text-ink/55 mt-2 leading-snug">
                    {section.caption}
                  </figcaption>
                )}
              </figure>
            )}

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
