"use client";

import { useEffect, useRef } from "react";
import { mediaUrl } from "@/lib/media-url";

// Fixed backdrop, stacked bottom to top. Mount once, at the root.

// Fades the depth wash in over the first 80vh. Opacity is written straight
// to the node so scrolling never re-renders the tree.
function useScrollDepth() {
  const ref = useRef(null);

  useEffect(() => {
    let frame = 0;

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
  }, []);

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
  const still = mediaUrl(backdrop);
  const reel = mediaUrl(video);
  const depthRef = useScrollDepth();
  const reelRef = useRef(null);

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
          preload="auto"
          style={{ opacity: "var(--backdrop-opacity)" }}
          /* The element takes the footage's own ratio (848/480 = 53/30) at full
             width and hangs from the top, so the frame is never cropped
             sideways at any size. Stretched over the whole viewport instead it
             lost about two thirds of its width on a portrait phone, and 57% on
             an iPad held upright.

             No breakpoint on purpose: a width test got this wrong, because what
             decides it is whether the viewport is narrower than the footage,
             not how many pixels across it is. Letting the ratio drive it covers
             every screen — on one wider than 16:9 the band simply runs past the
             bottom edge and the parent clips it, which costs height rather than
             width and is the safe axis to lose.

             The mask fades the lower edge out so the band has no hard boundary
             where it ends against the sky. */
          className="absolute inset-x-0 top-0 w-full aspect-[53/30] object-cover object-center
            [-webkit-mask-image:linear-gradient(to_bottom,#000_85%,transparent)]
            [mask-image:linear-gradient(to_bottom,#000_85%,transparent)]
            motion-reduce:hidden"
        />
      )}

      {/* A full-page video that never stops is exactly what a reduced-motion
          preference is asking about, so that reader gets the still instead.
          It is also the plain backdrop when no video is set at all. */}
      {still && (
        <img
          src={still}
          alt=""
          style={{ opacity: "var(--backdrop-opacity)" }}
          className={`absolute inset-0 h-full w-full object-cover object-top ${
            reel ? "motion-safe:hidden" : ""
          }`}
        />
      )}

      {/* 3 — depth wash, transparent at the top so the hero keeps the bloom */}
      <div ref={depthRef} className="absolute inset-0 opacity-0">
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
