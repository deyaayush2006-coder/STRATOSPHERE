import React from "react";
import { useContent } from "../content/ContentProvider";
import { mediaUrl } from "../lib/api";

// Fixed backdrop, stacked bottom to top. Mount once, at the root.

// Fades the depth wash in over the first 80vh. Opacity is written straight
// to the node so scrolling never re-renders the tree.
function useScrollDepth() {
  const ref = React.useRef(null);

  React.useEffect(() => {
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

export default function SiteBackground() {
  const backdrop = mediaUrl(useContent("site")?.backdrop);
  const depthRef = useScrollDepth();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 1 — sky */}
      <div className="absolute inset-0 bg-sky" />

      {/* 2 — campus photo, held at --backdrop-opacity so it reads as texture */}
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          style={{ opacity: "var(--backdrop-opacity)" }}
          className="absolute inset-0 h-full w-full object-cover object-top"
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
