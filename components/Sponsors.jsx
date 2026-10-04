"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import { mediaUrl } from "@/lib/media-url";

const SPEED = 90;
const CARDS_PER_HALF = 12;
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const sponsorMailto = (email) =>
  `mailto:${email}?subject=${encodeURIComponent("Sponsoring Stratosphere")}`;

function Logo({ sponsor }) {
  const src = mediaUrl(sponsor.logo);
  if (!src) {
    return (
      <span className="flex h-full w-full items-center justify-center rounded-xl bg-white p-4 text-center text-3xl sm:text-4xl font-bold tracking-[0.04em] text-[#14202e]">
        {sponsor.name}
      </span>
    );
  }

  const external = /^https?:\/\//.test(src) && !(SUPABASE && src.startsWith(SUPABASE));

  return (
    <span className={`flex h-full w-full ${sponsor.plate ? "rounded-xl bg-white p-4 sm:p-6" : ""}`}>
      <span className="relative h-full w-full">
        <Image
          src={src}
          alt={sponsor.name}
          fill
          draggable={false}
          unoptimized={external}
          sizes="(max-width: 768px) 320px, (max-width: 1024px) 400px, 500px"
          className="object-contain p-0 md:p-2"
        />
      </span>
    </span>
  );
}

function Card({ sponsor, hidden }) {
  const box =
    "relative flex h-full w-full items-center justify-center";

  return (
    <li
      aria-hidden={hidden || undefined}
      className="relative flex shrink-0 items-center justify-center h-48 w-72 sm:h-64 sm:w-96 md:h-80 md:w-[480px]
        mx-6 sm:mx-10 p-6 sm:p-8 rounded-2xl border border-ink/10 bg-ink/[0.05] hover:bg-ink/[0.1] transition-colors
        [[data-theme=light]_&]:bg-white/60 [[data-theme=light]_&]:hover:bg-white/90
        [[data-theme=light]_&]:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_40px_-28px_rgba(15,23,42,0.3)]"
    >
      {sponsor.url ? (
        <a
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          tabIndex={hidden ? -1 : undefined}
          className={box}
        >
          <Logo sponsor={sponsor} />
        </a>
      ) : (
        <div className={box}>
          <Logo sponsor={sponsor} />
        </div>
      )}
    </li>
  );
}

function Marquee({ sponsors }) {
  const trackRef = useRef(null);

  const repeat = Math.ceil(CARDS_PER_HALF / sponsors.length);
  const half = Array.from({ length: repeat }, () => sponsors).flat();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let x = 0;
    let onScreen = false;
    let drag = null;
    let dragged = false;

    const wrap = (value) => {
      const w = track.scrollWidth / 2;
      if (!w) return value;
      return -((((-value) % w) + w) % w);
    };

    const paint = () => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (drag || !onScreen || document.hidden || motion.matches) return;
      x = wrap(x - (SPEED * dt) / 1000);
      paint();
    };

    const onPointerDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = { id: e.pointerId, start: e.clientX, from: x };
      dragged = false;
    };

    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.start;
      if (!dragged) {
        if (Math.abs(dx) < 6) return;
        dragged = true;
        track.setPointerCapture(e.pointerId);
      }
      x = wrap(drag.from + dx);
      paint();
    };

    const onPointerUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
    };

    const onClick = (e) => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });

    io.observe(track);
    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("click", onClick, true);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
      track.removeEventListener("click", onClick, true);
    };
  }, [sponsors.length]);

  return (
    <div
      role="region"
      aria-label="Sponsors"
      className="overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]"
    >
      <div
        ref={trackRef}
        className="flex w-max cursor-grab active:cursor-grabbing touch-pan-y select-none will-change-transform"
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 w-max" aria-hidden={copy === 1 || undefined}>
            {half.map((sponsor, i) => (
              <Card
                key={`${copy}-${i}`}
                sponsor={sponsor}
                hidden={copy === 1 || i >= sponsors.length}
              />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Sponsors({ sponsors = [], email = "" }) {
  const listed = sponsors.filter((s) => s?.name || s?.logo);

  if (listed.length > 0) {
    return (
      <section id="sponsors" className="py-24 md:py-28 scroll-mt-28">
        <div className="px-6 max-w-6xl mx-auto">
          <SectionHeader
            title="Our Sponsors"
          />
        </div>
        <Reveal>
          <Marquee sponsors={listed} />
        </Reveal>
      </section>
    );
  }

  return (
    <section id="sponsors" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Sponsor Stratosphere"
        blurb="Everything the club builds, from depron gliders to the CanSat, runs on student time and outside support."
      />
      <Reveal className="glass rounded-3xl p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold text-ink tracking-[-0.02em]">Partner with us</h3>
          <p className="text-ink/60 mt-3 max-w-xl leading-relaxed">
            Sponsors are featured right here, on every page of this site. Write to the club and we will get back
            to you.
          </p>
        </div>
        {email && (
          <a
            href={sponsorMailto(email)}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-aurora2/40 bg-aurora2/10
              px-6 py-3 text-sm font-semibold text-aurora2 transition hover:bg-aurora2/20"
          >
            Become a sponsor
          </a>
        )}
      </Reveal>
    </section>
  );
}
