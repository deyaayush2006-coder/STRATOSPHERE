"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);

  // Trigger positions are measured once; re-measure when the page height
  // changes (an archive opening, images settling) so they don't drift.
  let timer = 0;
  let height = 0;
  new ResizeObserver(() => {
    const next = document.body.scrollHeight;
    if (next === height) return;
    height = next;
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 200);
  }).observe(document.body);
}

// Resolves once the intro loader has gone, so entrances are not played under it.
// RouteLoader marks <html data-intro="pending"> while the loader is on screen.
export function afterIntro(callback) {
  const root = document.documentElement;
  let observer = null;
  let frame = requestAnimationFrame(() => {
    frame = 0;
    if (root.dataset.intro !== "pending") {
      callback();
      return;
    }
    observer = new MutationObserver(() => {
      if (root.dataset.intro === "pending") return;
      observer.disconnect();
      observer = null;
      callback();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
  });

  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect();
  };
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
