"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

// React Bits ScrollReveal: words brighten one after another as the paragraph
// scrolls through the viewport. Adapted to clean up only its own triggers
// (the original kills every ScrollTrigger on the page), to keep the caller's
// element and classes, and to fade opacity only — per-word blur is costly.
export default function ScrollReveal({
  as: Tag = "p",
  children,
  className = "",
  baseOpacity = 0.18,
  start = "top 85%",
  end = "bottom 55%",
}) {
  const ref = useRef(null);
  const text = typeof children === "string" ? children : "";

  const words = useMemo(
    () =>
      text.split(/(\s+)/).map((word, i) =>
        /^\s+$/.test(word) ? (
          word
        ) : (
          <span key={i} data-word className="inline-block">
            {word}
          </span>
        )
      ),
    [text]
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: baseOpacity },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: { trigger: ref.current, start, end, scrub: true },
          }
        );
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [text, baseOpacity, start, end], revertOnUpdate: true }
  );

  if (!text) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag ref={ref} className={className}>
      {words}
    </Tag>
  );
}
