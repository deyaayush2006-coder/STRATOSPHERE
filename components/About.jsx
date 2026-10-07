import Reveal from "./Reveal";
import CountUp from "./CountUp";
import ScrollReveal from "./ScrollReveal";

const FACT_COLUMNS = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3" };

export default function About({ about = {}, socials = [] }) {
  const { body = [], pillars = [], facts = [] } = about;

  return (
    <section id="about" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <Reveal className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
        <h2 className="font-bold text-5xl md:text-6xl lg:text-7xl text-ink tracking-[0.06em] leading-[0.95]">
          ABOUT US
        </h2>

        <div className="md:-mt-1">
          <ScrollReveal className="text-ink text-lg leading-relaxed mb-5">{about.lead}</ScrollReveal>

          {body.map((paragraph, i) => (
            <ScrollReveal key={i} className="text-ink/70 mb-5 last:mb-0 leading-relaxed">
              {paragraph}
            </ScrollReveal>
          ))}

        </div>
      </Reveal>
      <Reveal className="mt-16 md:mt-20 grid md:grid-cols-2 gap-12 md:gap-0">
        {pillars.map((pillar, i) => (
          <div
            key={pillar.title}
            className={i === 0 ? "md:pr-12" : "md:border-l md:border-ink/40 md:pl-12"}
          >
            <h3 className="font-semibold text-2xl md:text-3xl text-ink tracking-[-0.01em]">
              {pillar.title}
            </h3>
            <p className="text-ink/70 mt-4 leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </Reveal>


      <Reveal className="mt-20 md:mt-24 pt-12 border-t border-ink/10">
        <dl className={`grid grid-cols-2 ${FACT_COLUMNS[facts.length] ?? "md:grid-cols-4"} gap-10 md:gap-6`}>
          {facts.map((fact) => (
            <div key={fact.label} className="text-center">
              <dd className="m-0">
                <CountUp
                  value={fact.value}
                  className="block text-6xl md:text-5xl font-semibold text-ink tracking-[-0.02em]"
                />
              </dd>
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45 mt-3">
                {fact.label}
              </dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
