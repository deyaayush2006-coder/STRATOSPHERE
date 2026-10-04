import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { mediaUrl } from "@/lib/media-url";
import Breadcrumbs from "@/components/Breadcrumbs";
import CadGallery from "@/components/CadGallery";
import Cover from "@/components/Cover";
import SplitHeading from "@/components/SplitHeading";
import Thesis from "@/components/Thesis";
import Label from "@/components/Label";

async function findEvent(slug) {
  const { events } = await getContent();
  return events.find((e) => e.slug === slug);
}

export async function generateStaticParams() {
  const { events } = await getContent();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) return {};

  const title = `${event.title} — Stratosphere`;
  const images = [event.image ? mediaUrl(event.image) : "/og-image.jpg"];

  return {
    title,
    description: event.body,
    openGraph: { title, description: event.body, type: "article", images },
    twitter: { card: "summary_large_image", title, description: event.body, images },
  };
}

export default async function EventDetail({ params }) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();

  const upcoming = event.when === "upcoming";

  const known = (v) => v && v !== "TBD";

  const details = [
    ["Date", event.date],
    ["Time", event.time],
    ["Location", event.location],
  ].filter(([, value]) => known(value));

  return (
    <main className="px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <Breadcrumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Events", href: "/#events" },
          { label: event.title },
        ]}
        className="mb-6"
      />

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <Label dot muted={!upcoming}>{upcoming ? "Upcoming" : "Past"}</Label>
          {known(event.date) && (
            <span className="font-sans text-sm text-ink/45">{event.date}</span>
          )}
          {known(event.time) && (
            <span className="font-sans text-sm text-ink/40">{event.time}</span>
          )}
        </div>

        <SplitHeading className="text-4xl md:text-5xl text-ink font-semibold mt-4 tracking-[-0.03em] leading-[1.05]">
          {event.title}
        </SplitHeading>

        {event.location && (
          <p className="font-sans text-sm text-ink/45 mt-3">{event.location}</p>
        )}

        {event.body && (
          <p className="text-ink/65 mt-5 max-w-2xl leading-relaxed">{event.body}</p>
        )}
      </header>

      <div className="grid md:grid-cols-[1fr_17rem] gap-8 items-start">
        <div className="min-w-0">
          <Cover
            reveal
            src={mediaUrl(event.image)}
            alt={event.title}
            priority
            className="w-full aspect-video object-cover bg-panel rounded-3xl"
          />
        </div>

        <aside className="glass rounded-2xl p-6 md:sticky md:top-28">
          <span className="font-sans text-xs font-medium tracking-wide text-aurora2">Details</span>

          {details.length > 0 ? (
            <dl className="mt-5 space-y-4">
              {details.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="font-sans text-xs font-medium tracking-wide text-ink/45">
                    {label}
                  </dt>
                  <dd className="text-sm text-ink m-0 leading-snug">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-ink/45 mt-5 leading-relaxed">
              Dates and venue are still being finalised.
            </p>
          )}

          {upcoming && event.registerUrl && (
            <Link
              href={event.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center rounded-full border border-aurora2/40 bg-aurora2/10
                px-5 py-3 font-sans text-sm font-semibold text-aurora2
                transition hover:bg-aurora2/20"
            >
              Register
            </Link>
          )}

          <Link
            href="/#events"
            className="mt-4 flex items-center justify-center rounded-full border border-ink/15 px-5 py-3
              font-sans text-sm font-semibold text-ink/60
              transition hover:border-ink/30 hover:text-ink"
          >
            All events
          </Link>
        </aside>
      </div>

      <Thesis sections={event.detail ?? []} title="About this event" />

      <CadGallery shots={event.gallery ?? []} title="Photos" />
    </main>
  );
}
