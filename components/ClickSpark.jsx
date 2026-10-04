"use client";

import { useEffect, useRef } from "react";

// React Bits ClickSpark, pinned to the viewport so it never sizes a canvas to
// the full page height, and only animating while sparks are alive.
const ease = (t) => t * (2 - t);

export default function ClickSpark({
  sparkColor = "#22d3ee",
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 420,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const ctx = canvas.getContext("2d");
    let sparks = [];
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      sparks = sparks.filter((spark) => {
        const t = (now - spark.start) / duration;
        if (t >= 1) return false;

        const eased = ease(Math.max(t, 0));
        const distance = eased * sparkRadius;
        const length = sparkSize * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);

        ctx.beginPath();
        ctx.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        ctx.lineTo(spark.x + (distance + length) * cos, spark.y + (distance + length) * sin);
        ctx.stroke();
        return true;
      });

      frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const onClick = (e) => {
      const start = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({ x: e.clientX, y: e.clientY, angle: (2 * Math.PI * i) / sparkCount, start });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-screen w-screen"
    />
  );
}
