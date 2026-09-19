import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";

/* The front page's first screen.
 *
 * One cell of a grid, with everything in it: the photograph, the scrims that
 * make type legible on top of it, and the type. They are all at col-start-1
 * row-start-1, so they occupy the same box and cannot come apart at any size —
 * there is nowhere else for them to go. Document order is the stacking order,
 * so none of it needs a z-index.
 *
 * That is worth stating because of what it replaces. The picture used to be a
 * fixed layer behind the whole site with this header left empty to reserve
 * room for it, and the reservation was arithmetic: the band worked out where
 * the image would end from the viewport width and held itself open that far.
 * The two were measured in different units, so they disagreed at almost every
 * size, and the heading below slid onto the photo or a screen clear of it.
 *
 * The height is the one number here, and it is a screen: 100svh less the nav
 * card and the 2px under it. svh rather than vh because vh on a phone means
 * the viewport with the browser's own chrome hidden, which it is not at rest —
 * the hero would be taller than the screen by the height of the address bar.
 *
 * The club reel is no longer here. It plays once as the loading screen, which
 * is what Intro is.
 */

export default function Hero({ backdrop }) {
  const still = mediaUrl(backdrop);

  return (
    /* The 5.25rem is the nav card's flow height (4rem of content and its two
       hairlines) plus the 18px above — sticky top-4 and the 2px gap. Written
       out rather than composed from a constant on purpose: Tailwind reads this
       file as text, so a class built from a variable is a class it never sees
       and never generates. */
    <header
      id="overview"
      className="relative isolate grid overflow-hidden scroll-mt-28 mt-[calc(1rem+2px)]
        min-h-[calc(100svh-5.25rem)]"
    >
      {/* fill — absolute, inset-0 — and pushed behind with -z-10, which the
          `isolate` above keeps inside this header.

          Both halves of that are load-bearing, and each was a bug on the way
          here. As a grid cell with h-full it sized the row from its own ratio
          instead of the screen, and the hero came out 353px too tall on an
          ultrawide. As a positioned element at the default z-index it painted
          over every static sibling that followed it, whatever the grid said,
          and the whole hero rendered as a bare photograph. Out of the flow so
          it cannot drive the height, and behind so it cannot cover the type.

          It is the largest image on the page and the first thing painted, so
          it is asked for at the width of the viewport and fetched eagerly.
          Decorative: the h1 below carries the meaning. */}
      {still && (
        <Image
          src={still}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
      )}

      {/* Two scrims, not one. White text over a photograph is unreadable
          wherever the photograph goes light, and this one has a bright field
          and pale buildings exactly where the type sits. The first darkens the
          foot of the frame, the second the left edge the type is set against.
          Both are built from `base`, the theme's own surface, so they darken in
          the dark theme and lighten in the light one — the type is `ink` and
          flips with them, and neither ends up on its own colour. */}
      <div
        className="col-start-1 row-start-1 bg-gradient-to-t from-base via-base/55 to-transparent"
        aria-hidden="true"
      />
      <div
        className="col-start-1 row-start-1 bg-gradient-to-r from-base/85 via-base/25 to-transparent"
        aria-hidden="true"
      />

      {/* justify-end pins the type to the foot of the picture, which is where
          the scrim is heaviest. */}
      <div className="col-start-1 row-start-1 flex flex-col justify-end px-6 pb-14 md:px-10 md:pb-20">
        {/* The accent flips with the theme, which is the one thing it has to
            do. aurora2 is a bright cyan: right on the dark surface, and about
            1.6:1 against the pale one, which fails at any size — a headline
            this large is the last place to leave that. The light value is the
            deep blue the club already uses, at roughly 8:1. */}
        <div className="hero-title flex flex-col border-l-[4px] border-x-[#0D4C72] dark:border-x-[#309ece] w-[330px] md:w-[500px] text-left pr-2 absolute top-[40vh] left-[5%] font-semibold font-Josefin gap-y-4">
          <div className="pl-[15px] text-4xl md:text-5xl text-black dark:text-white">
            <span class="font-display text-[35px] sm:text-[47px] hover:text-aurora2 font-bold uppercase leading-none tracking-[0.01em] text-ink">
              Strat
              <span class="relative inline-block">
                O
                <span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 h-[0.4em] w-[1.45em] -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] rounded-[50%] border border-ink/75">
                </span>
              </span>
              sphere
            </span>
          </div>
          <div className="pl-[15px] text-4xl md:text-5xl text-[#0D4C72] dark:text-[#38BDF8]">
            <span className=" inline-block w-fit max-w-full hidden sm:block min-w-0 leading-[1.15]">
              <span className="hover:text-aurora2 block truncate text-[27px] font-bold uppercase tracking-[0.03em] text-ink">
                Aerospace Club
              </span>
              <span class="block truncate text-[27px] hover:text-aurora2 text-ink/85">
                Jadavpur University
              </span>
            </span>
          </div>
        </div>

        {/* Two of them, and no more: one for someone who wants to see the work,
            one for someone who wants in. A row of five would mean the page had
            not decided what it wanted from a visitor. */}
      </div>

      {/* There is a screen of page under this one and nothing else says so.
          Hidden on short screens, where it would sit on the buttons. */}
      <div
        className="col-start-1 row-start-1 hidden self-end justify-self-center pb-6 md:flex md:flex-col md:items-center md:gap-2"
        aria-hidden="true"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40">Scroll</span>
        <span className="h-8 w-px bg-gradient-to-b from-ink/35 to-transparent" />
      </div>
    </header>
  );
}
