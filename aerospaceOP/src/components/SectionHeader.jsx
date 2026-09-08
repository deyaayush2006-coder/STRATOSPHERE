import React from "react";
import Reveal from "./Reveal";

export default function SectionHeader({ title, blurb, className = "" }) {
  return (
    <Reveal className={`mb-14 ${className}`}>
      <h2 className="text-3xl md:text-[2.75rem] text-ink font-semibold tracking-[-0.025em] leading-[1.05] w-fit max-w-full">
        {title}
      </h2>

      {blurb && (
        <p className="text-ink/55 mt-5 max-w-2xl leading-relaxed">{blurb}</p>
      )}

      <div className="rule-sweep mt-8" aria-hidden="true" />
    </Reveal>
  );
}
