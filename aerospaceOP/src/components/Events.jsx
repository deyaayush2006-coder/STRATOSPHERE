import React, { useState } from "react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { EVENTS } from "../../data";

function EventCard({ event }) {
  const [failed, setFailed] = useState(false);
  const upcoming = event.when === "upcoming";

  return (
    <article className="group relative glass rounded-2xl overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition duration-300">
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 z-10"
        aria-hidden="true"
      />

      {event.image && !failed && (
        <img
          src={event.image}
          alt=""
          loading="lazy"
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

export default function Events() {
  const upcoming = EVENTS.filter((e) => e.when === "upcoming");
  const past = EVENTS.filter((e) => e.when === "past");

  return (
    <section id="events" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Events"
        blurb="Workshops, competitions and build sessions — what is coming up, and what we have already run."
      />

      {upcoming.length > 0 && (
        <Reveal className="mb-14">
          <h3 className="text-2xl md:text-3xl text-ink font-semibold tracking-[-0.02em] mb-6">Upcoming Events</h3>
          <div className="grid md:grid-cols-2 gap-5">
            {upcoming.map((e) => (
              <EventCard key={e.title} event={e} />
            ))}
          </div>
        </Reveal>
      )}

      {past.length > 0 && (
        <Reveal>
          <h3 className="text-2xl md:text-3xl text-ink font-semibold tracking-[-0.02em] mb-6">Past Events</h3>
          <div className="grid md:grid-cols-3 gap-5">
            {past.map((e) => (
              <EventCard key={e.title + e.date} event={e} />
            ))}
          </div>
        </Reveal>
      )}
    </section>
  );
}
