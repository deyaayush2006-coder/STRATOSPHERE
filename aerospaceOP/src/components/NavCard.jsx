import React, { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useContent } from "../content/ContentProvider";
import { mediaUrl } from "../lib/api";

export default function NavCard({ currentPath = "" }) {
  const NAV_LINKS = useContent("navLinks") ?? [];
  const site = useContent("site") ?? {};

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // w-fit so the hover only lights up the label, not the whole row
  const itemClass =
    "inline-block w-fit max-w-full text-left font-display text-lg font-semibold tracking-[-0.01em] py-2 text-ink/90 origin-left transition duration-150 ease-out hover:scale-[1.12] hover:text-aurora2";

  return (
    <div
      className={`sticky top-4 z-40 mx-4 rounded-2xl glass-matte ${open ? "is-matte" : ""}`}
    >
      <div className="flex items-center gap-4 px-5 py-3.5">
        <a href="/#overview" className="flex flex-1 items-center gap-2.5 min-w-0">
          <img
            src={mediaUrl(site.logo) || "/1674144810258.jpg"}
            alt=""
            width="200"
            height="200"
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
        <div className="border-t border-ink/10 px-5 py-4">
          <ul className="space-y-1">
            {NAV_LINKS.map((item, i) => (
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