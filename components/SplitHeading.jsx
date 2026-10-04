"use client";

import { useRef } from "react";
import { afterIntro, gsap, SplitText, useGSAP } from "@/lib/gsap";

// GSAP SplitText: the heading's words rise out of a mask once the page's
// loader has cleared. The server renders the plain heading; reduced motion
// keeps it that way.
export default function SplitHeading({ as: Tag = "h1", className = "", children }) {
  const ref = useRef(null);

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el) return undefined;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(el, { autoAlpha: 0 });

        const play = contextSafe(() => {
          const split = SplitText.create(el, { type: "words", mask: "words" });
          gsap.set(el, { autoAlpha: 1 });
          gsap.from(split.words, { yPercent: 110, duration: 0.8, ease: "power3.out", stagger: 0.06 });
        });

        const stop = afterIntro(() => document.fonts.ready.then(play));
        return () => stop();
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
