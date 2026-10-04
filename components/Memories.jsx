"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import { mediaUrl } from "@/lib/media-url";

const HOLD = 5000;

const pad = (n) => String(n).padStart(2, "0");

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

// One large frame that crossfades between photos, a counter and arrows on the
// frame, and a thumbnail strip underneath. It advances on its own while on
// screen, and stops once someone picks a photo or hovers the frame. Only the
// current photo and its neighbours are mounted, so the rest load on demand.
export default function Memories({ memories = [] }) {
  const photos = memories.filter((m) => m?.src);
  const count = photos.length;

  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const frameRef = useRef(null);
  const stripRef = useRef(null);
  const touchX = useRef(0);

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const pick = (i) => {
    setHeld(true);
    go(i);
  };

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (held || !onScreen || count < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = setTimeout(() => go(index + 1), HOLD);
    return () => clearTimeout(timer);
  }, [index, held, onScreen, count, go]);

  // Keep the active thumbnail in view without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector(`[data-thumb="${index}"]`);
    if (!strip || !thumb) return;
    strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
  }, [index]);

  if (!count) return null;

  const near = (i) => i === index || i === (index + 1) % count || i === (index - 1 + count) % count;
  const current = photos[index];

  return (
    <section id="memories" aria-labelledby="memories-heading" className="px-6 py-24 md:py-28 scroll-mt-28">
      <div className="relative mx-auto max-w-6xl">
        <div class="px-6 max-w-6xl mx-auto">
          <div class="transition-[opacity,transform] duration-700 ease-out opacity-100 translate-y-0 mb-14 text-center ">
            <h2 class="uppercase font-bold text-3xl md:text-4xl lg:text-5xl text-ink tracking-[0.05em] leading-[1.05] w-fit max-w-full mx-auto">
              <span class="">Club Memories</span>
            </h2>
            <div class="rule-sweep mt-8" aria-hidden="true">
            </div>
          </div>
        </div>

        <Reveal>
          <div
            ref={frameRef}
            onMouseEnter={() => setHeld(true)}
            onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchX.current;
              if (Math.abs(dx) > 50) pick(index + (dx < 0 ? 1 : -1));
            }}
            className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#0b1220]
              shadow-[0_28px_80px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.12)]
              [[data-theme=light]_&]:border-white/60 [[data-theme=light]_&]:shadow-[0_28px_80px_rgba(15,23,42,.25),inset_0_1px_0_rgba(255,255,255,.18)]"
          >
            <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
              {photos.map((photo, i) =>
                near(i) ? (
                  <div
                    key={photo.src}
                    aria-hidden={i !== index}
                    className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === index ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    <Image
                      src={mediaUrl(photo.src)}
                      alt={photo.caption || `Club memory ${i + 1}`}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1152px) 100vw, 1152px"
                      className="object-cover"
                    />
                  </div>
                ) : null
              )}
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/85 via-transparent to-transparent" />
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-8">
              <div className="min-w-0" aria-live="polite">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/70">
                  {pad(index + 1)} / {pad(count)}
                  {current.event && <span className="ml-3 text-[#67e8f9]">{current.event}</span>}
                </p>
                {current.caption && (
                  <p className="mt-2 truncate text-base font-semibold text-white sm:text-lg">{current.caption}</p>
                )}
              </div>
              {count > 1 && (
                <div className="flex shrink-0 items-center gap-2">
                  {[
                    ["left", "Previous photo", -1],
                    ["right", "Next photo", 1],
                  ].map(([dir, label, by]) => (
                    <button
                      key={dir}
                      type="button"
                      aria-label={label}
                      onClick={() => pick(index + by)}
                      className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-white
                        backdrop-blur-xl transition hover:border-[#22d3ee] hover:bg-[#22d3ee] hover:text-[#04121a]"
                    >
                      <Chevron dir={dir} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {count > 1 && (
            <div
              ref={stripRef}
              role="tablist"
              aria-label="Gallery thumbnails"
              className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((photo, i) => (
                <button
                  key={photo.src}
                  type="button"
                  role="tab"
                  data-thumb={i}
                  aria-selected={i === index}
                  aria-label={`Show photo ${i + 1}`}
                  onClick={() => pick(i)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition ${i === index ? "border-aurora2 ring-2 ring-aurora2/35" : "border-ink/10 opacity-70 hover:opacity-100"
                    }`}
                >
                  <Image src={mediaUrl(photo.src)} alt="" fill sizes="96px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
