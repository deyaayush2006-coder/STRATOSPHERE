"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { afterIntro, gsap, useGSAP } from "@/lib/gsap";

// With `reveal`, GSAP wipes the image up into view (clip-path) while it
// settles from a slight zoom, once the page's loader has cleared.
export default function Cover({ src, alt, className, priority = false, reveal = false }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!reveal || !el) return undefined;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(el, { clipPath: "inset(0 0 100% 0)" });

        const play = contextSafe(() => {
          gsap
            .timeline({ defaults: { duration: 1.1, ease: "power3.inOut" } })
            .to(el, { clipPath: "inset(0 0 0% 0)" })
            .from(el.querySelector("img"), { scale: 1.12, ease: "power3.out", duration: 1.4 }, 0);
        });

        const stop = afterIntro(play);
        return () => stop();
      });

      return () => mm.revert();
    },
    { dependencies: [reveal, src], revertOnUpdate: true }
  );

  if (!src || failed) return null;

  const image = (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      sizes="(max-width: 1200px) 100vw, 1152px"
      onError={() => setFailed(true)}
      className={className}
    />
  );

  if (!reveal) return image;

  return (
    <div ref={ref} className="overflow-hidden">
      {image}
    </div>
  );
}
