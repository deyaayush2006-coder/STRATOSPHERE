"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* The way into the site: a loading screen that holds while the page arrives.
 *
 * Whether it runs at all is decided before React exists, by the script in
 * app/layout.jsx: on the first load of a tab, on the front page, with motion
 * allowed, it puts data-intro="pending" on <html>. This overlay is hidden by
 * CSS until that attribute is there, so a returning visitor never sees a frame
 * of it and a first-time one never sees the page underneath it first. Doing it
 * in state instead would flash one or the other, because state is only true
 * after hydration and the page is painted well before that.
 *
 * The page itself is rendered underneath the whole time — this is a curtain,
 * not a gate. Search engines, and a reader who lands here with JavaScript
 * broken, get the site.
 *
 * It waits for the real load event rather than running for a fixed time, which
 * is the whole point of a loading screen; MIN_SHOW keeps it from flickering
 * past on a fast connection, and MAX_SHOW means a stalled asset costs a
 * moment rather than the visit. Skip and Escape are there throughout.
 */

// Below this it reads as a glitch rather than a screen.
const MIN_SHOW = 900;

// Past this, whatever has not arrived is not worth waiting behind.
const MAX_SHOW = 5000;

// Matches the fade in the markup below; they have to agree or the overlay
// either flickers back in or leaves a gap of nothing.
const FADE = 500;

export default function Intro() {
  const timers = useRef([]);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const dismiss = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLeaving(true);
    // The attribute is what CSS is watching, and dropping it both hides this
    // and gives the page its scrollbar back. It waits for the fade so the
    // curtain is not simply cut away.
    setTimeout(() => {
      document.documentElement.removeAttribute("data-intro");
      setGone(true);
    }, FADE);
  }, []);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "pending") {
      // Not our turn. The overlay is already invisible; this only stops it
      // from sitting in the tree for the rest of the session.
      setGone(true);
      return undefined;
    }

    const opened = Date.now();

    const settle = () => {
      const waited = Date.now() - opened;
      timers.current.push(setTimeout(dismiss, Math.max(0, MIN_SHOW - waited)));
    };

    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });

    timers.current.push(setTimeout(dismiss, MAX_SHOW));

    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      window.removeEventListener("load", settle);
      window.removeEventListener("keydown", onKey);
    };
  }, [dismiss]);

  if (gone) return null;

  return (
    /* hidden until <html> carries the attribute — the same shape as the
       theme-driven rules elsewhere, and the reason there is no flash in either
       direction. */
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Stratosphere"
      className={`fixed inset-0 z-[100] hidden place-items-center bg-base transition-opacity ease-out [[data-intro=pending]_&]:grid
        ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE}ms` }}
    >
      <div className="flex animate-loader-in flex-col items-center gap-8 px-6">
        {/* The club's own mark, moving: a body, the ring it keeps to, and one
            thing going round it. The dot is the only element that turns — the
            ring is drawn once and left alone, so there is nothing to see
            stutter if the frame rate drops. */}
        <div className="relative h-20 w-20">
          <span className="absolute inset-0 rounded-full border border-ink/15" aria-hidden="true" />
          <span className="absolute inset-[34%] rounded-full bg-ink/15" aria-hidden="true" />
          <span className="absolute inset-0 animate-orbit" aria-hidden="true">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora2 shadow-[0_0_14px_3px_rgba(34,211,238,0.45)]" />
          </span>
        </div>

        <div className="text-center">
          <p className="font-display text-lg font-bold uppercase tracking-[0.22em] text-ink md:text-xl">
            Stratosphere
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/45">
            Aerospace Club · Jadavpur University
          </p>
        </div>

        <div className="h-px w-44 overflow-hidden bg-ink/10">
          <div className="h-full w-[30%] animate-sweep bg-aurora2/80" />
        </div>
      </div>

      {/* Always reachable, and the first thing the keyboard lands on. Nobody
          who has seen this should have to sit through it again. */}
      <button
        type="button"
        data-intro-skip
        onClick={dismiss}
        className="absolute bottom-8 right-6 rounded-full border border-ink/25 bg-base/40 px-4 py-2 font-mono
          text-[10px] uppercase tracking-[0.18em] text-ink/80 backdrop-blur-sm transition
          hover:border-aurora2/40 hover:text-aurora2 md:bottom-10 md:right-10"
      >
        Skip
      </button>
    </div>
  );
}
