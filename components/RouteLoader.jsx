"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { typeWhenSeen } from "@/lib/typing-clock";
import LoadingScreen from "./LoadingScreen";

/* The loading screen, in front of the pages of the public site that need one.
 *
 * It is a report on a wait, not a ceremony. A page that arrives at once shows
 * nothing at all — no curtain, no flash, no hold — and the visitor never
 * learns there is a loading screen on this site. It is only a navigation that
 * is still going after GRACE that gets one, which is the case it is for: a
 * cold cache, a phone on campus wifi, a project page with a model viewer on
 * it. This is why the delay is not a fixed one: a curtain that always runs
 * makes a fast site feel like a slow one, and there is nothing to report when
 * there was no wait.
 *
 * Three things have to be true, and each one decides a piece of what is below.
 *
 * Nothing may flash. That is the whole difficulty, because the first frame of
 * a real request is painted before any of this exists — the curtain is in the
 * server-rendered HTML, and React is not running yet to decide about it. So
 * the first decision is not made here at all: --animate-curtain-in holds the
 * overlay hidden for the grace period, and this component's job on a fast load
 * is to get it out of the tree before that runs out. Later navigations never
 * have that problem, because by then React is in charge and can simply wait
 * and see.
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
 * navigation is slow, blocked, or simply never commits, MAX_WAIT lifts the
 * curtain rather than leaving a visitor looking at a logo.
 */

/* Under this, a navigation counts as instant and no curtain is ever shown.
   It has to match the delay on --animate-curtain-in in app/globals.css, which
   is the same threshold enforced in CSS for the first paint — change one and
   the other has to move with it. */
const GRACE = 400;

/* Once it is up, it stays up this long. Without a floor a wait that only just
   crossed GRACE would put a full-screen lockup on the page for two frames,
   which reads as a glitch rather than as loading.
 *
 * It is no longer what keeps the wordmark whole. The typing now waits for the
 * curtain to be seen before it starts (see lib/typing-clock), so it can finish
 * later than any fixed figure, and `typed` below is what holds the curtain
 * until it is done.
 * This is the floor for when there is no typing to wait for — a visitor with
 * reduced motion gets the lockup already assembled. */
const MIN_SHOW = 950;

/* The ceiling, counted from the start of the navigation. Past this the page is
   not coming, and a visitor is better off with whatever is behind the curtain
   than with the curtain. */
const MAX_WAIT = 8000;

// Matches the fade LoadingScreen is given; they have to agree or the overlay
// either flickers back in or leaves a gap of nothing.
const FADE = 500;

/* How long the served curtain has actually been on screen, in milliseconds, or
   0 if it has not appeared yet.
 *
 * Read off the element's own running animation rather than worked out from any
 * clock of ours, because the only clock that agrees with the CSS is the one
 * the CSS is on. A CSS animation's currentTime counts from the moment the
 * element was created and includes the delay, so subtracting the delay gives
 * exactly how long the curtain has been visible — whatever the server did
 * beforehand, and whatever the delay is changed to.
 *
 * The fallbacks matter more than they look. If the animation cannot be found
 * the curtain is either already adopted or was never served, and a raised
 * curtain is timed by its own raise() rather than by this. Returning 0 says
 * "not visible", which is the answer that dismisses rather than the one that
 * shows something empty. */
function shownFor() {
  const el = document.querySelector("[data-route-loader]");
  if (!el || typeof el.getAnimations !== "function") return 0;

  const curtain = el.getAnimations().find((a) => a.animationName === "curtainIn");
  if (!curtain) return 0;

  const t = Number(curtain.currentTime);
  return Number.isFinite(t) ? Math.max(0, t - GRACE) : 0;
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

  /* Four states, and the awkward one is the first.
   *
   *   arming    the server-rendered curtain, still undecided. CSS is keeping
   *             it hidden; whether it is ever seen depends on which happens
   *             first, the page finishing or the grace period running out.
   *   idle      nothing rendered. Where a fast load and a fast click end up.
   *   shown     deliberately on screen, and staying for at least MIN_SHOW.
   *   leaving   fading out.
   *
   * It starts at "arming" on both sides of hydration, so the server HTML and
   * the first client render agree. */
  const [phase, setPhase] = useState("arming");

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

  /* Gone without a fade. For the case where the curtain was never visible in
     the first place — there is nothing to fade, and a transition out of an
     overlay nobody saw is FADE milliseconds of an invisible sheet sitting over
     the page eating clicks. */
  const drop = useCallback(() => {
    clearTimers();
    to("idle");
  }, [clearTimers, to]);

  const dismiss = useCallback(() => {
    clearTimers();
    to("leaving");
    after(FADE, () => to("idle"));
  }, [after, clearTimers, to]);

  /* Called when a navigation lands, whichever kind it was. If the curtain went
     up it owes the visitor MIN_SHOW and a finished wordmark before it goes; if
     it never did, this is the fast path and it leaves without being seen.
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

  /* Which of the two curtains is on screen: the one the server put in the HTML,
     or one this component has since put up itself.
   *
   * It is not the same question as the phase. A server-rendered curtain that
   * gets adopted moves to "shown" like any other, but it is still the one
   * whose animations started when the page was parsed, and telling
   * LoadingScreen otherwise would restart the typing halfway through the
   * showing. Once a click has raised one, every curtain after it is raised —
   * the server's was only ever the first. */
  const raised = useRef(false);

  const raise = useCallback(() => {
    raised.current = true;
    shownAt.current = Date.now();
    to("shown");
  }, [to]);

  /* The opening question, and the only one CSS has already had a go at: is
     this page still loading, now that React is finally running?
   *
   * document.readyState answers that half. The other half — has the curtain
   * actually appeared yet — has to be asked of the curtain itself, and that is
   * what `shownFor` below is for.
   *
   * It used to be answered with performance.now(), on the reasoning that the
   * CSS delay and the navigation were on the same clock. They are not. A CSS
   * animation starts when its element is created, which is when the HTML is
   * parsed; performance.now() counts from the start of the navigation, which
   * is before the server has even answered. On a quick connection the two are
   * within a few milliseconds of each other and it worked. On a slow first
   * byte they are a second apart, and this would decide the curtain had long
   * since faded in while CSS still had it hidden — so it adopted it, which
   * forces it visible on the spot, while everything inside was still sitting
   * out its own delay at opacity zero. A black screen with nothing on it, for
   * exactly as long as the server had been slow. */
  useEffect(() => {
    const decide = () => {
      /* A visitor who has already clicked through to somewhere else is not
         waiting on this page any more, and the click owns the curtain now. */
      if (navigating.current) return;

      const seen = shownFor();

      if (seen <= 0) {
        // Never became visible. Take it out before it can.
        drop();
        return;
      }

      /* It is up, or is part way through fading in. Adopt it as a curtain we
         chose to show, dated from when CSS started showing it rather than from
         now, so MIN_SHOW is measured against what the visitor actually saw. */
      shownAt.current = Date.now() - seen;
      to("shown");
      settle();
    };

    /* The ceiling goes on first, so that a decide() which runs synchronously
       below can clear it. Registered the other way round it would survive the
       fast path and drop a curtain over a finished page eight seconds in. */
    after(MAX_WAIT, () => {
      window.removeEventListener("load", decide);
      if (phaseRef.current !== "idle") dismiss();
    });

    if (document.readyState === "complete") decide();
    else window.addEventListener("load", decide, { once: true });

    return () => window.removeEventListener("load", decide);
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
     app/globals.css watches, and it goes on only once the curtain is really
     there — never while arming, where the page underneath is still the live
     one and taking its scrollbar away would be a visible jump on every fast
     load.
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
       rather than inheriting the served one's half-finished animations. */
    <LoadingScreen
      key={raised.current ? "raised" : "served"}
      reveal={raised.current ? "now" : "delayed"}
      offset={raised.current ? 0 : GRACE}
      leaving={phase === "leaving"}
      fade={FADE}
    />
  );
}
