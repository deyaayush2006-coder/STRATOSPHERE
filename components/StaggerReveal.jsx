"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

// GSAP ScrollTrigger.batch: the items matching `items` rise in one after
// another as they reach the viewport, instead of the whole group fading at
// once. Reduced motion leaves everything in place.
export default function StaggerReveal({ items, className = "", children }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const targets = gsap.utils.toArray(items, ref.current);
      if (!targets.length) return undefined;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(targets, { autoAlpha: 0, y: 28 });

        ScrollTrigger.batch(targets, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => {
            // The cards carry CSS transitions for hover; pause them so they
            // don't smear the tween, and hand control back afterwards.
            batch.forEach((el) => (el.style.transition = "none"));
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.09,
              overwrite: true,
              onComplete: () => {
                batch.forEach((el) => (el.style.transition = ""));
                gsap.set(batch, { clearProps: "transform,opacity,visibility" });
              },
            });
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
