"use client";

import { useEffect, useRef, useState } from "react";

/* A figure that counts up the first time it is scrolled into view.
 *
 * Written rather than installed. The numbers on this site are not numbers —
 * they are "60+", "5+", "3 Years" — and every counter library takes a numeric
 * prop, so using one would mean picking the value apart here anyway and then
 * shipping a dependency to animate the middle of it. What is left after that
 * split is a tween and an observer, which is this file.
 *
 * Three things it has to get right:
 *
 *   The text is correct before any of this runs. The server renders the final
 *   value, and the count only starts once the browser has it on screen — so a
 *   crawler, a reader with scripts off, and the moment before hydration all
 *   see "60+" rather than "0+".
 *
 *   It runs once. An observer that re-fires on every scroll past would restart
 *   the count halfway down the page, which reads as a glitch rather than as an
 *   arrival.
 *
 *   Anyone who has asked for less motion gets the finished figure, immediately
 *   and with no observer attached at all.
 */

/* "60+" -> { prefix: "", number: 60, suffix: "+" }, and "3 Years" the same way.
   Anything with no digits in it comes back as null and is rendered verbatim —
   a caption that says "Ongoing" must not become "0". */
function parse(value) {
  const match = String(value ?? "").match(/^(\D*?)([\d.,]+)(.*)$/s);
  if (!match) return null;

  const [, prefix, digits, suffix] = match;
  const number = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;

  // "1,200" counts with its separator kept; "3.5" keeps its one decimal.
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  return { prefix, number, suffix, decimals, grouped: digits.includes(",") };
}

// Fast out of the gate and easing to a stop, which is what makes the last few
// digits readable instead of a blur that snaps.
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const DURATION = 1400;

export default function CountUp({ value, className = "" }) {
  const parsed = parse(value);
  const ref = useRef(null);

  /* Null means "not counting" — either it has not started yet or there is
     nothing to count — and the raw value is rendered instead. */
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!parsed) return undefined;

    const node = ref.current;
    if (!node) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;

    const run = () => {
      const started = performance.now();

      const step = (now) => {
        const t = Math.min((now - started) / DURATION, 1);
        setShown(parsed.number * easeOut(t));
        frame = t < 1 ? requestAnimationFrame(step) : 0;
      };

      frame = requestAnimationFrame(step);
    };

    /* A third of the tile visible is enough to commit — waiting for the whole
       row means the shortest phone never triggers the bottom one. */
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect(); // once, not on every pass
        run();
      },
      { threshold: 0.33 }
    );

    obs.observe(node);
    return () => {
      obs.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // The figure is fixed copy; re-parsing it on every render would restart the
    // count, so this keys off the string it came from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!parsed) return <span className={className}>{value}</span>;

  const n = shown == null ? parsed.number : shown;
  const text = parsed.grouped
    ? n.toLocaleString("en-IN", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })
    : n.toFixed(parsed.decimals);

  return (
    <span ref={ref} className={className}>
      {/* The suffix is held out of the tween so "+" does not appear to arrive
          late, and tabular figures stop the tile shuffling sideways as the
          digit widths change on the way up. */}
      {parsed.prefix}
      <span className="tabular-nums">{text}</span>
      {parsed.suffix}
    </span>
  );
}
