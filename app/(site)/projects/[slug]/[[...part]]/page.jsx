import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { mediaUrl } from "@/lib/media-url";
import Breadcrumbs from "@/components/Breadcrumbs";
import CadGallery from "@/components/CadGallery";
import ModelViewer from "@/components/ModelViewer";
import Telemetry from "@/components/Telemetry";
import Thesis from "@/components/Thesis";
import Cover from "@/components/Cover";

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

  const title = `${project.title} — Stratosphere`;
  const images = [project.image ? mediaUrl(project.image) : "/og-image.jpg"];

  return {
    title,
    description: project.summary,
    openGraph: { title, description: project.summary, images },
    twitter: { card: "summary_large_image", title, description: project.summary, images },
  };
}

export default async function ProjectDetail({ params }) {
  const { slug, part } = await params;
  const project = await findProject(slug);
  if (!project) notFound();

  const parts = project.parts ?? [];
  const partSlug = part?.[0];
  const active = parts.find((p) => p.slug === partSlug) ?? parts[0];

  const trail = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/#projects" },
    { label: project.title, href: partSlug ? `/projects/${project.slug}` : undefined },
    ...(partSlug && active ? [{ label: active.name }] : []),
  ];

  return (
    <main className="px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <Breadcrumbs trail={trail} className="mb-6" />

      <header className="mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-sans text-sm tabular-nums text-ink/40">{project.n}</span>
          <span className="font-sans text-xs font-medium tracking-wide text-aurora2">
            {project.status}
          </span>
          <span className="font-sans text-sm text-ink/45">{project.timeline}</span>
        </div>

        <h1 className="text-4xl md:text-5xl text-ink font-semibold mt-4 tracking-[-0.03em] leading-[1.05]">
          {project.title}
        </h1>
        <p className="text-ink/65 mt-5 max-w-2xl leading-relaxed">{project.summary}</p>
      </header>

      {parts.length === 0 ? (
        <article className="glass rounded-3xl overflow-hidden">
          {project.image && (
            <Cover
              src={mediaUrl(project.image)}
              alt={project.title}
              priority
              className="w-full aspect-video object-cover bg-panel"
            />
          )}
          <div className="p-8 md:p-10">
            <span className="font-sans text-xs font-medium tracking-wide text-aurora2">Overview</span>
            <p className="text-ink/65 mt-4 leading-relaxed max-w-2xl">{project.body}</p>
          </div>
        </article>
      ) : (
        <div className="grid md:grid-cols-[16rem_1fr] gap-8 items-start">
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

          <div className="min-w-0">
            <article className="glass rounded-3xl overflow-hidden">
              <Cover
                src={mediaUrl(active.image)}
                alt={`${active.name} — ${project.title}`}
                priority
                className="w-full aspect-video object-cover bg-panel"
              />

              <div className="p-8 md:p-10">
                <span className="font-sans text-xs font-medium tracking-wide text-aurora2">{project.title}</span>
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
                      <dt className="font-sans text-xs font-medium tracking-wide text-ink/45">
                        {label}
                      </dt>
                      <dd className="font-sans text-base font-medium text-ink m-0">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>

            {active.model && (
              <div className="mt-8">
                <span className="font-sans text-xs font-medium tracking-wide text-aurora2">
                  {active.name} · 3D model
                </span>
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

      {project.model && (
        <section className="mt-12">
          <span className="font-sans text-xs font-medium tracking-wide text-aurora2">3D model</span>
          <ModelViewer src={project.model} caption={project.modelCaption} className="mt-5" />
        </section>
      )}

      <CadGallery shots={project.cad ?? []} />

      <Thesis sections={project.thesis ?? []} />

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
