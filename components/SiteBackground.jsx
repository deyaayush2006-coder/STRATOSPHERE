"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import SoftAurora from "./SoftAurora";

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

    paint();
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

export default function SiteBackground({ plain = false }) {
  const pathname = usePathname();

  const onDetail = pathname.startsWith("/projects/") || pathname.startsWith("/events/");
  const depthRef = useScrollDepth(plain || onDetail);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-sky" />

      <div ref={depthRef} className={`absolute inset-0 ${plain || onDetail ? "" : "opacity-0"}`}>
        <div className="absolute inset-0 bg-[radial-gradient(130%_95%_at_50%_-15%,#0b2b5e_0%,#071733_34%,#040a18_66%,#03060d_100%)] [[data-theme=light]_&]:hidden" />
        <div className="absolute inset-0 [[data-theme=light]_&]:hidden">
          <SoftAurora
            speed={0.25}
            scale={1.2}
            brightness={0.6}
            color1="#3987e5"
            color2="#22d3ee"
            bandHeight={0.62}
            bandSpread={1}
            layerOffset={1.5}
            colorSpeed={0.4}
          />
        </div>
        <div className="absolute inset-0 hidden opacity-80 bg-[radial-gradient(130%_95%_at_50%_-15%,#b3cbea_0%,#c9daf0_40%,#dfe8f4_100%)] [[data-theme=light]_&]:block" />
      </div>

      <div className="absolute inset-0 bg-blueprint mask-fade-edges opacity-60" />

      <div className="absolute inset-0 bg-vignette" />

      <div className="absolute inset-0 bg-grain opacity-[0.06]" />

      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-base/70 to-transparent" />
    </div>
  );
}
