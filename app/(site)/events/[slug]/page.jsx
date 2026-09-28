import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/content";
import { mediaUrl } from "@/lib/media-url";
import Breadcrumbs from "@/components/Breadcrumbs";
import CadGallery from "@/components/CadGallery";
import Cover from "@/components/Cover";
import Thesis from "@/components/Thesis";

/* One event, at /events/<slug>.
 *
 * The same shape as the project pages next door, and for the same reason: the
 * card on the home page has room for a date, a line of prose and a poster,
 * and a competition with a rule book, a prize list and a set of photos from
 * the day has more to say than that.
 *
 * Everything below the header hides itself when the dashboard has nothing in
 * it. An event with only the fields it has always had — date, time, location,
 * one paragraph, a poster — still renders a finished page rather than a frame
 * around three empty sections, which is what makes this safe to turn on for
 * every event at once instead of only the ones somebody has written up.
 */

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

  return {
    title,
    description: event.body,
    openGraph: {
      title,
      description: event.body,
      type: "article",
      images: event.image ? [mediaUrl(event.image)] : undefined,
    },
  };
}

export default async function EventDetail({ params }) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();

  const upcoming = event.when === "upcoming";

  /* TBD is the placeholder the dashboard tells the committee to use, and it is
     what an event gets before a date is fixed. On a card it is worth showing —
     "TBD" is news. In a details list next to Location and Status it is three
     rows of nothing, so the unset ones drop out. */
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
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.18em] rounded-full px-3 py-1 border ${
              upcoming ? "text-aurora2 border-aurora2/30" : "text-ink/40 border-ink/15"
            }`}
          >
            {upcoming ? "Upcoming" : "Past"}
          </span>
          {known(event.date) && (
            <span className="font-mono text-[11px] text-ink/45">{event.date}</span>
          )}
          {known(event.time) && (
            <span className="font-mono text-[11px] text-ink/35">{event.time}</span>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl text-ink font-semibold mt-4 tracking-[-0.03em] leading-[1.05]">
          {event.title}
        </h1>

        {event.location && (
          <p className="font-mono text-[11px] text-ink/40 mt-3">{event.location}</p>
        )}

        {event.body && (
          <p className="text-ink/65 mt-5 max-w-2xl leading-relaxed">{event.body}</p>
        )}
      </header>

      {/* The poster wide, then the write-up and the details side by side. The
          aside is second in the source so a screen reader and a phone both get
          the event before the table about it; md: puts it back on the right. */}
      <div className="grid md:grid-cols-[1fr_17rem] gap-8 items-start">
        {/* No wrapper around the poster: Cover returns nothing when the file
            is missing or fails to load, and a glass panel built to hold it
            would stay behind as an empty box. The rounding goes on the image
            itself so there is nothing left to leave. */}
        <div className="min-w-0">
          <Cover
            src={mediaUrl(event.image)}
            alt={event.title}
            priority
            className="w-full aspect-video object-cover bg-panel rounded-3xl"
          />
        </div>

        <aside className="glass rounded-2xl p-6 md:sticky md:top-28">
          <span className="mono-label">Details</span>

          {details.length > 0 ? (
            <dl className="mt-5 space-y-4">
              {details.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/35">
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

          {/* Registration is offered on an upcoming event and never on a past
              one, so a form that has closed stops being handed out without
              anybody having to remember to clear the field. */}
          {upcoming && event.registerUrl && (
            <Link
              href={event.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center rounded-full border border-aurora2/40 bg-aurora2/10
                px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-aurora2
                transition hover:bg-aurora2/20"
            >
              Register
            </Link>
          )}

          <Link
            href="/#events"
            className="mt-4 flex items-center justify-center rounded-full border border-ink/15 px-5 py-3
              font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60
              transition hover:border-ink/30 hover:text-ink"
          >
            All events
          </Link>
        </aside>
      </div>

      {/* Full width, under the two columns rather than inside the left one —
          the same place the project pages put theirs. Kept out of the grid so
          the photo grid gets the whole measure instead of sharing it with an
          aside that has already ended, and so neither leaves a tall empty
          column beside it.

          Both return null when the dashboard has nothing in them, which is
          what lets an event that is still just a card render this page with
          no gap where its write-up would go. */}
      <Thesis sections={event.detail ?? []} title="About this event" />

      <CadGallery shots={event.gallery ?? []} title="Photos" />
    </main>
  );
}
