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
          /* MOBILE (below md): the reel is stretched to finish 3px above the
             Announcements heading. It starts at top-24, the offset the hero
             used to carry so the burnt-in title clears the nav card, and its
             height is whatever reaches that landing:

               62vh    the hero, which is min-h-[62vh] and holds no content
               + 66px  the nav, the first thing in the flow
               + 96px  the section's own py-24 above its heading
               -  3px  the requested gap
               = 62vh + 159px   <- where the bottom edge goes
               - 96px  the top-24 the reel starts at
               = 62vh + 63px    <- so this is the height

             Measured exact on 320, 390 and 430px phones. If the hero height,
             the nav height or that py-24 change, this has to move with them.

             The trade: object-cover fills a portrait box by scaling the footage
             until it covers, which crops the sides — a phone shows roughly a
             third of the frame width. Filling the space and keeping the whole
             frame are the same knob turned opposite ways, and filling it is
             what was asked for.

             DESKTOP (md up): unchanged. The reel hangs from the top at the
             footage's own ratio (848/480 = 53/30), full width, uncropped. */
          className="absolute inset-x-0 w-full object-cover object-center
            top-24 h-[calc(62vh+63px)] aspect-auto
            [-webkit-mask-image:linear-gradient(to_bottom,#000_92%,transparent)]
            [mask-image:linear-gradient(to_bottom,#000_92%,transparent)]
            md:top-0 md:h-auto md:aspect-[53/30]
            md:[-webkit-mask-image:linear-gradient(to_bottom,#000_85%,transparent)]
            md:[mask-image:linear-gradient(to_bottom,#000_85%,transparent)]
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
