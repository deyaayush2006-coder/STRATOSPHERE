"use client";

import { useState } from "react";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { mediaUrl } from "@/lib/media-url";

export default function NavCard({ navLinks = [], site = {} }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // w-fit so the hover only lights up the label, not the whole row
  const itemClass =
    "inline-block w-fit max-w-full text-left font-display text-lg font-semibold tracking-[-0.01em] py-2 text-ink/90 origin-left transition duration-150 ease-out hover:scale-[1.12] hover:text-aurora2";

  /* The menu hangs under the card rather than inside it, so opening it lays a
     pane over the hero instead of growing the card and pushing the page down.
   *
   * A sibling of the card, not a child: the card blurs what is behind it when
   * open, and a blur nested in another blur only samples that one's contents,
   * so the menu would have frosted the card and nothing of the hero. */
  return (
    <div className="sticky top-4 z-40 mx-4">
      {/* Tapping anywhere off the menu closes it. Not a real control — the
          Close button is that — so it stays out of the tab order and the
          accessibility tree. */}
      {open && (
        <div
          aria-hidden="true"
          className="fixed inset-0"
          onClick={() => {
            setOpen(false);
            setExpanded(null);
          }}
        />
      )}

      <div
        className={`relative flex items-center gap-4 px-5 py-3.5 rounded-2xl glass-matte ${open ? "is-matte" : ""}`}
      >
        {/* A plain anchor, not next/link: every target is a hash on the home
            page, and the browser handles those without a client-side nav. */}
        <a href="/#overview" className="flex flex-1 items-center gap-2.5 min-w-0">
          {/* Asked for at the 36px it is drawn at, not at the 200px the source
              happens to be. It is on every page and above the fold on all of
              them, so it is fetched eagerly rather than lazily. */}
          <Image
            src={mediaUrl(site.logo) || "/1674144810258.jpg"}
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-ink/20 transition-transform duration-300 ease-out hover:scale-110"
          />

          <span className="font-display text-[15px] sm:text-[17px] hover:text-aurora2 font-bold uppercase leading-none tracking-[0.01em] text-ink">
            Strat
            {/* the orbit ring around the O */}
            <span className="relative inline-block">
              O
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 h-[0.4em] w-[1.45em] -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] rounded-[50%] border border-ink/75"
              />
            </span>
            sphere
          </span>

          <span className="hidden sm:block min-w-0 leading-[1.15]">
            <span className="hover:text-aurora2 block truncate text-[10px] font-bold uppercase tracking-[0.03em] text-ink">
              Aerospace Club
            </span>
            <span className="block truncate text-[10px] hover:text-aurora2 text-ink/85">Jadavpur University</span>
          </span>
        </a>
        <ThemeToggle className="mr-1" />

        <button
          className="flex items-center gap-2.5 text-sm text-ink/90 hover:text-aurora2 transition  w-fit max-w-full"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
          <span className="grid font-display text-[15px] font-bold grid-cols-2 gap-[3px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <i key={i} className="w-[5px] h-[5px] bg-current block rounded-[1px]" />
            ))}
          </span>
        </button>
      </div>

      {open && (
        <div
          className="absolute inset-x-0 top-full mt-2 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-2xl
            border border-white/10 bg-panel/25 px-5 py-4 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]
            backdrop-blur-xl backdrop-saturate-150"
        >
          <ul className="space-y-1">
            {navLinks.map((item, i) => (
              <li key={item.label} className="animate-fade-up" style={{ animationDelay: `${i * 20}ms` }}>
                {item.children ? (
                  <button
                    className={itemClass}
                    aria-expanded={expanded === i}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <a className={itemClass} href={item.href} onClick={() => setOpen(false)}>
                    {item.label}
                  </a>
                )}
                {item.children && expanded === i && (
                  <ul className="pl-4 mt-1 space-y-1 border-l border-ink/10">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <a
                          className="text-sm text-ink/60 hover:text-ink py-1.5 block transition"
                          href={child.href}
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
