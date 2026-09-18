"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { mediaUrl } from "@/lib/media-url";

/* The band at the top of the front page, and the club reel that fills it.
 *
 * The reel used to be a layer of SiteBackground: fixed to the viewport, drawn
 * behind the whole site, with this header left empty to reserve room for it.
 * Nothing connected the two but arithmetic — the band worked out where the
 * footage would end from the viewport width and held itself open that far.
 * Any disagreement between the sum and the footage showed up as the first
 * section landing in the middle of the reel or a screen below it, and the two
 * were measured in different units, so they disagreed at almost every size.
 *
 * The reel is in here now, in the flow, and the band is whatever the footage
 * is. There is no sum to get wrong: Announcements starts under the video
 * because it is the next thing in the document, not because a calculation
 * predicted where to put it.
 *
 * What that costs is the parallax. The backdrop is still fixed and the page
 * still scrolls over it, but the reel goes up with this header now rather than
 * staying put behind the sections below.
 *
 * It is rendered by the home page rather than by the layout, because the reel
 * only belongs there. A project page opens on its breadcrumb instead, with no
 * empty screen in front of it.
 */

/* display:none hides a video without stopping it — it keeps decoding frames
   and draining the battery, which is the opposite of what the preference is
   asking for. Hiding it is not an option here either: the reel is what gives
   this header its height, so it stays and is paused instead, which leaves the
   poster frame on screen. That is the same still a reduced-motion reader used
   to get from the backdrop. */
function useHaltWhenStill(ref, enabled) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return undefined;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (mq.matches) node.pause();
      // Rejects when the browser blocks autoplay, which is not an error worth
      // surfacing: the poster is already showing underneath.
      else node.play().catch(() => {});
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [ref, enabled]);
}

/* The shape of the box, and the only two things about it worth tuning.
 *
 * aspect-[53/30] is the footage's own ratio (848x480), so object-cover has
 * nothing to crop at most sizes and can never distort: the box and the frame
 * agree on shape.
 *
 * max-h is the exception, and it is here rather than in the band because it is
 * a fact about the footage, not about the layout. A 53/30 box at the width of
 * a wide window is taller than the window is — at 1440x900 it wants 815px of
 * 900, and on an ultrawide it wants more than the screen has. Left alone it
 * pushes the heading under it clean off the bottom of the screen. Capped, the
 * box stops at the cap and object-cover crops the frame to fit rather than
 * squashing it. The 10rem is the heading that has to follow: the section's own
 * top padding and a line of title, kept on screen down to a phone held
 * sideways.
 *
 * The mask dissolves the last quarter so the footage ends in the page rather
 * than on a hard edge. It is a percentage of the box, and the box is now
 * always a box that fits, so one value covers every screen. */
const REEL = `pt-6 md:pt-5.5 col-start-1 row-start-1 w-full aspect-[53/30] max-h-[calc(120vh-7rem)] object-cover object-center
  [-webkit-mask-image:linear-gradient(to_bottom,#000_76%,transparent)]
  [mask-image:linear-gradient(to_bottom,#000_100%,transparent)]`;

export default function Hero({ video, backdrop }) {
  const reelRef = useRef(null);

  const reel = mediaUrl(video);
  const still = mediaUrl(backdrop);

  useHaltWhenStill(reelRef, Boolean(reel));

  return (
    /* grid, and every child in the one cell at col-start-1 row-start-1. The
       reel is what has a size, so it is what the cell is; the bloom is painted
       over the same ground and cannot drift away from it. Document order is
       the stacking order, so no z-index is needed between them. */
    <header
      id="overview"
      className={`relative isolate grid scroll-mt-28 ${reel || still ? "" : "min-h-[38vh]"}`}
    >
      {reel ? (
        <video
          ref={reelRef}
          src={reel}
          poster={still || undefined}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="auto"
          style={{ opacity: "var(--backdrop-opacity)" }}
          className={REEL}
        />
      ) : (
        /* Nothing is set as the reel, so the backdrop photo stands in. It is
           the largest image on the page and it is above the fold, so it is
           asked for at the width of the viewport and fetched eagerly. */
        still && (
          <Image
            src={still}
            alt=""
            width={848}
            height={480}
            priority
            sizes="100vw"
            style={{ opacity: "var(--backdrop-opacity)" }}
            className={REEL}
          />
        )
      )}

      <div
        className="col-start-1 row-start-1 -z-10 self-end h-[60%] w-full bg-[radial-gradient(70%_100%_at_30%_100%,rgba(29,96,175,0.28),transparent_70%)]"
        aria-hidden="true"
      />
    </header>
  );
}
