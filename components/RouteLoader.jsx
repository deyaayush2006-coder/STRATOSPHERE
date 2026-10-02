"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { typeWhenSeen } from "@/lib/typing-clock";
import LoadingScreen from "./LoadingScreen";

/* The loading screen, in front of the pages of the public site.
 *
 * Two ways onto the screen, and they look exactly the same.
 *
 * Opening the site, or reloading it. The curtain is in the server-rendered
 * HTML, in front of everything else, and it is visible from the very first
 * frame the browser paints. The page underneath is never seen half-built: the
 * curtain stays until the window's load event has fired, the name has finished
 * typing and MIN_SHOW has passed, and only then lifts off the finished page.
 * An earlier version held the curtain hidden for a grace period on the first
 * paint too, so that a fast load never showed it — which meant every load
 * flashed the bare page for that grace period before the curtain faded in
 * over it.
 *
 * Clicking between pages. By then React is in charge and can wait and see, so
 * here the grace period stays: most clicks are answered from the router's
 * prefetch cache inside GRACE, and a curtain for those would only make a fast
 * site feel slow. A click still going after GRACE raises the same curtain.
 *
 * It must never delay a 404. That is not a check in here — it is where the
 * component sits. It is mounted by app/(site)/layout, and Next resolves the
 * root not-found against the root layout only, so an address that does not
 * exist renders a layout this component is not part of. The one case the file
 * system cannot answer on its own is a client-side click, where the browser
 * never leaves the current layout and the bad slug is only discovered once the
 * payload comes back. `known` is for that, and only that: the paths the site
 * actually has, handed down from the layout, which already read them out of
 * the database to render the nav.
 *
 * And it must not be able to strand anyone. Every wait has a ceiling. If a
 * load or a navigation is slow, blocked, or simply never finishes, MAX_WAIT
 * lifts the curtain rather than leaving a visitor looking at a logo.
 */

/* Under this, a click counts as instant and no curtain is raised for it. Only
   clicks: the first load always shows the curtain. */
const GRACE = 400;

/* Once it is up, it stays up at least this long. Without a floor a wait that
   only just crossed GRACE would put a full-screen lockup on the page for two
   frames, which reads as a glitch rather than as loading.
 *
 * The typing waits for the curtain to be seen before it starts (see
 * lib/typing-clock), so it can finish later than any fixed figure, and `typed`
 * below is what holds the curtain until it is done. This is the floor for when
 * there is no typing to wait for — a visitor with reduced motion gets the
 * lockup already assembled. */
const MIN_SHOW = 950;

/* The ceiling, counted from the start of the load or navigation. Past this the
   page is not coming, and a visitor is better off with whatever is behind the
   curtain than with the curtain. */
const MAX_WAIT = 8000;

// Matches the fade LoadingScreen is given; they have to agree or the overlay
// either flickers back in or leaves a gap of nothing.
const FADE = 500;

/* When the served curtain first appeared, on the Date.now() clock that the
   rest of this file times with. It is in the first painted frame, so that is
   the browser's first paint; if the browser cannot say, React mounting is the
   nearest later moment, which only ever makes the hold a little longer. */
function firstPaintAt() {
  try {
    const paint = performance.getEntriesByType("paint")[0];
    if (paint) return Date.now() - (performance.now() - paint.startTime);
  } catch {
    // No Paint Timing API; fall through.
  }
  return Date.now();
}

/* Whether the name on the curtain has finished writing itself, and the line
   under it has arrived. A curtain pulled before then shows a half-typed word.
 *
 * Asked of the animations themselves: a letter still held by lib/typing-clock
 * is paused, one still to come is running, and only a typed one is finished.
 * With no animations — reduced motion, or no curtain at all — there is nothing
 * to wait for. */
function typed() {
  const el = document.querySelector("[data-route-loader]");
  if (!el || typeof el.getAnimations !== "function") return true;

  return [...el.querySelectorAll("[data-typed]")].every((node) =>
    node.getAnimations().every((a) => a.playState === "finished")
  );
}

/* Trailing slashes, encoded characters and a bare "" all name paths the site
   does serve, and none of them match a plain list of routes as they arrive. */
function normalise(pathname) {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // A malformed escape is not a route on this site either way.
  }
  path = path.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

export default function RouteLoader({ paths = [], trees = [] }) {
  const pathname = usePathname();

  /* Three states.
   *
   *   shown     on screen, and staying for at least MIN_SHOW. Where every
   *             page load starts, on both sides of hydration, so the server
   *             HTML and the first client render agree.
   *   leaving   fading out.
   *   idle      nothing rendered. */
  const [phase, setPhase] = useState("shown");

  /* The same value, readable from a timer or a listener that was bound before
     the current render existed. Assigning during render rather than in an
     effect is deliberate: a callback that fires between the two would
     otherwise read the previous phase and settle a curtain that has just been
     raised. */
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const shownAt = useRef(0);
  const settled = useRef(pathname);
  const timers = useRef([]);

  /* Set the moment a click is taken, cleared when that navigation lands. It is
     a ref rather than state because the commit effect has to read it as it
     stands right now, not as it was when that effect last ran. */
  const navigating = useRef(false);

  /* Read through a ref by the document listener, which is bound once and would
     otherwise close over the first render's copies forever. */
  const routes = useRef({ paths, trees });
  routes.current = { paths, trees };

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const known = useCallback((pathname) => {
    const path = normalise(pathname);
    const { paths, trees } = routes.current;
    if (paths.includes(path)) return true;
    /* A project page owns everything under it: /projects/<slug>/<part> picks
       which part is open and falls back to the first one, so an unrecognised
       part is still that project's page rather than a 404. */
    return trees.some((root) => path.startsWith(`${root}/`));
  }, []);

  // Every phase change goes through here, so the ref and the state can never
  // disagree about which one is current.
  const to = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /* Gone without a fade. For a click that landed inside GRACE, where the
     curtain was never raised — there is nothing to fade, and a transition out
     of an overlay nobody saw is FADE milliseconds of an invisible sheet sitting
     over the page eating clicks. */
  const drop = useCallback(() => {
    clearTimers();
    to("idle");
  }, [clearTimers, to]);

  const dismiss = useCallback(() => {
    clearTimers();
    to("leaving");
    after(FADE, () => to("idle"));
  }, [after, clearTimers, to]);

  /* Called when a load or navigation lands. If the curtain is up it owes the
     visitor MIN_SHOW and a finished wordmark before it goes; if it never went
     up, this is a fast click and it leaves without being seen.
   *
   * The wordmark is waited on by polling rather than by a promise, so that it
   * lives on the same timers everything else here does and clearTimers still
   * cancels it. It has its own ceiling: in a background tab no frames are
   * drawn, the typing does not move, and MAX_WAIT is what stops that from
   * holding the curtain for as long as the tab stays hidden. */
  const settle = useCallback(() => {
    if (phaseRef.current !== "shown") {
      drop();
      return;
    }

    clearTimers();

    const release = () => {
      const held = Date.now() - shownAt.current;
      if (held < MIN_SHOW) after(MIN_SHOW - held, release);
      else if (held < MAX_WAIT && !typed()) after(50, release);
      else dismiss();
    };
    release();
  }, [after, clearTimers, dismiss, drop]);

  /* Which of the two curtains this is: the one the server put in the HTML, or
     one a click has since raised. They look the same; the difference is only
     that a raised one must mount fresh, so its typing starts from the first
     letter rather than carrying on from the served one's. */
  const raised = useRef(false);

  const raise = useCallback(() => {
    raised.current = true;
    shownAt.current = Date.now();
    to("shown");
  }, [to]);

  /* The first load. The curtain has been on screen since the first paint;
     it comes down once the page — images, fonts, scripts — has finished
     loading, and not before. */
  useEffect(() => {
    shownAt.current = firstPaintAt();

    const loaded = () => {
      /* A visitor who has already clicked through to somewhere else is not
         waiting on this page any more, and the click owns the curtain now. */
      if (navigating.current) return;
      settle();
    };

    /* The ceiling goes on first, so that a settle() which runs synchronously
       below can clear it. Registered the other way round it would survive and
       fade a curtain over a finished page eight seconds in. */
    after(MAX_WAIT, () => {
      window.removeEventListener("load", loaded);
      if (phaseRef.current !== "idle") dismiss();
    });

    if (document.readyState === "complete") loaded();
    else window.addEventListener("load", loaded, { once: true });

    return () => window.removeEventListener("load", loaded);
    // Once, on mount: this is about the request that built the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Catch the click, not the commit.
   *
   * Waiting for the pathname to change would mean starting the clock after the
   * navigation had already finished, which is the one moment a loading screen
   * is certainly not wanted. Catching the click is what makes the grace period
   * measurable at all: it is the span between asking for a page and getting
   * it, and only this end of it is observable from here.
   *
   * Capture phase so a handler downstream cannot swallow the event first, and
   * passive throughout: this decides when to draw something, it never cancels
   * a navigation. Whatever the browser or the router was going to do with the
   * click, it still does.
   */
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target?.closest?.("a[href]");
      if (!link) return;
      if (link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      let url;
      try {
        url = new URL(link.href, location.href);
      } catch {
        return;
      }

      // Another origin leaves the site; the same path is a jump within this
      // page, and neither is a route change.
      if (url.origin !== location.origin) return;
      if (normalise(url.pathname) === normalise(location.pathname)) return;

      /* The one place an unknown address is turned away. A link into a slug
         that does not exist gets no curtain, so the 404 it resolves to arrives
         as fast as the router can fetch it. */
      if (!known(url.pathname)) return;

      clearTimers();
      navigating.current = true;

      /* The wait and see. Most clicks on this site are answered out of the
         router's prefetch cache and land well inside this, so raise never runs
         and there was never a loading screen to notice. */
      after(GRACE, raise);
      after(MAX_WAIT, () => {
        navigating.current = false;
        /* Guarded, because dismiss() starts a fade and a fade starts from
           something being on screen. If the curtain never went up, there is
           nothing to take down and calling it would put one there. */
        if (phaseRef.current !== "idle") dismiss();
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [after, clearTimers, dismiss, known, raise]);

  // The commit. Either the arrival a click was waiting on, or a move this
  // component had no hand in — the back button, a redirect, a router.push —
  // which is served from cache and wants no curtain at all.
  useEffect(() => {
    if (pathname === settled.current) return;
    settled.current = pathname;

    if (!navigating.current) return;
    navigating.current = false;
    settle();
    // Only a change of path is an arrival; re-running this on a phase change
    // would settle a curtain that has only just gone up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Nothing behind a full-screen curtain is worth scrolling to, and a
     scrollbar next to it gives the game away. The attribute is the one
     app/globals.css watches.
   *
   * The cleanup is not a tidiness measure. A click into a slug that does not
   * exist tears this whole layout down and mounts the 404 under the root one
   * instead, and an attribute left behind would lock the scroll of a page that
   * has no curtain to justify it. */
  useEffect(() => {
    if (phase !== "shown" && phase !== "leaving") return undefined;

    const root = document.documentElement;
    root.dataset.intro = "pending";
    return () => root.removeAttribute("data-intro");
  }, [phase]);

  /* A raised curtain has its typing held until it is seen too. The served one
     was already handed over by the inline script in app/(site)/layout, before
     React existed; this is the same thing for a curtain React built.
   *
   * A layout effect so that it happens before the curtain's first paint. A
   * click is followed by the router rendering the next page, and that is
   * exactly the stall that used to swallow the first half of the word. */
  useLayoutEffect(() => {
    if (phase === "shown" && raised.current) {
      typeWhenSeen(document.querySelector("[data-route-loader]"));
    }
  }, [phase]);

  useEffect(() => clearTimers, [clearTimers]);

  if (phase === "idle") return null;

  return (
    /* Keyed on which curtain this is, so that a raised one always mounts fresh
       rather than inheriting the served one's half-finished animations. Both
       are otherwise rendered identically. */
    <LoadingScreen
      key={raised.current ? "raised" : "served"}
      leaving={phase === "leaving"}
      fade={FADE}
    />
  );
}
