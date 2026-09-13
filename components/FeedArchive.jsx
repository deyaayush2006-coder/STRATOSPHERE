"use client";

import { useState } from "react";
import Reveal from "./Reveal";

/* The fold under a dated list, holding everything the visible count pushed off
 * the page.
 *
 * Announcements and achievements both have one and they behave identically, so
 * the behaviour is here and only the row markup differs — which is what the
 * render function is for. Nothing in here knows what it is listing.
 *
 * The list stays mounted and is hidden with the `hidden` attribute rather than
 * being unmounted, so the archive is in the page source for anything reading
 * it without running scripts.
 */
export default function FeedArchive({
  id,
  label,
  items = [],
  noun = "entry",
  nounPlural = "entries",
  children,
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  const count = items.length;

  return (
    <Reveal className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="group w-full glass rounded-3xl px-6 md:px-10 py-5 flex items-center justify-between gap-4 text-left hover:border-aurora2/30 transition-colors duration-200"
      >
        <span>
          <span className="block text-ink text-base font-semibold tracking-[-0.01em]">{label}</span>
          <span className="block text-sm text-ink/45 mt-1">
            {count} {count === 1 ? noun : nounPlural} kept on record, oldest still readable.
          </span>
        </span>

        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2 border border-aurora2/30 rounded-full px-3 py-1.5">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <div id={id} hidden={!open} className="glass rounded-3xl px-6 md:px-10 py-2 mt-3">
        <ul className="divide-y divide-ink/[0.07]">{items.map(children)}</ul>
      </div>
    </Reveal>
  );
}
