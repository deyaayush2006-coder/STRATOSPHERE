"use client";

import { useRef } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";
import { afterIntro, gsap, SplitText, useGSAP } from "@/lib/gsap";

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

export default function Hero({ photo }) {
  const bandRef = useRef(null);
  const src = mediaUrl(photo);

  const titleRef = useRef(null);
  useHeroTitle(bandRef, titleRef);

  return (
    <header
      ref={bandRef}
      id="overview"
      className="relative isolate grid overflow-hidden scroll-mt-1 mt-[calc(1rem+2px)] min-h-[calc(100svh-7.25rem+8px)]"
    >
      {src && (
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(orientation: portrait) 200vh, 100vw"
          className="-z-10 object-cover object-[72%_45%]"
        />
      )}
      <div
        className="col-start-1 row-start-1 bg-gradient-to-t from-base via-base/55 to-transparent
          [[data-theme=light]_&]:via-base/0 [[data-theme=light]_&]:via-[24%]"
        aria-hidden="true"
      />
      <div
        className="col-start-1 row-start-1 bg-gradient-to-r from-base/85 via-base/25 to-transparent
          [[data-theme=light]_&]:from-base/85 [[data-theme=light]_&]:via-base/40 [[data-theme=light]_&]:via-[30%]
          [[data-theme=light]_&]:to-[58%]"
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
