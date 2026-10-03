import Reveal from "./Reveal";

export default function SectionHeader({ title, blurb, className = "" }) {
  return (
    <Reveal className={`mb-14 text-center ${className}`}>
      <h2 className="uppercase font-bold text-3xl md:text-4xl lg:text-5xl text-ink tracking-[0.05em] leading-[1.05] w-fit max-w-full mx-auto">
        {title}
      </h2>

      {blurb && (
        <p className="text-ink/55 mt-5 max-w-2xl mx-auto leading-relaxed">{blurb}</p>
      )}

      <div className="rule-sweep mt-8" aria-hidden="true" />
    </Reveal>
  );
}
