import React from "react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { SHOWCASE_CLIPS } from "../../data";
function Clip({ clip, className = "" }) {
  return (
    <figure className={`relative overflow-hidden rounded-lg bg-panel ${className}`}>
      <video
        className="h-full w-full object-cover"
        controls
        preload="metadata"
        poster={clip.poster}
      >
        <source src={clip.src} type="video/mp4" />
      </video>
      <figcaption className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-base/80 to-transparent px-4 pt-8 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2">
          {clip.meta}
        </span>
        <p className="text-sm text-ink font-medium mt-0.5">{clip.title}</p>
      </figcaption>
    </figure>
  );
}

export default function VideoShowcase() {
  if (SHOWCASE_CLIPS.length === 0) return null;

  const [feature, ...rest] = SHOWCASE_CLIPS;

  return (
    <section id="showcase" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="From the Field"
        blurb="Real footage from real flights — what the club has been building, in the air."
      />

      <Reveal className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Clip clip={feature} className="aspect-video md:aspect-auto md:min-h-[26rem]" />

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
          {rest.map((clip) => (
            <Clip key={clip.title} clip={clip} className="aspect-video" />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
