"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/* A row of cards that becomes a scroller once there are too many to lay out.
 *
 * Up to `threshold` cards it is an ordinary grid, which is the right answer for
 * three: a grid shows all of them at once and needs no controls. Past that the
 * same cards become a horizontal rail with a button at each end, rather than a
 * grid that grows a fourth row nobody scrolls to.
 *
 * Three things make the rail behave:
 *
 *   The buttons are only rendered when the content actually overflows. Four
 *   cards on a wide screen may well fit, and a pair of dead arrows over a row
 *   that cannot move is worse than no arrows.
 *
 *   Scrolling moves by exactly one card, measured off the first two children
 *   rather than assumed, so it lands on a card edge at any width and the snap
 *   has nothing to fight.
 *
 *   The rail is focusable and labelled. The cards inside Events are not links,
 *   so without this there is no way to reach the rest of the row from a
 *   keyboard at all.
 */

const Arrow = ({ back = false }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <path
      d={back ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function RailButton({ back, disabled, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-ink/15 text-ink/60
        transition duration-150 hover:text-aurora2 hover:ring-aurora2/40
        disabled:opacity-25 disabled:pointer-events-none"
    >
      <Arrow back={back} />
    </button>
  );
}

export default function CardRail({
  title,
  label,
  threshold = 3,
  cols = "md:grid-cols-3",
  children,
}) {
  const items = Children.toArray(children);
  const railed = items.length > threshold;

  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: true, overflowing: false });

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      // a pixel of slack, because fractional widths never land exactly on zero
      start: el.scrollLeft <= 1,
      end: el.scrollLeft >= max - 1,
      overflowing: max > 1,
    });
  }, []);

  useEffect(() => {
    if (!railed) return undefined;
    const el = scrollerRef.current;
    if (!el) return undefined;

    measure();
    el.addEventListener("scroll", measure, { passive: true });

    // The row reflows when the window does, and a resize can take it from
    // overflowing to fitting, which is what decides whether the buttons exist.
    const obs = new ResizeObserver(measure);
    obs.observe(el);

    return () => {
      el.removeEventListener("scroll", measure);
      obs.disconnect();
    };
  }, [railed, measure]);

  function step(direction) {
    const el = scrollerRef.current;
    if (!el) return;

    /* One card, measured rather than assumed: the gap is the distance between
       the first two cards' left edges, which already includes whatever gap the
       flex row is using. One card is the fallback when there is only one. */
    const cards = el.children;
    const width =
      cards.length > 1
        ? cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
        : el.clientWidth;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * width, behavior: reduced ? "auto" : "smooth" });
  }

  const heading = title && (
    <h3 className="text-2xl md:text-3xl text-ink font-semibold tracking-[-0.02em]">{title}</h3>
  );

  if (!railed) {
    return (
      <>
        {heading && <div className="mb-6">{heading}</div>}
        <div className={`grid ${cols} gap-5`}>{items}</div>
      </>
    );
  }

  const controls = edges.overflowing && (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/30 mr-1 hidden sm:inline">
        {items.length}
      </span>
      <RailButton
        back
        onClick={() => step(-1)}
        disabled={edges.start}
        label={`Scroll ${label || title || "these cards"} left`}
      />
      <RailButton
        onClick={() => step(1)}
        disabled={edges.end}
        label={`Scroll ${label || title || "these cards"} right`}
      />
    </div>
  );

  return (
    <>
      {(heading || controls) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {heading || <span />}
          {controls}
        </div>
      )}

      {/* The scrollbar is hidden because the buttons are the control and a
          native bar under a glass card reads as a stray line. Swiping and
          arrow keys both still work, which is what it was there for. */}
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="group"
        aria-label={label || title || "Scrollable cards"}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-1
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          focus-visible:outline-2 focus-visible:outline-aurora2 focus-visible:outline-offset-4 rounded-2xl"
      >
        {items.map((item, i) => (
          <div
            key={item.key ?? i}
            /* basis, not width: these are flex children, and a hard width
               would be overridden by flex-basis: auto on the first reflow.
               Just under a third on a wide screen, so the fourth card shows an
               edge — which is the only honest signal that the row continues. */
            className="snap-start shrink-0 basis-[86%] sm:basis-[48%] lg:basis-[31.5%]"
          >
            {item}
          </div>
        ))}
      </div>
    </>
  );
}
