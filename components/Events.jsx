"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import StaggerReveal from "./StaggerReveal";
import CardRail from "./CardRail";
import SectionHeader from "./SectionHeader";
import { mediaUrl } from "@/lib/media-url";
import Label from "./Label";
import SpotlightCard from "./SpotlightCard";

function EventCard({ event }) {
  const [failed, setFailed] = useState(false);
  const upcoming = event.when === "upcoming";

  return (
    <SpotlightCard as="article" className="group h-full flex flex-col glass rounded-2xl overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition-[border-color,translate] duration-200">
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-200 z-10"
        aria-hidden="true"
      />

      <Link href={`/events/${event.slug}`} className="flex grow flex-col">
        {event.image && !failed && (
          upcoming ? (
            // Upcoming events use posters, so show the whole poster over a blurred fill of itself.
            <div className="relative w-full aspect-video overflow-hidden bg-panel">
              <Image
                src={mediaUrl(event.image)}
                alt=""
                aria-hidden="true"
                fill
                loading="lazy"
                sizes="(max-width: 640px) 88vw, 560px"
                className="object-cover scale-110 blur-2xl opacity-60"
              />
              <Image
                src={mediaUrl(event.image)}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 640px) 88vw, 560px"
                onError={() => setFailed(true)}
                className="object-contain transition duration-500 group-hover:scale-[1.03]"
              />
            </div>
          ) : (
            <div className="w-full aspect-video overflow-hidden bg-panel">
              <Image
                src={mediaUrl(event.image)}
                alt=""
                width={800}
                height={450}
                loading="lazy"
                sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 380px"
                onError={() => setFailed(true)}
                className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.05]"
              />
            </div>
          )
        )}

        <div className="p-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <Label dot muted={!upcoming}>{event.date}</Label>
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
      </Link>
    </SpotlightCard>
  );
}

export default function Events({ events = [] }) {
  const upcoming = events.filter((e) => e.when === "upcoming");
  const past = events.filter((e) => e.when === "past");

  return (
    <section id="events" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Events"
      />

      {upcoming.length > 0 && (
        <StaggerReveal items="article" className="mb-14">
          <CardRail title="Upcoming Events" label="upcoming events" cols="md:grid-cols-2">
            {upcoming.map((e) => (
              <EventCard key={e.title} event={e} />
            ))}
          </CardRail>
        </StaggerReveal>
      )}

      {past.length > 0 && (
        <StaggerReveal items="article">
          <CardRail title="Past Events" label="past events">
            {past.map((e) => (
              <EventCard key={e.title + e.date} event={e} />
            ))}
          </CardRail>
        </StaggerReveal>
      )}
    </section>
  );
}
