"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import CardRail from "./CardRail";
import { mediaUrl } from "@/lib/media-url";
import Label from "./Label";

function Cover({ project }) {
  const [failed, setFailed] = useState(false);
  if (!project.image || failed) return null;

  return (
    <Image
      src={mediaUrl(project.image)}
      alt=""
      width={800}
      height={450}
      loading="lazy"
      sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 380px"
      onError={() => setFailed(true)}
      className="w-full aspect-video object-cover bg-panel"
    />
  );
}

function ProjectCard({ project }) {
  return (
    <article className="group relative h-full glass rounded-2xl overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition duration-200">
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-200 z-10"
        aria-hidden="true"
      />

      <Link href={`/projects/${project.slug}`} className="block h-full">
        <Cover project={project} />

        <div className="p-7">
          <div className="flex items-baseline justify-between gap-3">
            <Label dot>{project.status}</Label>
          </div>

          <h3 className="text-ink text-[17px] font-semibold mt-3 tracking-[-0.01em] leading-snug">
            {project.title}
          </h3>
          <p className="font-mono text-[11px] text-ink/40 mt-2">{project.timeline}</p>
          <p className="text-sm text-ink/55 mt-3 leading-relaxed">{project.summary}</p>

          <span className="text-sm font-medium text-aurora2 mt-5 block">
            {project.parts?.length > 0 ? `${project.parts.length} parts →` : "Read more →"}
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function Projects({ projects = [] }) {
  return (
    <section id="projects" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Projects"
      />

      <Reveal>
        <CardRail label="projects">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </CardRail>
      </Reveal>
    </section>
  );
}
