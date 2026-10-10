"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import { gsap, useGSAP } from "@/lib/gsap";

// The rail's tip rides this line on screen (from the top of the viewport).
const FOCUS = "62%";
import SectionHeader from "./SectionHeader";
import FeedArchive from "./FeedArchive";
import { formatPosted, machineDate, splitFeed } from "@/lib/feed";

function When({ achievement, archived = false }) {
  const exact = formatPosted(achievement.postedAt);
  const machine = machineDate(achievement.postedAt);
  const tone = archived ? "text-ink/45" : "text-aurora2";

  const shown = archived ? exact || achievement.year : achievement.year || exact;

  if (!machine) {
    return <span className={`font-mono text-sm ${tone}`}>{shown}</span>;
  }

  return (
    <time dateTime={machine} title={exact} className={`font-mono text-sm ${tone}`}>
      {shown}
    </time>
  );
}

function Row({ achievement, archived = false }) {
  return (
    <li
      data-achievement={archived ? undefined : ""}
      className={`group/row relative grid gap-2 md:gap-8 items-baseline ${
        archived ? "md:grid-cols-[11rem_1fr] py-5" : "md:grid-cols-[9rem_1fr] py-6 pl-7"
      }`}
    >
      {!archived && (
        <>
          {/* Connector: draws from the dot to the date right after the dot lights. */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-[calc(1.95rem+4.5px)] h-px w-[1.375rem] bg-ink/15"
          >
            <span
              className="block h-full w-full origin-left scale-x-0 bg-aurora2 transition-transform duration-300 ease-out
                group-[.is-reached]/row:scale-x-100 group-[.is-reached]/row:delay-[120ms]"
            />
          </span>
          {/* Dot: lights the instant the rail's tip reaches its centre. */}
          <span
            data-dot
            aria-hidden="true"
            className="absolute left-0 top-[1.95rem] -translate-x-1/2 h-2.5 w-2.5 rounded-full border border-ink/25 bg-base
              transition-[background-color,border-color,box-shadow] duration-200
              group-[.is-reached]/row:border-aurora2 group-[.is-reached]/row:bg-aurora2 group-[.is-reached]/row:shadow-[0_0_12px_rgba(34,211,238,0.9)]"
          />
        </>
      )}
      <div className="flex flex-col gap-1.5">
        <When achievement={achievement} archived={archived} />
        {achievement.tag && (
          <span className={`font-mono text-[11px] ${archived ? "text-ink/35" : "text-ink/40"}`}>
            {achievement.tag}
          </span>
        )}
      </div>
      <div>
        <h3
          className={`font-semibold tracking-[-0.01em] ${
            archived ? "text-ink/80 text-base" : "text-ink text-lg"
          }`}
        >
          {achievement.title}
        </h3>
        <p
          className={`text-sm mt-1.5 leading-relaxed max-w-2xl ${
            archived ? "text-ink/45" : "text-ink/55"
          }`}
        >
          {achievement.body}
        </p>
      </div>
    </li>
  );
}

export default function Achievements({ achievements = [], achievementSettings }) {
  const { recent, archived, hiddenCount, showArchive, archiveLabel } = splitFeed(
    achievements,
    achievementSettings,
    { fallback: { visibleCount: 4, archiveLabel: "Earlier achievements" } }
  );

  // GSAP: one scrubbed value drives the whole timeline. The rail runs from the
  // first dot's centre to the last one's, its tip rides a fixed line on screen
  // (FOCUS), and a row is "reached" exactly when the tip passes its dot — so
  // the dot, its connector and its text can never run ahead of or behind the
  // line. Reduced motion shows the finished timeline.
  const listRef = useRef(null);
  useGSAP(
    () => {
      const list = listRef.current;
      if (!list) return;
      const rows = gsap.utils.toArray("[data-achievement]", list);
      const track = list.querySelector("[data-rail-track]");
      const fill = list.querySelector("[data-rail-fill]");
      const tip = list.querySelector("[data-rail-tip]");
      if (!rows.length || !track) return;

      let stops = [];
      let first = 0;
      let span = 0;

      // Dot centres relative to the list, and the rail sized to span them.
      const measure = () => {
        const top = list.getBoundingClientRect().top;
        stops = rows.map((row) => {
          const dot = row.querySelector("[data-dot]").getBoundingClientRect();
          return dot.top + dot.height / 2 - top;
        });
        first = stops[0];
        span = Math.max(stops[stops.length - 1] - first, 0);
        gsap.set(track, { top: first, height: span });
      };

      const content = (row) => row.querySelectorAll(":scope > div");
      const state = rows.map(() => false);
      // A refresh (e.g. an archive opening below) rewinds the scrub to 0 to
      // re-measure, then restores it without firing onUpdate. Ignore the
      // rewind and re-apply once it is restored, or every row stays hidden.
      let refreshing = false;

      // Per row, in order: dot lights (0ms, CSS 200ms), connector draws
      // (120ms, CSS 300ms), text slides in (200ms, 500ms). Scrolling back
      // above a dot reverses it, so text is visible only while its dot is lit.
      const apply = (progress, animate = true) => {
        if (refreshing) return;
        const at = progress * span;
        gsap.set(fill, { scaleY: progress });
        gsap.set(tip, { y: at, autoAlpha: progress > 0 && progress < 1 ? 1 : 0 });

        rows.forEach((row, i) => {
          // progress > 0 means the first dot has crossed the focus line.
          const reached = progress > 0 && stops[i] - first <= at + 0.5;
          if (reached === state[i]) return;
          state[i] = reached;
          row.classList.toggle("is-reached", reached);
          gsap.to(content(row), {
            autoAlpha: reached ? 1 : 0,
            x: reached ? 0 : 18,
            duration: animate ? (reached ? 0.5 : 0.25) : 0,
            delay: animate && reached ? 0.2 : 0,
            stagger: animate && reached ? 0.06 : 0,
            ease: reached ? "power3.out" : "power2.in",
            overwrite: true,
          });
        });
      };

      measure();

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        rows.forEach((row) => gsap.set(content(row), { autoAlpha: 0, x: 18 }));

        const rail = { progress: 0 };
        gsap.to(rail, {
          progress: 1,
          ease: "none",
          onUpdate: () => apply(rail.progress),
          scrollTrigger: {
            trigger: list,
            start: () => `top+=${first} ${FOCUS}`,
            end: () => `top+=${first + span} ${FOCUS}`,
            scrub: 0.25,
            invalidateOnRefresh: true,
            onRefreshInit: () => {
              refreshing = true;
              measure();
            },
            onRefresh: () => {
              refreshing = false;
              apply(rail.progress);
            },
          },
        });
        apply(0);

        return () => {
          refreshing = false;
          state.fill(false);
          rows.forEach((row) => row.classList.remove("is-reached"));
        };
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        apply(1, false);
      });

      return () => mm.revert();
    },
    { scope: listRef, dependencies: [recent.length] }
  );

  return (
    <section id="achievements" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Achievements"
      />

      {recent.length > 0 ? (
        // A plain card, not <Reveal>: its slide-in would shift the list after
        // the rail's scroll positions were measured. The rows animate themselves.
        <div className="glass rounded-3xl px-6 md:px-10 py-4">
          <div ref={listRef} className="relative">
            {/* Rail: positioned from the first dot to the last by measure(). */}
            <div
              data-rail-track
              aria-hidden="true"
              className="absolute left-0 top-0 w-0.5 -translate-x-1/2 bg-ink/10"
            >
              <div
                data-rail-fill
                style={{ transform: "scaleY(0)" }}
                className="absolute inset-0 origin-top bg-aurora2"
              />
              <div
                data-rail-tip
                className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora2
                  opacity-0 shadow-[0_0_10px_3px_rgba(34,211,238,0.7)]"
              />
            </div>
            <ul className="divide-y divide-ink/10">
              {recent.map((a, i) => (
                <Row key={a.title || i} achievement={a} />
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Reveal className="glass rounded-3xl px-6 md:px-10 py-10">
          <p className="text-sm text-ink/50">Nothing recorded here yet.</p>
        </Reveal>
      )}

      <FeedArchive
        id="achievement-archive"
        label={archiveLabel}
        items={archived}
        noun="achievement"
        nounPlural="achievements"
      >
        {(a, i) => <Row key={a.title || i} achievement={a} archived />}
      </FeedArchive>

      {!showArchive && hiddenCount > 0 && (
        <p className="mt-5 text-sm text-ink/40">
          {hiddenCount} older {hiddenCount === 1 ? "achievement is" : "achievements are"} kept on
          record and not shown here.
        </p>
      )}
    </section>
  );
}
