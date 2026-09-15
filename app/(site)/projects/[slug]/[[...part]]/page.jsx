import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { mediaUrl } from "@/lib/media-url";
import Breadcrumbs from "@/components/Breadcrumbs";
import CadGallery from "@/components/CadGallery";
import ModelViewer from "@/components/ModelViewer";
import Telemetry from "@/components/Telemetry";
import Thesis from "@/components/Thesis";
import PartCover from "./PartCover";

/* One route for both /projects/<slug> and /projects/<slug>/<part>. An optional
   catch-all rather than two files, because the second segment only ever picks
   which part is open — the page around it is identical. */

async function findProject(slug) {
  const { projects } = await getContent();
  return projects.find((p) => p.slug === slug);
}

export async function generateStaticParams() {
  const { projects } = await getContent();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) return {};

  return {
    title: `${project.title} — Stratosphere`,
    description: project.summary,
    openGraph: {
      title: `${project.title} — Stratosphere`,
      description: project.summary,
      images: project.image ? [mediaUrl(project.image)] : undefined,
    },
  };
}

export default async function ProjectDetail({ params }) {
  const { slug, part } = await params;
  const project = await findProject(slug);
  if (!project) notFound();

  const parts = project.parts ?? [];
  const partSlug = part?.[0];
  const active = parts.find((p) => p.slug === partSlug) ?? parts[0];

  /* The trail. The part is only on it when the URL actually names one —
     landing on /projects/cansat opens the first part, but the reader did not
     navigate to it and a crumb claiming they did would be a dead level. */
  const trail = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/#projects" },
    { label: project.title, href: partSlug ? `/projects/${project.slug}` : undefined },
    ...(partSlug && active ? [{ label: active.name }] : []),
  ];

  return (
    /* pt-28 rather than pt-32: the hero band that used to sit above this is
       gone, so the page starts under the nav card and nothing else. */
    <main className="px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <Breadcrumbs trail={trail} className="mb-6" />

      <header className="mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sm text-ink/35">{project.n}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2">
            {project.status}
          </span>
          <span className="font-mono text-[11px] text-ink/35">{project.timeline}</span>
        </div>

        <h1 className="text-4xl md:text-5xl text-ink font-semibold mt-4 tracking-[-0.03em] leading-[1.05]">
          {project.title}
        </h1>
        <p className="text-ink/65 mt-5 max-w-2xl leading-relaxed">{project.summary}</p>
      </header>

      {parts.length === 0 ? (
        // no parts written yet, so just the overview
        <article className="glass rounded-3xl overflow-hidden">
          {project.image && (
            <PartCover
              src={mediaUrl(project.image)}
              alt={project.title}
              priority
              className="w-full aspect-video object-cover bg-panel"
            />
          )}
          <div className="p-8 md:p-10">
            <span className="mono-label">Overview</span>
            <p className="text-ink/65 mt-4 leading-relaxed max-w-2xl">{project.body}</p>
          </div>
        </article>
      ) : (
        <div className="grid md:grid-cols-[16rem_1fr] gap-8 items-start">
          {/* part index */}
          <nav aria-label="Project parts" className="glass rounded-2xl p-3 md:sticky md:top-28">
            <ul className="flex md:flex-col gap-1 overflow-x-auto">
              {parts.map((p) => {
                const current = p.slug === active.slug;
                return (
                  <li key={p.slug} className="shrink-0 md:shrink">
                    <Link
                      href={`/projects/${project.slug}/${p.slug}`}
                      aria-current={current ? "page" : undefined}
                      className={`block rounded-xl px-4 py-3 transition-colors ${
                        current
                          ? "bg-ink/10 text-ink"
                          : "text-ink/60 hover:text-ink hover:bg-ink/5"
                      }`}
                    >
                      <span className="block text-sm font-semibold tracking-[-0.01em]">
                        {p.name}
                      </span>
                      <span className="hidden md:block text-xs text-ink/40 mt-0.5 leading-snug">
                        {p.blurb}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* the open part */}
          <div className="min-w-0">
            <article className="glass rounded-3xl overflow-hidden">
              <PartCover
                src={mediaUrl(active.image)}
                alt={`${active.name} — ${project.title}`}
                priority
                className="w-full aspect-video object-cover bg-panel"
              />

              <div className="p-8 md:p-10">
                <span className="mono-label">{project.title}</span>
                <h2 className="text-2xl md:text-3xl text-ink font-semibold mt-3 tracking-[-0.02em]">
                  {active.name}
                </h2>

                {(active.detail ?? []).map((para, i) => (
                  <p key={i} className="text-ink/65 mt-4 leading-relaxed max-w-2xl">
                    {para}
                  </p>
                ))}

                <dl className="grid sm:grid-cols-3 gap-6 mt-9 pt-8 border-t border-ink/10">
                  {(active.specs ?? []).map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35">
                        {label}
                      </dt>
                      <dd className="font-mono text-base text-ink m-0">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>

            {/* Anything this particular part carries of its own. Both hide
                themselves when there is nothing set, so a part with only prose
                on it looks exactly as it did before any of this existed. */}
            {active.model && (
              <div className="mt-8">
                <span className="mono-label">{active.name} — 3D model</span>
                <ModelViewer
                  src={active.model}
                  caption={active.modelCaption}
                  className="mt-4"
                />
              </div>
            )}

            <CadGallery shots={active.cad ?? []} title={`${active.name} — CAD & drawings`} />
          </div>
        </div>
      )}

      {/* The project as a whole, under whichever part is open. These are the
          long-form additions: the model you can turn over, the drawings behind
          it, the write-up, and the flight data. Each one is its own component
          and each returns null when the dashboard has nothing in it, so a
          project that uses none of them renders the page above and stops. */}
      {project.model && (
        <section className="mt-12">
          <span className="mono-label">3D model</span>
          <ModelViewer src={project.model} caption={project.modelCaption} className="mt-5" />
        </section>
      )}

      <CadGallery shots={project.cad ?? []} />

      <Thesis sections={project.thesis ?? []} />

      {/* Flattened rather than one telemetry object, because the dashboard
          edits the same shape the page renders and its forms are a flat list
          of fields per item. The assembling happens here, once. */}
      <Telemetry
        telemetry={{
          csv: project.telemetryCsv,
          x: project.telemetryX,
          charts: project.telemetryCharts,
        }}
        title={project.telemetryTitle}
        blurb={project.telemetryBlurb}
      />
    </main>
  );
}
