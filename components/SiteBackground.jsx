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

/* `plain` is the same treatment a write-up gets — wash only, no photograph —
   asked for directly rather than worked out from the path. The 404 needs it and
   cannot be recognised by pathname, because its pathname is whatever the
   visitor mistyped. */
export default function SiteBackground({ backdrop, plain = false }) {
  const pathname = usePathname();

  /* Two pages want nothing behind them but the depth wash.
   *
   * A project write-up gets it at full strength from the first paint. It opens
   * straight into a breadcrumb and body copy, so the photo was sitting behind
   * paragraphs with nothing to frame and only cost contrast. Skipping it also
   * drops the largest image on the page — it is `priority`, so it was
   * competing with the text it sat behind.
   *
   * The front page skips it because Hero is carrying the reel itself now, and
   * the photo is the reel's poster. Leaving it here as well would put a
   * full-screen campus photo behind every section below the fold, which is not
   * something this page has ever shown. */
  const onProject = pathname.startsWith("/projects/");
  const onHome = pathname === "/";

  const still = plain || onProject || onHome ? "" : mediaUrl(backdrop);
  const depthRef = useScrollDepth(plain || onProject);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 1 — sky */}
      <div className="absolute inset-0 bg-sky" />

      {/* 2 — the campus photo, held at --backdrop-opacity so it reads as
             texture rather than as a picture, and washed out by layer 3 as the
             page scrolls. The front page and the write-ups opt out above; what
             is left is every other page, which has no reel of its own and
             would otherwise open on bare sky. */}
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
          className="object-cover object-top"
        />
      )}

      {/* 3 — depth wash, transparent at the top so the hero keeps the bloom.
             On a project page there is no hero to keep it for, so it is opaque
             from the top and becomes the background in its own right. */}
      <div ref={depthRef} className={`absolute inset-0 ${plain || onProject ? "" : "opacity-0"}`}>
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
