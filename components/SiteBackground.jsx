"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { mediaUrl } from "@/lib/media-url";

// Fixed backdrop, stacked bottom to top. Mount once, at the root.

// Fades the depth wash in over the first 80vh. Opacity is written straight
// to the node so scrolling never re-renders the tree.
//
// `pinned` turns the fade off for pages that want the wash at full strength
// from the first paint. The inline opacity is cleared on the way in, because
// a client-side navigation reuses the node and would otherwise keep whatever
// scroll position the previous page left written on it.
function useScrollDepth(pinned) {
  const ref = useRef(null);

  useEffect(() => {
    let frame = 0;

    if (pinned) {
      if (ref.current) ref.current.style.opacity = "";
      return undefined;
    }

    const paint = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const span = window.innerHeight * 0.8;
      node.style.opacity = String(Math.min(1, window.scrollY / span));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint(); // honour a restored scroll position on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pinned]);

  return ref;
}

/* display:none hides a video without stopping it — it keeps decoding frames
   and draining the battery, which is the opposite of what the preference is
   asking for. The class swap handles what is seen; this handles what runs. */
function useHaltWhenStill(ref, enabled) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return undefined;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (mq.matches) node.pause();
      // Rejects when the browser blocks autoplay, which is not an error worth
      // surfacing: the still is already showing underneath.
      else node.play().catch(() => {});
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [ref, enabled]);
}

export default function SiteBackground({ backdrop, video }) {
  const pathname = usePathname();

  /* A project write-up gets the depth wash on its own: no reel, no photo, just
     the blue-black gradient at full strength from the first paint.

     Both of those layers are staged for the front page, where the hero band
     gives them a clear run. A write-up opens straight into a breadcrumb and
     body copy, so the photo was sitting behind paragraphs with nothing to
     frame and only cost contrast. Skipping it also drops the largest image on
     the page — it is `priority`, so it was competing with the text it sat
     behind. */
  const onProject = pathname.startsWith("/projects/");

  const still = onProject ? "" : mediaUrl(backdrop);
  const depthRef = useScrollDepth(onProject);
  const reelRef = useRef(null);

  /* The reel belongs to the front page only.
   *
   * It is staged against the hero band, which exists to give it a clear run
   * before the first section. A project page has no hero — it opens straight
   * into a breadcrumb and a title — so the reel was playing behind body copy
   * with nowhere to land, and the page below had to start a screen further
   * down to clear it. The still carries those pages instead, which is what
   * every other layer here was already doing. */
  const onHome = pathname === "/";
  const reel = onHome ? mediaUrl(video) : "";

  useHaltWhenStill(reelRef, Boolean(reel));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 1 — sky */}
      <div className="absolute inset-0 bg-sky" />

      {/* 2 — the club reel, held at --backdrop-opacity so it reads as texture
             rather than as a player, and washed out by layer 3 as the page
             scrolls. This is the slot the campus photo used to sit in.
             The photo stays on as the poster, so the first paint is the
             still rather than a black rectangle while the video buffers. */}
      {reel && (
        <video
          ref={reelRef}
          src={reel}
          poster={still || undefined}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="auto"
          style={{ opacity: "var(--backdrop-opacity)" }}
          /* The box is the footage's own ratio (848/480 = 53/30), so object-cover
           * can never distort: the box and the frame agree on shape, and the
           * width of the box is the only thing deciding how much of the frame
           * survives.
           *
           * Desktop spans the full width, so the frame arrives whole.
           *
           * A phone blows the box up past the viewport by --reel-scale and
           * centres it, trading the side margins for a taller band. At 1 the
           * whole frame shows but the band is a thin strip; what the crop eats
           * into is the club titling in the footage, so dial the variable back
           * if the last word starts clipping. The hero below reads the same
           * number, so whatever it is set to, the first section still starts
           * exactly where the footage stops.
           *
           * What this must not go back to is covering a tall portrait box,
           * which is where it started: that scales a landscape frame until it
           * covers, throws away roughly two thirds of the width, and leaves the
           * phone with a moving close-up of whatever is dead centre. Cropping
           * evenly from both margins is the same trade made in proportion.
           *
           * The bottom fade starts earlier on a phone, where the reel ends
           * higher up the screen and a hard edge would be obvious. */
          className="absolute top-24 left-1/2 -translate-x-1/2 w-[calc(100%*var(--reel-scale))] h-auto aspect-[53/30] object-cover object-center
            [-webkit-mask-image:linear-gradient(to_bottom,#000_72%,transparent)]
            [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]
            md:top-0 md:left-0 md:translate-x-0 md:w-full
            md:[-webkit-mask-image:linear-gradient(to_bottom,#000_85%,transparent)]
            md:[mask-image:linear-gradient(to_bottom,#000_85%,transparent)]
            motion-reduce:hidden"
        />
      )}

      {/* A full-page video that never stops is exactly what a reduced-motion
          preference is asking about, so that reader gets the still instead.
          It is also the plain backdrop when no video is set at all. */}
      {still && (
        /* fill rather than a width/height pair: the box is the viewport, and
           the backdrop is the largest image on the page, so it is also the one
           that most wants resizing down to the device. priority because it is
           painted before anything scrolls — lazy-loading the thing behind the
           fold-one content just delays it. */
        <Image
          src={still}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ opacity: "var(--backdrop-opacity)" }}
          className={`object-cover object-top ${reel ? "motion-safe:hidden" : ""}`}
        />
      )}

      {/* 3 — depth wash, transparent at the top so the hero keeps the bloom.
             On a project page there is no hero to keep it for, so it is opaque
             from the top and becomes the background in its own right. */}
      <div ref={depthRef} className={`absolute inset-0 ${onProject ? "" : "opacity-0"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(130%_95%_at_50%_-15%,#0b2b5e_0%,#071733_34%,#040a18_66%,#03060d_100%)] [[data-theme=light]_&]:hidden" />
        <div className="absolute inset-0 hidden opacity-80 bg-[radial-gradient(130%_95%_at_50%_-15%,#b3cbea_0%,#c9daf0_40%,#dfe8f4_100%)] [[data-theme=light]_&]:block" />
      </div>

      {/* 4 — engineering ruling */}
      <div className="absolute inset-0 bg-blueprint mask-fade-edges opacity-60" />

      {/* 5 — vignette */}
      <div className="absolute inset-0 bg-vignette" />

      {/* 6 — grain */}
      <div className="absolute inset-0 bg-grain opacity-[0.06]" />

      {/* 7 — scrim under the nav */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-base/70 to-transparent" />
    </div>
  );
}
