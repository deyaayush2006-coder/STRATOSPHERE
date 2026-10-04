"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

// drei Stars on a slow drift: a near layer of bright twinkling stars and a far
// layer of faint dust, both rotating so the field feels like it is moving past.
function Drift({ still }) {
  const group = useRef(null);

  useFrame((_, delta) => {
    if (still || !group.current) return;
    group.current.rotation.y += delta * 0.018;
    group.current.rotation.x += delta * 0.006;
  });

  return (
    <group ref={group}>
      <Stars radius={60} depth={40} count={2600} factor={3.4} saturation={0} fade speed={still ? 0 : 0.8} />
      <Stars radius={110} depth={60} count={3200} factor={2} saturation={0} fade speed={still ? 0 : 0.4} />
    </group>
  );
}

export default function Starfield({ className = "" }) {
  const [still, setStill] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${ready ? "opacity-100" : "opacity-0"} ${className}`}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1], fov: 60 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        frameloop={still ? "demand" : "always"}
        onCreated={() => setReady(true)}
      >
        <Drift still={still} />
      </Canvas>
    </div>
  );
}
