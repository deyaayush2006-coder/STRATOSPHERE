import React from "react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { useContent } from "../content/ContentProvider";

export default function Announcements() {
  const ANNOUNCEMENTS = useContent("announcements");

  const pinned = ANNOUNCEMENTS.find((a) => a.pinned);
  const rest = ANNOUNCEMENTS.filter((a) => a !== pinned);

  return (
    <section id="announcements" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Announcements"
        blurb="Every club update in one place — the detail that does not fit in a caption, kept as an archive rather than a feed."
      />

      {pinned && (
        <Reveal className="relative glass-strong glass-blur rounded-3xl p-8 md:p-10 overflow-hidden mb-5">
          <span
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2 to-transparent"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2 border border-aurora2/30 rounded-full px-3 py-1">
              {pinned.tag}
            </span>
            <span className="font-mono text-[11px] text-ink/40">{pinned.date}</span>
          </div>
          <h3 className="text-ink text-2xl md:text-3xl font-semibold mt-5 tracking-[-0.02em] leading-tight">
            {pinned.title}
          </h3>
          <p className="text-ink/65 mt-4 leading-relaxed max-w-3xl">{pinned.body}</p>
        </Reveal>
      )}

      <Reveal className="glass rounded-3xl px-6 md:px-10 py-2">
        <ul className="divide-y divide-ink/10">
          {rest.map((a) => (
            <li key={a.id} className="grid md:grid-cols-[9rem_1fr] gap-2 md:gap-8 py-6 items-baseline">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] text-ink/40">{a.date}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2">
                  {a.tag}
                </span>
              </div>
              <div>
                <h3 className="text-ink text-lg font-semibold tracking-[-0.01em]">{a.title}</h3>
                <p className="text-sm text-ink/55 mt-1.5 leading-relaxed max-w-2xl">{a.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
