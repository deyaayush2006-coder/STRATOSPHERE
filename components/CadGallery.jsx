"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/media-url";

/* Drawings, renders and screenshots off the CAD.
 *
 * A grid of thumbnails that open full size. The thumbnails are deliberately
 * small requests — a CAD render is a large flat image and there is no reason
 * to send the full one until somebody asks for it, which is the whole reason
 * the viewer below exists rather than just linking the files.
 */

function Tile({ shot, onOpen, index }) {
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(shot.src);

  if (!src || failed) return null;

  return (
    <figure className="m-0">
      <button
        type="button"
        onClick={() => onOpen(index)}
        className="group relative block w-full overflow-hidden rounded-2xl bg-panel ring-1 ring-ink/10 hover:ring-aurora2/40 transition duration-200"
      >
        <Image
          src={src}
          alt={shot.caption || "CAD drawing"}
          width={800}
          height={600}
          onError={() => setFailed(true)}
          /* Two up on a phone, three on a desktop inside a 6xl column — so the
             largest a thumbnail is ever painted is about 380px, and that is
             what gets requested rather than the 4000px render behind it. */
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px"
          className="h-full w-full aspect-[4/3] object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute inset-0 bg-base/0 group-hover:bg-base/10 transition-colors" />
      </button>

      {shot.caption && (
        <figcaption className="text-xs text-ink/50 mt-2 leading-snug">{shot.caption}</figcaption>
      )}
    </figure>
  );
}

/* Full size, over the page. Same shape as the committee dialog on the members
   section: a flat scrim, one panel, escape and a click outside both close it. */
function Lightbox({ shots, index, onClose, onStep }) {
  const closeRef = useRef(null);
  const shot = shots[index];

  useEffect(() => {
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };

    /* Hold the page still underneath and pay back the scrollbar width, or
       everything behind the overlay shifts sideways as it opens. */
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [onClose, onStep]);

  if (!shot) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base/92 p-4 sm:p-8 animate-veil-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={shot.caption || "CAD drawing"}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full ring-1 ring-ink/20 text-ink/70 hover:text-ink hover:ring-aurora2/40 transition"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          ×
        </span>
        <span className="sr-only">Close</span>
      </button>

      <div className="relative max-h-[80vh] w-full max-w-5xl">
        <Image
          key={shot.src}
          src={mediaUrl(shot.src)}
          alt={shot.caption || "CAD drawing"}
          width={1800}
          height={1350}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="h-auto max-h-[80vh] w-full object-contain"
        />
      </div>

      <div className="mt-4 flex items-center gap-6">
        {shots.length > 1 && (
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50 hover:text-aurora2 transition-colors"
          >
            ← Prev
          </button>
        )}
        <p className="text-sm text-ink/60 text-center m-0 max-w-xl">
          {shot.caption}
          <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/30 mt-1">
            {index + 1} / {shots.length}
          </span>
        </p>
        {shots.length > 1 && (
          <button
            type="button"
            onClick={() => onStep(1)}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50 hover:text-aurora2 transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

export default function CadGallery({ shots = [], title = "CAD & drawings" }) {
  const [open, setOpen] = useState(null);

  const usable = shots.filter((s) => s?.src);

  // Wraps at both ends, so arrowing through never dead-ends on the last one.
  const step = useCallback(
    (by) => setOpen((i) => (i == null ? i : (i + by + usable.length) % usable.length)),
    [usable.length]
  );

  if (usable.length === 0) return null;

  return (
    <section className="mt-12">
      <span className="mono-label">{title}</span>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {usable.map((shot, i) => (
          <Tile key={`${shot.src}-${i}`} shot={shot} index={i} onOpen={setOpen} />
        ))}
      </div>

      {open != null && (
        <Lightbox shots={usable} index={open} onClose={() => setOpen(null)} onStep={step} />
      )}
    </section>
  );
}
