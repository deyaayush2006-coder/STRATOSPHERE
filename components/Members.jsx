"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SectionHeader from "./SectionHeader";
import Plane from "./Plane";
import { mediaUrl } from "@/lib/media-url";

const LEFT_X = 0.24;
const RIGHT_X = 0.76;
const FIRST_Y = 0.07;
const LAST_Y = 0.74;
const END_Y = 0.93;

const stationX = (i) => (i % 2 === 0 ? LEFT_X : RIGHT_X);
const stationY = (i, n) =>
  n > 1 ? FIRST_Y + (i / (n - 1)) * (LAST_Y - FIRST_Y) : (FIRST_Y + LAST_Y) / 2;

const FOCUS = 0.58;

const ARRIVED_AT = 0.965;

const CONTRAIL = [
  { span: 0.32, width: 13, opacity: 0.1 },
  { span: 0.72, width: 3, opacity: 0.16 },
  { span: 0.34, width: 3, opacity: 0.45 },
  { span: 0.13, width: 3.5, opacity: 1 },
];

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const round = (v) => Math.round(v * 100) / 100;

const shortYear = (year) => String(year ?? "").match(/\d{4}/)?.[0] ?? String(year ?? "");

const routeStart = ({ w }, n) => [n > 1 ? stationX(1) * w : w / 2, 0];

function buildPath({ w, h }, n) {
  const points = [
    routeStart({ w }, n),
    ...Array.from({ length: n }, (_, i) => [stationX(i) * w, stationY(i, n) * h]),
    [w / 2, END_Y * h],
  ];

  let d = `M ${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const k = (y1 - y0) * 0.55;
    d +=
      ` C ${round(x0)} ${round(y0 + k)},` +
      ` ${round(x1)} ${round(y1 - k)},` +
      ` ${round(x1)} ${round(y1)}`;
  }
  return d;
}

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
    <Image
      src={mediaUrl(member.image)}
      alt=""
      width={48}
      height={48}
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
          style={stagger ? { animationDelay: `${Math.min(i, 8) * 18}ms` } : undefined}
        >
          <MemberCard member={m} />
        </div>
      ))}
    </div>
  );
}

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

function Station({ cohort, index, count, active, onOpen, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onOpen(index)}
      aria-haspopup="dialog"
      title={`See the ${cohort.year} committee`}
      style={{ left: `${stationX(index) * 100}%`, top: `${stationY(index, count) * 100}%` }}
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

export default function Members({ memberCohorts = [] }) {
  const cohorts = memberCohorts;
  const count = cohorts.length;

  const presentIndex = useMemo(() => {
    const flagged = cohorts.findIndex((c) => c.current);
    return flagged >= 0 ? flagged : count - 1;
  }, [cohorts, count]);
  const present = cohorts[presentIndex];

  const trackRef = useRef(null);
  const pathRef = useRef(null);
  const trailRefs = useRef([]);
  const craftRef = useRef(null);
  const stationRefs = useRef([]);
  const presentRef = useRef(null);
  const openedFrom = useRef(null);

  const totalRef = useRef(0);
  const stopsRef = useRef([]);

  const [size, setSize] = useState(null);
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [flying, setFlying] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => setFlying(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
  const start = size && count > 0 ? routeStart(size, count) : null;

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

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !d) return;

    const total = path.getTotalLength();
    totalRef.current = total;

    stopsRef.current = Array.from({ length: count }, (_, i) =>
      total > 0 ? lengthAtY(path, total, stationY(i, count) * size.h) / total : 0
    );

    place(0);
  }, [d, count, size, place]);

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

      const focus = window.innerHeight * FOCUS;
      const progress = clamp((focus - rect.top) / rect.height, 0, 1);

      place(total * progress);

      setLaunched((prev) => {
        const now = progress > 0;
        return prev === now ? prev : now;
      });

      setArrived((prev) => {
        const now = progress >= ARRIVED_AT;
        return prev === now ? prev : now;
      });

      if (rect.top > focus || rect.bottom < focus) return;

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

  useEffect(() => {
    if (flying || !d) return;
    const total = totalRef.current;
    if (total <= 0) return;

    place(total);
    setArrived(true);
  }, [flying, d, place]);

  const openYear = useCallback((index, node) => {
    openedFrom.current = node ?? stationRefs.current[index] ?? null;
    setOpen(index);
  }, []);

  const closeYear = useCallback(() => {
    setOpen(null);
    openedFrom.current?.focus();
  }, []);

  if (count === 0) return null;

  return (
    <section id="members" className="scroll-mt-28 px-6 py-24 md:py-28">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          title="The Team"
        />
      </div>

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

            <path
              ref={pathRef}
              d={d}
              stroke="currentColor"
              className="text-ink/15"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="1 8"
            />

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

        <div
          style={{ left: "50%", top: `${END_Y * 100}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
        >
          <button
            ref={presentRef}
            type="button"
            onClick={() => openYear(presentIndex, presentRef.current)}
            aria-haspopup="dialog"
            title={present ? `See the ${present.year} committee` : undefined}
            className="group block outline-none"
          >
            <span
              className={`block font-display font-bold tracking-[-0.04em] leading-none
                text-[clamp(2rem,8vw,3.5rem)] transition duration-300 ${
                  arrived
                    ? "text-aurora2 drop-shadow-[0_0_30px_rgba(34,211,238,0.65)] scale-110"
                    : "text-ink/20 scale-100 group-hover:text-ink/50"
                }`}
            >
              Present
            </span>
          </button>
        </div>

        <div
          ref={craftRef}
          aria-hidden="true"
          className={`absolute left-0 top-0 z-10 w-fit text-aurora2 pointer-events-none will-change-transform
            ${launched && !arrived ? "opacity-100" : "opacity-0"}`}
        >
          <span className="relative block">
            <span className="absolute -inset-7 rounded-full bg-aurora2/20 blur-2xl" />
            <Plane
              size={68}
              className="relative w-14 h-14 sm:w-[4.25rem] sm:h-[4.25rem] animate-craft-bob drop-shadow-[0_0_16px_rgba(34,211,238,0.7)]"
            />
          </span>
        </div>

        {start && (
          <div
            aria-hidden="true"
            style={{ left: start[0], top: start[1] }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <span className="absolute inset-0 rounded-full bg-aurora2/30 animate-ping motion-reduce:animate-none" />
            <span className="relative block h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-aurora2 shadow-[0_0_28px_rgba(34,211,238,0.8)]" />
          </div>
        )}
      </div>

      {present && (
        <div className="max-w-6xl mx-auto mt-4 md:mt-8">
          <CohortHeading cohort={present} className="mb-6 justify-center text-center" />
          <CohortGrid cohort={present} stagger={false} />
        </div>
      )}

      {open != null && cohorts[open] && (
        <CommitteeDialog cohort={cohorts[open]} onClose={closeYear} />
      )}

      <noscript>
        <div className="max-w-6xl mx-auto mt-16 space-y-14">
          {cohorts.map((c, i) =>
            i === presentIndex ? null : (
              <div key={c.year}>
                <CohortHeading cohort={c} className="mb-5" />
                <CohortGrid cohort={c} stagger={false} />
              </div>
            )
          )}
        </div>
      </noscript>
    </section>
  );
}
