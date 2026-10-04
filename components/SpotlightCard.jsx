"use client";

import { useRef } from "react";
import { animated, to, useReducedMotion, useSpring } from "@react-spring/web";

// React Bits SpotlightCard, plus a react-spring tilt toward the cursor.
// The outer element is left free for entrance animations (GSAP moves it);
// the inner one carries the card's look, the glow and the tilt. The glow
// position lives in CSS variables, so moving the cursor never re-renders.
export default function SpotlightCard({
  as: Tag = "div",
  className = "",
  spotlightColor = "rgba(34, 211, 238, 0.16)",
  tilt = 5,
  children,
}) {
  const ref = useRef(null);
  const still = useReducedMotion();
  const [{ rx, ry, s }, api] = useSpring(() => ({
    rx: 0,
    ry: 0,
    s: 1,
    config: { tension: 300, friction: 26 },
  }));

  const onPointerMove = (e) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    node.style.setProperty("--spot-x", `${x}px`);
    node.style.setProperty("--spot-y", `${y}px`);

    if (still || e.pointerType !== "mouse" || !tilt) return;
    api.start({
      ry: (x / rect.width - 0.5) * tilt,
      rx: -(y / rect.height - 0.5) * tilt,
      s: 1.015,
    });
  };

  const onPointerLeave = () => api.start({ rx: 0, ry: 0, s: 1 });

  return (
    <Tag className="h-full [perspective:1000px]">
      <animated.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{
          transform: to([rx, ry, s], (x, y, z) => `rotateX(${x}deg) rotateY(${y}deg) scale(${z})`),
        }}
        className={`group/spot relative h-full ${className}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100 group-focus-within/spot:opacity-100"
          style={{
            background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 0%), ${spotlightColor}, transparent 70%)`,
          }}
        />
        {children}
      </animated.div>
    </Tag>
  );
}
