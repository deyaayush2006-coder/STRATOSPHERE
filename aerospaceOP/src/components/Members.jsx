import React, { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { MEMBER_COHORTS } from "../../data";

// Screens of scroll each committee holds the pinned panel for.
const SCREENS_PER_COHORT = 1;

// Drive throttles hotlinked portraits, so fall back to initials.
function Avatar({ member }) {
  const [failed, setFailed] = useState(false);

  const initials = member.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  if (failed || !member.image) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink/5 ring-1 ring-ink/15 font-mono text-xs text-ink/50">
        {initials}
      </span>
    );
  }

  return (
    <img
      src={member.image}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-ink/15 bg-panel"
    />
  );
}

function MemberCard({ member }) {
  return (
    <div className="group relative h-full glass rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition duration-300">
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"
        aria-hidden="true"
      />

      <Avatar member={member} />

      <div className="min-w-0">
        <h3 className="text-ink text-[14px] font-semibold tracking-[-0.01em] truncate">
          {member.name}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-aurora2 mt-1">
          {member.role}
        </p>
        {member.dept && (
          <p className="text-[11px] text-ink/45 mt-1 truncate">{member.dept}</p>
        )}

        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] text-ink/50 hover:text-ink transition-colors mt-1.5"
          >
            LinkedIn ↗
          </a>
        )}
        {!member.linkedin && member.email && (
          <a
            href={`mailto:${member.email}`}
            className="block text-[11px] text-ink/50 hover:text-ink transition-colors mt-1.5 truncate"
          >
            {member.email}
          </a>
        )}
      </div>
    </div>
  );
}

function CohortHeading({ cohort }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-4">
      <h3 className="text-2xl md:text-3xl text-ink font-semibold tracking-[-0.02em]">
        {cohort.year}
      </h3>
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 rounded-full ring-1 ${
          cohort.current
            ? "text-aurora2 ring-aurora2/40 bg-aurora2/10"
            : "text-ink/45 ring-ink/15"
        }`}
      >
        {cohort.tag}
      </span>
      <p className="text-sm text-ink/50 basis-full sm:basis-auto">{cohort.blurb}</p>
    </div>
  );
}

// Stagger on the way in, zero on the way out, so a year leaves as one block.
function CohortGrid({ cohort, animate = false, active = true }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cohort.members.map((m, i) => (
        <div
          key={`${cohort.year}-${m.name}-${m.role}`}
          className={
            animate
              ? `h-full transition-[opacity,transform] duration-500 ease-out ${
                  active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`
              : "h-full"
          }
          style={animate ? { transitionDelay: active ? `${i * 35}ms` : "0ms" } : undefined}
        >
          <MemberCard member={m} />
        </div>
      ))}
    </div>
  );
}

// Progress readout and jump control in one.
function YearRail({ active, onPick, barRef }) {
  return (
    <div className="mb-5 shrink-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5">
        {MEMBER_COHORTS.map((c, i) => (
          <button
            key={c.year}
            type="button"
            onClick={() => onPick(i)}
            aria-current={i === active ? "true" : undefined}
            className={`font-mono text-[11px] tracking-[0.12em] px-3 py-1.5 rounded-full whitespace-nowrap ring-1 transition-colors ${
              i === active
                ? "text-ink ring-aurora2/50 bg-aurora2/15"
                : "text-ink/40 ring-ink/10 hover:text-ink/70 hover:ring-ink/25"
            }`}
          >
            {c.year}
          </button>
        ))}
      </div>

      {/* driven by ref: this moves every scroll frame and must not re-render the cards */}
      <div className="h-px w-full bg-ink/10 overflow-hidden">
        <div
          ref={barRef}
          className="h-full w-full bg-aurora2 origin-left scale-x-0"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default function Members() {
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const [active, setActive] = useState(0);

  // Reduced-motion and anything under a laptop get the plain stacked list.
  // Do not add a height test here: a guessed minimum locked real screens out.
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
    );
    const sync = () => setPinned(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    const el = trackRef.current;
    if (!el) return;

    let frame = 0;
    const read = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;

      const progress = Math.min(Math.max(-rect.top / travel, 0), 1);

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }

      // equal-width buckets, last one included
      const index = Math.min(
        MEMBER_COHORTS.length - 1,
        Math.floor(progress * MEMBER_COHORTS.length)
      );
      setActive((prev) => (prev === index ? prev : index));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pinned]);

  // Aim for the middle of the bucket so a click never lands on a boundary.
  function jumpTo(index) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const travel = rect.height - window.innerHeight;
    const target = top + ((index + 0.5) / MEMBER_COHORTS.length) * travel;
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  const trackScreens = MEMBER_COHORTS.length * SCREENS_PER_COHORT + 1;

  return (
    <section id="members" className="scroll-mt-28">
      <div className="px-6 pt-24 md:pt-28 max-w-6xl mx-auto">
        <SectionHeader
          title="The Team"
          blurb="Five years of committees, from the three founders in 2022 to the sixteen students running the club today. The page holds still here — keep scrolling and the years advance in place."
        />
      </div>

      {pinned ? (
        <div
          ref={trackRef}
          className="relative"
          style={{ height: `${trackScreens * 100}vh` }}
        >
          {/* the pin; pt-16 clears the sticky nav */}
          <div className="sticky top-0 h-screen flex flex-col justify-start px-6 pt-16 pb-6 max-w-6xl mx-auto">
            <YearRail active={active} onPick={jumpTo} barRef={barRef} />

            {/* all committees stay mounted for the cross-fade; inset-0 keeps each
                panel inside the pin instead of overflowing the next section */}
            <div className="relative flex-1 min-h-0">
              {MEMBER_COHORTS.map((cohort, i) => (
                <div
                  key={cohort.year}
                  className={`absolute inset-0 overflow-y-auto overflow-x-hidden transition-[visibility] duration-500 ${
                    i === active ? "visible" : "invisible"
                  }`}
                >
                  <div
                    className={`transition-[opacity,transform] duration-500 ease-out ${
                      i === active
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                    }`}
                  >
                    <CohortHeading cohort={cohort} />
                  </div>

                  <CohortGrid cohort={cohort} animate active={i === active} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-24 md:pb-28 max-w-6xl mx-auto space-y-16">
          {MEMBER_COHORTS.map((cohort) => (
            <Reveal key={cohort.year}>
              <CohortHeading cohort={cohort} />
              <CohortGrid cohort={cohort} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
