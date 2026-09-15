"use client";

import { useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import CardRail from "./CardRail";
import SectionHeader from "./SectionHeader";
import { mediaUrl } from "@/lib/media-url";

function EventCard({ event }) {
  const [failed, setFailed] = useState(false);
  const upcoming = event.when === "upcoming";

  return (
    <article className="group relative h-full flex flex-col glass rounded-2xl overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition duration-200">
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-200 z-10"
        aria-hidden="true"
      />

      {event.image && !failed && (
        /* Event posters are the heaviest images the home page carries — they
           come off a phone or a poster tool at full resolution and are painted
           into a card about 380px wide. */
        <Image
          src={mediaUrl(event.image)}
          alt=""
          width={800}
          height={450}
          loading="lazy"
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 380px"
          onError={() => setFailed(true)}
          className="w-full aspect-video object-cover bg-panel"
        />
      )}

      <div className="p-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.18em] rounded-full px-3 py-1 border ${
              upcoming
                ? "text-aurora2 border-aurora2/30"
                : "text-ink/40 border-ink/15"
            }`}
          >
            {event.date}
          </span>
          {event.time !== "TBD" && (
            <span className="font-mono text-[11px] text-ink/35">{event.time}</span>
          )}
        </div>

        <h3 className="text-ink text-[17px] font-semibold mt-4 tracking-[-0.01em] leading-snug">
          {event.title}
        </h3>
        <p className="font-mono text-[11px] text-ink/40 mt-2">{event.location}</p>
        <p className="text-sm text-ink/55 mt-3 leading-relaxed">{event.body}</p>
      </div>
    </article>
  );
}

export default function Events({ events = [] }) {
  const upcoming = events.filter((e) => e.when === "upcoming");
  const past = events.filter((e) => e.when === "past");

  return (
    <section id="events" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Events"
        blurb="Workshops, competitions and build sessions — what is coming up, and what we have already run."
      />

      {upcoming.length > 0 && (
        <Reveal className="mb-14">
          <CardRail title="Upcoming Events" label="upcoming events" cols="md:grid-cols-2">
            {upcoming.map((e) => (
              <EventCard key={e.title} event={e} />
            ))}
          </CardRail>
        </Reveal>
      )}

      {past.length > 0 && (
        <Reveal>
          <CardRail title="Past Events" label="past events">
            {past.map((e) => (
              <EventCard key={e.title + e.date} event={e} />
            ))}
          </CardRail>
        </Reveal>
      )}
    </section>
  );
}
