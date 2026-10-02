"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";

/* The band at the top of the front page, and the photographs that run behind
 * its title.
 *
 * The backdrop still opens the run. It is the photo the dashboard sets, and
 * the only one a reader who has asked for less motion ever sees. The club's
 * own photos follow it (heroSlides, in lib/defaults). Each is held for HOLD,
 * then the next fades in over it across FADE while the one underneath stays
 * put, so the crossfade never dips through to the page behind.
 *
 * Only the photo on screen and the one after it are ever in the document. The
 * rest join as the run reaches them, so the page opens on one photograph
 * rather than the whole set.
 */
const HOLD = 6500;
const FADE = 1500; // the duration-[1500ms] on the photos below

/* Which photo is up, which one it is covering, and how far into the list the
   document has been filled.
 *
 * The run only moves while someone can see it and wants it to: never under
 * reduced motion, not in a background tab, not once the band has scrolled
 * away, and not after the pause button. It also never fades in a photo that
 * has not finished arriving — a hold that runs out first waits for it. */
function useSlideshow(count, ref) {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [reach, setReach] = useState(0);
  const [ready, setReady] = useState([0]);
  const [heldFor, setHeldFor] = useState(-1);
  const [allowed, setAllowed] = useState(false);
  const [paused, setPaused] = useState(false);

  const live = allowed && !paused && count > 1;
  const next = (index + 1) % count;
  const nextReady = ready.includes(next);

  useEffect(() => {
    const node = ref.current;
    if (!node || count < 2) return undefined;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;
    const sync = () => setAllowed(!mq.matches && !document.hidden && onScreen);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });

    io.observe(node);
    sync();
    mq.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref, count]);

  // The next photo joins the document while this one holds.
  useEffect(() => {
    if (live) setReach((r) => Math.max(r, next));
  }, [live, next]);

  /* Remembered as the photo whose hold ran out, not as a flag: by the time
     the next one is up, a stale "done" would belong to the wrong photo and
     skip it straight past. */
  useEffect(() => {
    if (!live) return undefined;
    const timer = setTimeout(() => setHeldFor(index), HOLD);
    return () => clearTimeout(timer);
  }, [live, index]);

  useEffect(() => {
    if (!live || heldFor !== index || !nextReady) return;
    setPrev(index);
    setIndex(next);
  }, [live, heldFor, index, next, nextReady]);

  // Once the new photo has covered it, the old one can drop out of sight.
  useEffect(() => {
    if (prev < 0) return undefined;
    const timer = setTimeout(() => setPrev(-1), FADE);
    return () => clearTimeout(timer);
  }, [prev]);

  const markReady = (i) => setReady((r) => (r.includes(i) ? r : [...r, i]));

  return { index, prev, reach, live, paused, setPaused, markReady };
}

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
  </svg>
);

export default function Hero({ backdrop, slides = [] }) {
  const bandRef = useRef(null);

  // The backdrop first, and not a second time if the list repeats it.
  const photos = [backdrop, ...slides.map((slide) => slide?.src)]
    .filter((src, i, all) => src && all.indexOf(src) === i)
    .map(mediaUrl);

  const { index, prev, reach, live, paused, setPaused, markReady } = useSlideshow(
    photos.length,
    bandRef
  );
  const moving = photos.length > 1;

  return (
    <header
      ref={bandRef}
      id="overview"
      className="relative isolate grid overflow-hidden scroll-mt-28 mt-[calc(1rem+10px)] min-h-[calc(100svh-10.25rem)]"
    >
      {photos.map((src, i) =>
        i > reach ? null : (
          /* alt="" because the photos are the band's backdrop: the title over
             them is the content, and a screen reader would otherwise read out
             every photo in the stack.
           *
           * Only the incoming photo carries the transition. The one it covers
           * is already opaque, and the rest have to vanish at once — a slow
           * fade-out on a photo from two turns ago would show it again over
           * the one underneath. */
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === 0}
            /* Upright, the band is taller than it is wide, so cover draws a
               landscape photo by its height: a 16:9 one comes out around
               140vh wide. 100vw would fetch a file a third of that and
               stretch it. */
            sizes="(orientation: portrait) 140vh, 100vw"
            // next/image only calls onLoad once the photo is decoded, so ready
            // means ready to paint. A broken file counts as well, or it would
            // stall the run for good.
            onLoad={() => markReady(i)}
            onError={() => markReady(i)}
            className={`object-cover object-center motion-reduce:animate-none ${
              i === index
                ? "-z-10 opacity-100 transition-opacity duration-[1500ms] ease-in-out"
                : `-z-20 ${i === prev ? "opacity-100" : "opacity-0"}`
            } ${moving && (i === index || i === prev) ? (i % 2 ? "animate-hero-pull" : "animate-hero-push") : ""} ${
              live ? "" : "[animation-play-state:paused]"
            }`}
          />
        )
      )}
      <div
        className="col-start-1 row-start-1 bg-gradient-to-t from-base via-base/55 to-transparent"
        aria-hidden="true"
      />
      <div
        className="col-start-1 row-start-1 bg-gradient-to-r from-base/85 via-base/25 to-transparent"
        aria-hidden="true"
      />
      <div className="col-start-1 row-start-1 flex flex-col justify-end px-6 pb-14 md:px-10 md:pb-20">
        <div className="hero-title flex flex-col border-l-[4px] border-x-[#0D4C72] dark:border-x-[#309ece] w-[330px] md:w-[500px] text-left pr-2 absolute top-[40vh] left-[5%] font-semibold font-Josefin gap-y-4">
          <div className="pl-[15px] text-4xl md:text-5xl text-black dark:text-white">
            <span className="font-display text-[35px] sm:text-[47px] hover:text-aurora2 font-bold uppercase leading-none tracking-[0.01em] text-ink">
              Strat
              <span className="relative inline-block">
                O
                <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[0.4em] w-[1.45em] -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] rounded-[50%] border border-ink/75">
                </span>
              </span>
              sphere
            </span>
          </div>
          <div className="pl-[15px] text-4xl md:text-5xl text-[#0D4C72] dark:text-[#38BDF8]">
            <span className=" inline-block w-fit max-w-full hidden sm:block min-w-0 leading-[1.15]">
              <span className="hover:text-aurora2 block truncate text-[27px] font-bold uppercase tracking-[0.03em] text-ink">
                Aerospace Club
              </span>
              <span className="block truncate text-[27px] hover:text-aurora2 text-ink/85">
                Jadavpur University
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Anything that moves on its own for longer than a few seconds needs a
          way to stop it. Hidden under reduced motion, where nothing moves. */}
      {moving && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the photos" : "Pause the photos"}
          className="absolute bottom-5 right-5 md:bottom-8 md:right-10 grid h-9 w-9 place-items-center rounded-full
            ring-1 ring-ink/20 text-ink/60 transition duration-150 hover:text-aurora2 hover:ring-aurora2/40
            focus-visible:outline-2 focus-visible:outline-aurora2 focus-visible:outline-offset-4 motion-reduce:hidden"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
        </button>
      )}
    </header>
  );
}
