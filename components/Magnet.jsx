"use client";

import { useRef } from "react";
import { animated, useReducedMotion, useSpring } from "@react-spring/web";

// React Bits Magnet, driven by react-spring: when the cursor comes within
// `padding` px of the element it is pulled a fraction of the way toward it,
// and springs back when the cursor leaves.
export default function Magnet({ padding = 40, strength = 0.35, className = "", children }) {
  const ref = useRef(null);
  const still = useReducedMotion();
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0, config: { tension: 260, friction: 18 } }));

  const onPointerMove = (e) => {
    if (still || e.pointerType !== "mouse") return;
    const rect = ref.current.getBoundingClientRect();
    api.start({
      x: (e.clientX - (rect.left + rect.width / 2)) * strength,
      y: (e.clientY - (rect.top + rect.height / 2)) * strength,
    });
  };

  const reset = () => api.start({ x: 0, y: 0 });

  return (
    <span
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      style={{ padding, margin: -padding }}
      className={`inline-block ${className}`}
    >
      <animated.span style={{ x, y }} className="inline-block">
        {children}
      </animated.span>
    </span>
  );
}
