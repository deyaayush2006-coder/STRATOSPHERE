"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";
import { afterIntro, gsap, SplitText, useGSAP } from "@/lib/gsap";

const HOLD = 3500;
const FADE = 1000;

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

  useEffect(() => {
    if (live) setReach((r) => Math.max(r, next));
  }, [live, next]);

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

  useEffect(() => {
    if (prev < 0) return undefined;
    const timer = setTimeout(() => setPrev(-1), FADE);
    return () => clearTimeout(timer);
  }, [prev]);

  const markReady = (i) => setReady((r) => (r.includes(i) ? r : [...r, i]));

  return { index, prev, reach, live, paused, setPaused, markReady };
}

// The title block is hidden on mount, then built in once the intro loader has
// gone: the accent bar grows, the letters rise out of a mask, the ring around
// the O draws itself and the two subtitle lines follow. Scrolling away lifts
// and fades it. Reduced motion skips all of it and shows the static block.
function useHeroTitle(bandRef, titleRef) {
  useGSAP(
    (_, contextSafe) => {
      const block = titleRef.current;
      if (!block) return undefined;

      const mm = gsap.matchMedia();
      let stop = () => {};

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(block, { autoAlpha: 0 });

        const build = contextSafe(() => {
          const split = SplitText.create(block.querySelector("[data-hero-title]"), {
            type: "chars",
            mask: "chars",
          });

          gsap.set(block, { autoAlpha: 1 });
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from("[data-hero-bar]", { scaleY: 0, duration: 0.6, ease: "power2.inOut" })
            .from(split.chars, { yPercent: 110, duration: 0.8, stagger: 0.035 }, "-=0.25")
            .from("[data-hero-ring]", { drawSVG: "0%", duration: 0.9, ease: "power2.inOut" }, "-=0.45")
            .from("[data-hero-line]", { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, "-=0.6");

          gsap.to(block, {
            yPercent: -40,
            autoAlpha: 0,
            ease: "none",
            scrollTrigger: { trigger: bandRef.current, start: "top top", end: "bottom top", scrub: 0.4 },
          });
        });

        stop = afterIntro(() => document.fonts.ready.then(build));
        return () => stop();
      });

      return () => mm.revert();
    },
    { scope: bandRef }
  );
}

export default function Hero({ slides = [] }) {
  const bandRef = useRef(null);

  const photos = slides
    .map((slide) => slide?.src)
    .filter((src, i, all) => src && all.indexOf(src) === i)
    .map(mediaUrl);

  const { index, prev, reach, live, paused, setPaused, markReady } = useSlideshow(
    photos.length,
    bandRef
  );
  const moving = photos.length > 1;

  const titleRef = useRef(null);
  useHeroTitle(bandRef, titleRef);

  return (
    <header
      ref={bandRef}
      id="overview"
      className="relative isolate grid overflow-hidden scroll-mt-1 mt-[calc(1rem+2px)] min-h-[calc(100svh-7.25rem+8px)]"
    >
      {photos.map((src, i) =>
        i > reach ? null : (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="(orientation: portrait) 140vh, 100vw"
            onLoad={() => markReady(i)}
            onError={() => markReady(i)}
            className={`object-cover object-[100%_25%] origin-top motion-reduce:animate-none ${
              i === index
                ? "-z-10 opacity-100 transition-opacity duration-[1000ms] ease-in-out"
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
        <div
          ref={titleRef}
          className="flex flex-col w-[330px] md:w-[500px] text-left pr-2 absolute top-[calc(40vh+3px)] left-[5%] font-semibold gap-y-4"
        >
          <span
            data-hero-bar
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-[4px] origin-top bg-[#309ece] [[data-theme=light]_&]:bg-[#0D4C72]"
          />
          <div className="pl-[19px] text-4xl md:text-5xl">
            <span
              data-hero-title
              className="font-display text-[35px] sm:text-[47px] hover:text-aurora2 font-bold uppercase leading-none tracking-[0.01em] text-ink"
            >
              Strat
              <span className="relative inline-block">
                O
                <svg
                  aria-hidden="true"
                  viewBox="0 0 145 40"
                  fill="none"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[0.4em] w-[1.45em] -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] overflow-visible text-ink/75"
                >
                  <ellipse
                    data-hero-ring
                    cx="72.5"
                    cy="20"
                    rx="72"
                    ry="19.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </span>
              sphere
            </span>
          </div>
          <div className="pl-[19px] text-4xl md:text-5xl">
            <span className="inline-block w-fit max-w-full min-w-0 leading-[1.15]">
              <span
                data-hero-line
                className="hover:text-aurora2 block truncate text-[18px] sm:text-[27px] font-bold uppercase tracking-[0.03em] text-ink"
              >
                Aerospace Club
              </span>
              <span
                data-hero-line
                className="block truncate text-[18px] sm:text-[27px] hover:text-aurora2 text-ink/85"
              >
                Jadavpur University
              </span>
            </span>
          </div>
        </div>
      </div>

    </header>
  );
}
