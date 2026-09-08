import React, { useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { useContent } from "../content/ContentProvider";
import { mediaUrl } from "../lib/api";

function Cover({ project }) {
  const [failed, setFailed] = useState(false);
  if (!project.image || failed) return null;

  return (
    <img
      src={mediaUrl(project.image)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full aspect-video object-cover bg-panel"
    />
  );
}

export default function Projects() {
  const PROJECTS = useContent("projects") ?? [];

  return (
    <section id="projects" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Projects"
        blurb="What is on the bench right now: a CanSat mission, a 3D-printed launch vehicle, and an EDF fighter model."
      />

      <div className="grid md:grid-cols-3 gap-5">
        {PROJECTS.map((p, i) => (
          <Reveal
            key={p.slug}
            className="group relative glass rounded-2xl overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition duration-300"
            style={{ transitionDelay: `${i * 20}ms` }}
          >
            <span
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 z-10"
              aria-hidden="true"
            />

            <Cover project={p} />

            <div className="p-7">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2">
                  {p.status}
                </span>
              </div>

              <h3 className="text-ink text-[17px] font-semibold mt-3 tracking-[-0.01em] leading-snug">
                {p.title}
              </h3>
              <p className="font-mono text-[11px] text-ink/40 mt-2">{p.timeline}</p>
              <p className="text-sm text-ink/55 mt-3 leading-relaxed">{p.summary}</p>

              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2 mt-5 block">
                {p.parts?.length > 0 ? `${p.parts.length} parts →` : "Read more →"}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
