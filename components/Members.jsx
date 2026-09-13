"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";
import Plane from "./Plane";
import { mediaUrl } from "@/lib/media-url";

/* The Team, as a route rather than a list.
 *
 * One flight path runs down the middle of the section. The years are the only
 * labels on it, and the aircraft flies from one to the next as the page
 * scrolls, finishing at Present at the foot of the line. Nobody's name is on
 * the page until a year is asked for: clicking one opens that committee.
 *
 * Three ideas hold the geometry together:
 *
 *   The stations are placed first, by fraction, and the curve is drawn through
 *   them. That is the opposite of the obvious way round, and it is what puts a
 *   year exactly on the line rather than near it — at every width, with no
 *   second measurement to keep in step.
 *
 *   Nothing lives inside the track. Its height comes from the number of
 *   committees and nothing else, so opening a committee cannot reshape the
 *   path it was opened from. That is why the names arrive in a dialog over the
 *   section instead of a panel inside it.
 *
 *   The viewBox is measured in real pixels rather than normalised. It costs a
 *   ResizeObserver, and it buys a curve that is never stretched, a stroke that
 *   is never oval, and a heading for the aircraft that is simply the tangent —
 *   no aspect correction anywhere.
 */

/* Where things sit, as fractions of the track.
   x alternates so the line has to bend to reach each year. y runs the stations
   down the upper three quarters and leaves the rest as the run-in to Present,
   which is the one point on the line that is dead centre. */
const LEFT_X = 0.24;
const RIGHT_X = 0.76;
const FIRST_Y = 0.07;
const LAST_Y = 0.74;
const END_Y = 0.93;

const stationX = (i) => (i % 2 === 0 ? LEFT_X : RIGHT_X);
const stationY = (i, n) =>
  n > 1 ? FIRST_Y + (i / (n - 1)) * (LAST_Y - FIRST_Y) : (FIRST_Y + LAST_Y) / 2;

/* How much of the viewport height the aircraft flies at. */
const FOCUS = 0.45;

// Near enough to the end of the line to call it landed.
const ARRIVED_AT = 0.965;

/* The contrail, as layers behind the aircraft.
   Every layer is the same curve with a different length of it showing, and
   `span` is that length as a multiple of the distance between two years. They
   stack into one streak: a hot short core at the nose, a longer dimmer body
   behind it, and a wide soft bloom around both. A single stroke cannot fade
   along its own length, and four that can be told apart is cheaper than the
   gradient that could. */
const CONTRAIL = [
  { span: 0.32, width: 13, opacity: 0.1 },
  { span: 0.72, width: 3, opacity: 0.16 },
  { span: 0.34, width: 3, opacity: 0.45 },
  { span: 0.13, width: 3.5, opacity: 1 },
];

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const round = (v) => Math.round(v * 100) / 100;

/* "2022–23" reads as "2022" at this size, and reads better.
   Anything without a four-digit year in it is left exactly as written. */
const shortYear = (year) => String(year ?? "").match(/\d{4}/)?.[0] ?? String(year ?? "");

/* The line, drawn through the years and down into Present.
 *
 * Every bend is a cubic with vertical handles, which is what makes the joins
 * smooth instead of cornered, and keeps y increasing the whole way down — the
 * property the station search below depends on.
 *
 * It enters on the side the *second* year is on, so the first bend has the
 * same swing as every bend after it, and finishes at the centre, because that
 * is where the aircraft has to end up. */
function buildPath({ w, h }, n) {
  const points = [
    [n > 1 ? stationX(1) * w : w / 2, 0],
    ...Array.from({ length: n }, (_, i) => [stationX(i) * w, stationY(i, n) * h]),
    [w / 2, END_Y * h],
  ];

  let d = `M ${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    // past the midpoint on both sides, which rounds the lobe out
    const k = (y1 - y0) * 0.55;
    d +=
      ` C ${round(x0)} ${round(y0 + k)},` +
      ` ${round(x1)} ${round(y1 - k)},` +
      ` ${round(x1)} ${round(y1)}`;
  }
  return d;
}

/* How far along the line a year is.
   Binary search on y, which is only valid because the curve above never turns
   back upwards. Twenty-two halvings put it well inside a pixel. */
function lengthAtY(path, total, targetY) {
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 22; i += 1) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).y < targetY) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// --------------------------------------------------------------- member card

// Drive throttles hotlinked portraits, so fall back to initials.
function Avatar({ member }) {
  const [failed, setFailed] = useState(false);

  const initials = member.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  if (failed || !member.image) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink/5 ring-1 ring-ink/15 font-mono text-xs text-ink/50">
        {initials}
      </span>
    );
  }

  return (
    <img
      src={mediaUrl(member.image)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-ink/15 bg-panel"
    />
  );
}

function MemberCard({ member }) {
  return (
    <div className="group relative h-full glass rounded-2xl p-4 flex items-center gap-3.5 overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition duration-200">
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-200"
        aria-hidden="true"
      />

      <Avatar member={member} />

      <div className="min-w-0">
        <h3 className="text-ink text-[14px] font-semibold tracking-[-0.01em] truncate">
          {member.name}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-aurora2 mt-1">
          {member.role}
        </p>
        {member.dept && <p className="text-[11px] text-ink/45 mt-1 truncate">{member.dept}</p>}

        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] text-ink/50 hover:text-ink transition-colors mt-1.5"
          >
            LinkedIn ↗
          </a>
        )}
        {!member.linkedin && member.email && (
          <a
            href={`mailto:${member.email}`}
            className="block text-[11px] text-ink/50 hover:text-ink transition-colors mt-1.5 truncate"
          >
            {member.email}
          </a>
        )}
      </div>
    </div>
  );
}

function CohortHeading({ cohort, className = "" }) {
  return (
    <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-2 ${className}`}>
      <h3 className="text-2xl md:text-3xl text-ink font-semibold tracking-[-0.02em]">
        {cohort.year}
      </h3>
      {cohort.tag && (
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 rounded-full ring-1 ${
            cohort.current
              ? "text-aurora2 ring-aurora2/40 bg-aurora2/10"
              : "text-ink/45 ring-ink/15"
          }`}
        >
          {cohort.tag}
        </span>
      )}
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
        {cohort.members?.length ?? 0} members
      </span>
      {cohort.blurb && <p className="text-sm text-ink/50 basis-full">{cohort.blurb}</p>}
    </div>
  );
}

function CohortGrid({ cohort, stagger = true }) {
  const members = cohort.members ?? [];

  if (members.length === 0) {
    return <p className="text-sm text-ink/45">No one is listed for this year yet.</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {members.map((m, i) => (
        <div
          key={`${m.name}-${m.role}`}
          className={stagger ? "h-full animate-card-in" : "h-full"}
          /* Capped hard, and short. The stagger is there to stop sixteen cards
             landing as one slab, not to be watched: the last one is in place
             about a third of a second after the click, which is the point at
             which a list stops feeling like it is still loading. */
          style={stagger ? { animationDelay: `${Math.min(i, 8) * 18}ms` } : undefined}
        >
          <MemberCard member={m} />
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------- dialog

/* The committee, over the section rather than inside it.
 *
 * A panel in the flow would have to push the line around to make room, and the
 * line is the thing being clicked — so the names come over the top instead and
 * the route underneath never moves.
 */
function CommitteeDialog({ cohort, onClose }) {
  const closeRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      /* Keep Tab inside the dialog. Without this the next Tab lands on the
         year buttons behind it, which are still there and still look focusable
         to anyone driving this from the keyboard. */
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    /* Hold the page still underneath, and pay back the width the scrollbar was
       taking, or everything behind the dialog jumps sideways as it opens. */
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
  }, [onClose]);

  return (
    /* A flat scrim and an opaque panel, and not one backdrop-filter between
       them. This opened as a blurred veil under a glass panel, which stacked
       three of them — the veil's, and the two the glass classes each bring —
       so every click paid for three full-screen backdrop passes before the
       dialog appeared. That was the lag. The panel is solid now, which needs
       no blur behind it to be readable anyway. */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-base/85 p-0 sm:p-6 animate-veil-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Committee of ${cohort.year}`}
        className="animate-panel-in bg-panel border border-ink/15 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)]
          w-full max-w-4xl max-h-[88svh] sm:max-h-[85svh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 pb-4 border-b border-ink/10">
          <CohortHeading cohort={cohort} />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 grid h-9 w-9 place-items-center rounded-full ring-1 ring-ink/15 text-ink/60 hover:text-ink hover:ring-aurora2/40 transition duration-150"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ×
            </span>
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="overflow-y-auto px-6 md:px-8 py-6">
          <CohortGrid cohort={cohort} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ station

/* A year on the route. Only the year — no marker, no ring, nothing else on the
   line. The type is the target, so it is set at display size. */
function Station({ cohort, index, count, active, onOpen, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onOpen(index)}
      aria-haspopup="dialog"
      title={`See the ${cohort.year} committee`}
      style={{ left: `${stationX(index) * 100}%`, top: `${stationY(index, count) * 100}%` }}
      /* Centred across the line but hung below it, rather than centred on it.
         Sitting on the point put the year in exactly the place the aircraft
         arrives, and the two cancelled each other out: a cyan aircraft over
         cyan digits inside one shared glow, at the single moment the arrival
         is meant to be legible. Below the point, the line threads over the top
         of the year and the aircraft lands in clear air. */
      className="group absolute -translate-x-1/2 translate-y-2 leading-none outline-none"
    >
      <span
        className={`block font-display font-bold tracking-[-0.04em] leading-none
          text-[clamp(2rem,8vw,3.5rem)] transition duration-200 ${
            active
              ? "text-aurora2 drop-shadow-[0_0_22px_rgba(34,211,238,0.55)] scale-105"
              : "text-ink/35 group-hover:text-ink/80"
          }`}
      >
        {shortYear(cohort.year)}
      </span>
    </button>
  );
}

// ------------------------------------------------------------------ section

export default function Members({ memberCohorts = [] }) {
  const cohorts = memberCohorts;
  const count = cohorts.length;

  const trackRef = useRef(null);
  const pathRef = useRef(null);
  const trailRefs = useRef([]);
  const craftRef = useRef(null);
  const stationRefs = useRef([]);
  const openedFrom = useRef(null);

  // Path lengths, kept off state: they change every scroll frame and must not
  // re-render anything when they do.
  const totalRef = useRef(0);
  const stopsRef = useRef([]);

  const [size, setSize] = useState(null);
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [flying, setFlying] = useState(false);
  const [open, setOpen] = useState(null);

  /* The flight is decoration over a control that works without it. Anyone who
     has asked for less motion gets the line drawn, the aircraft parked at
     Present, and the years doing the whole job. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => setFlying(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Real pixels, so nothing in the drawing is ever stretched. The track's
     height is set in CSS from the number of committees and its width by the
     column, so this fires on resize and on nothing else. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
      }
    };

    read();
    const obs = new ResizeObserver(read);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const d = size && count > 0 ? buildPath(size, count) : "";

  /* Put the aircraft, and its contrail, at a point along the line.
   *
   * The aircraft is one transform, so a scroll frame touches nothing the
   * browser has to lay out again. The heading is the tangent, read off two
   * nearby samples — no aspect correction needed, because the viewBox is in
   * pixels.
   *
   * The contrail is the same curve, shown through a moving window. Each layer
   * carries a dash exactly its own length followed by a gap the length of the
   * whole path, so only one dash can ever be on screen; sliding the offset to
   * `span - at` puts the far end of that dash at the aircraft. The layers are
   * different lengths, so together they read as a streak that is brightest at
   * the nose and gone a few hundred pixels back.
   *
   * This replaced a version that revealed the line from the very start, which
   * left a bright ribbon lying across every year it had already passed. What
   * it looked like was a route being highlighted; what it should look like is
   * something flying. */
  const place = useCallback(
    (at) => {
      const path = pathRef.current;
      const total = totalRef.current;
      if (!path || total <= 0) return;

      const craft = craftRef.current;
      if (craft) {
        const here = path.getPointAtLength(at);
        const back = path.getPointAtLength(Math.max(at - 6, 0));
        const ahead = path.getPointAtLength(Math.min(at + 6, total));
        const heading = (Math.atan2(ahead.y - back.y, ahead.x - back.x) * 180) / Math.PI;

        craft.style.transform =
          `translate3d(${here.x}px, ${here.y}px, 0) translate(-50%, -50%) rotate(${heading}deg)`;
      }

      /* Measured against the distance between two years, not against the whole
         path. Tie it to the whole and the trail grows every time a committee
         is added, until it is draped over several bends at once. */
      const leg = total / (count + 1);
      for (let i = 0; i < CONTRAIL.length; i += 1) {
        const el = trailRefs.current[i];
        if (!el) continue;
        const span = CONTRAIL[i].span * leg;
        el.style.strokeDasharray = `${span} ${total}`;
        el.style.strokeDashoffset = `${span - at}`;
      }
    },
    [count]
  );

  // Measure once per shape: the aircraft and its contrail both run off this.
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !d) return;

    const total = path.getTotalLength();
    totalRef.current = total;

    /* Where each year falls *along the line*, which is not where it falls down
       the track: the curve zig-zags, so it is half again as long as the box is
       tall. The aircraft is positioned by length, so the years it is compared
       against have to be measured the same way or it lights up the wrong one
       between every bend. */
    stopsRef.current = Array.from({ length: count }, (_, i) =>
      total > 0 ? lengthAtY(path, total, stationY(i, count) * size.h) / total : 0
    );

    // At the start of the line, where the trail has nothing behind it yet.
    place(0);
  }, [d, count, size, place]);

  // The scroll flight itself.
  useEffect(() => {
    if (!flying || !d || count === 0) return undefined;

    let frame = 0;

    const read = () => {
      frame = 0;
      const el = trackRef.current;
      const total = totalRef.current;
      if (!el || total <= 0) return;

      const rect = el.getBoundingClientRect();
      if (rect.height <= 0) return;

      /* Zero when the top of the track reaches the flight line, one when the
         bottom does. Everything below is a function of this one number. */
      const focus = window.innerHeight * FOCUS;
      const progress = clamp((focus - rect.top) / rect.height, 0, 1);

      place(total * progress);

      setArrived((prev) => {
        const now = progress >= ARRIVED_AT;
        return prev === now ? prev : now;
      });

      /* Past this point the scroll position is being read as a year, and it is
         only entitled to be one while the track still crosses the flight line.
         Off the line the reading is pinned at one end whatever the visitor
         does. */
      if (rect.top > focus || rect.bottom < focus) return;

      // whichever year the aircraft is nearest to right now
      const stops = stopsRef.current;
      let nearest = 0;
      let best = Infinity;
      for (let i = 0; i < stops.length; i += 1) {
        const gap = Math.abs(stops[i] - progress);
        if (gap < best) {
          best = gap;
          nearest = i;
        }
      }
      setActive((prev) => (prev === nearest ? prev : nearest));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [flying, d, count, place]);

  /* Parked. With the flight switched off there is no scroll reading to place
     the aircraft, so it sits at the end of the line with the route already
     drawn — the state the animation would have left it in anyway. */
  useEffect(() => {
    if (flying || !d) return;
    const total = totalRef.current;
    if (total <= 0) return;

    place(total);
    setArrived(true);
  }, [flying, d, place]);

  const openYear = useCallback((index) => {
    openedFrom.current = index;
    setOpen(index);
  }, []);

  /* Put the reader back on the year they opened, rather than at the top of the
     document, which is where focus goes when the dialog it was in disappears. */
  const closeYear = useCallback(() => {
    setOpen(null);
    const from = openedFrom.current;
    if (from != null) stationRefs.current[from]?.focus();
  }, []);

  if (count === 0) return null;

  return (
    <section id="members" className="scroll-mt-28 px-6 py-24 md:py-28">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title="The Team"
          blurb="Every committee since the club was founded, flown as one route. Keep scrolling and the aircraft works its way down the years to the present. Click onto any year to see who was running the club that season."
        />
      </div>

      {/* The route. Centred and given the width of the section, because it is
          the section now — nothing sits beside it. Its height is a function of
          the number of committees and nothing else, so opening a committee can
          never reshape the line it was opened from. */}
      <div
        ref={trackRef}
        style={{ "--rows": count + 1 }}
        className="relative mx-auto w-full max-w-[22rem] sm:max-w-[30rem] lg:max-w-[38rem]
          h-[calc(var(--rows)*7rem)] sm:h-[calc(var(--rows)*9.5rem)] lg:h-[calc(var(--rows)*11rem)]"
      >
        {size && (
          <svg
            viewBox={`0 0 ${size.w} ${size.h}`}
            width={size.w}
            height={size.h}
            fill="none"
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none overflow-visible"
          >
            <defs>
              <linearGradient id="members-route" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-aurora1)" />
                <stop offset="55%" stopColor="var(--color-aurora2)" />
                <stop offset="100%" stopColor="var(--color-aurora3)" />
              </linearGradient>
            </defs>

            {/* the route as planned: the whole way, faint */}
            <path
              ref={pathRef}
              d={d}
              stroke="currentColor"
              className="text-ink/15"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 8"
            />

            {/* The contrail: the same curve, each layer showing a different
                short length of it, all of them ending at the aircraft.
                Their dashes are set per layer rather than inherited from a
                group, because the whole effect is that the lengths differ.

                No drop-shadow anywhere in here. A filter over geometry that
                changes every frame has to be re-blurred every frame, and the
                bloom is a wide faint stroke instead, which is free. */}
            {CONTRAIL.map((layer, i) => (
              <path
                key={layer.span}
                ref={(node) => {
                  trailRefs.current[i] = node;
                }}
                d={d}
                stroke="url(#members-route)"
                strokeWidth={layer.width}
                strokeLinecap="round"
                opacity={layer.opacity}
              />
            ))}
          </svg>
        )}

        {cohorts.map((c, i) => (
          <Station
            key={c.year}
            cohort={c}
            index={i}
            count={count}
            active={i === active && !arrived}
            onOpen={openYear}
            buttonRef={(node) => {
              stationRefs.current[i] = node;
            }}
          />
        ))}

        {/* Where the line ends. The aircraft flies into this and goes out as it
            lands, so the last thing the route does is hand the word over. */}
        <div
          style={{ left: "50%", top: `${END_Y * 100}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
        >
          <span
            className={`block font-display font-bold tracking-[-0.04em] leading-none
              text-[clamp(2rem,8vw,3.5rem)] transition duration-300 ${
                arrived
                  ? "text-aurora2 drop-shadow-[0_0_30px_rgba(34,211,238,0.65)] scale-110"
                  : "text-ink/20 scale-100"
              }`}
          >
            Present
          </span>
        </div>

        {/* The aircraft. Placed by transform alone, from the line itself, so it
            rides the curve rather than approximating it. Opacity is left to
            the class, which is why the transform above can be set on its own
            every frame without the two fighting. */}
        <div
          ref={craftRef}
          aria-hidden="true"
          className={`absolute left-0 top-0 z-10 w-fit text-aurora2 will-change-transform
            transition-opacity duration-300 ${arrived ? "opacity-0" : "opacity-100"}`}
        >
          <span className="absolute -inset-7 rounded-full bg-aurora2/20 blur-2xl" />
          {/* The class is what sets the size; the attribute is only the value
              a browser would use before the stylesheet lands. Sized down a
              little on a phone, where the track is a third of the width and
              the years it flies between are half the size. */}
          <Plane
            size={68}
            className="relative w-14 h-14 sm:w-[4.25rem] sm:h-[4.25rem] animate-craft-bob drop-shadow-[0_0_16px_rgba(34,211,238,0.7)]"
          />
        </div>
      </div>

      {open != null && cohorts[open] && (
        <CommitteeDialog cohort={cohorts[open]} onClose={closeYear} />
      )}

      {/* Every committee, in the page for anything that is not running the
          flight — a search engine, a reader, a browser with scripts off. The
          dialog is the same content for everyone else, and it needs a click
          that cannot happen here. */}
      <noscript>
        <div className="max-w-6xl mx-auto mt-16 space-y-14">
          {cohorts.map((c) => (
            <div key={c.year}>
              <CohortHeading cohort={c} className="mb-5" />
              <CohortGrid cohort={c} stagger={false} />
            </div>
          ))}
        </div>
      </noscript>
    </section>
  );
}
