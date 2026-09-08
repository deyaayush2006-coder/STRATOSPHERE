import React from "react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { useContent } from "../content/ContentProvider";

export default function Achievements() {
  const ACHIEVEMENTS = useContent("achievements");

  return (
    <section id="achievements" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Achievements"
        blurb="Competitions entered, events run, aircraft finished — and what came of each."
      />

      <Reveal className="glass rounded-3xl px-6 md:px-10 py-4">
        <ul className="divide-y divide-ink/10">
          {ACHIEVEMENTS.map((a, i) => (
            <li
              key={i}
              className="group grid md:grid-cols-[9rem_1fr] gap-2 md:gap-8 py-6 items-baseline"
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-sm text-aurora2 transition-colors">
                  {a.year}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35">
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
