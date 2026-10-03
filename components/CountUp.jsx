"use client";

import { useEffect, useRef, useState } from "react";

function parse(value) {
  const match = String(value ?? "").match(/^(\D*?)([\d.,]+)(.*)$/s);
  if (!match) return null;

  const [, prefix, digits, suffix] = match;
  const number = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;

  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  return { prefix, number, suffix, decimals, grouped: digits.includes(",") };
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const DURATION = 1400;

export default function CountUp({ value, className = "" }) {
  const parsed = parse(value);
  const ref = useRef(null);

  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!parsed) return undefined;

    const node = ref.current;
    if (!node) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;

    const run = () => {
      const started = performance.now();

      const step = (now) => {
        const t = Math.min((now - started) / DURATION, 1);
        setShown(parsed.number * easeOut(t));
        frame = t < 1 ? requestAnimationFrame(step) : 0;
      };

      frame = requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        obs.disconnect();
        run();
      },
      { threshold: 0.33 }
    );

    obs.observe(node);
    return () => {
      obs.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value]);

  if (!parsed) return <span className={className}>{value}</span>;

  const n = shown == null ? parsed.number : shown;
  const text = parsed.grouped
    ? n.toLocaleString("en-IN", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })
    : n.toFixed(parsed.decimals);

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      <span className="tabular-nums">{text}</span>
      {parsed.suffix}
    </span>
  );
}
