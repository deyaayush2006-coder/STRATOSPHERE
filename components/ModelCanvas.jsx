"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";

function Model({ src }) {
  const { scene } = useGLTF(src);

  return (
    <Bounds fit clip observe margin={1.25}>
      <Center>
        <primitive object={scene} />
      </Center>
    </Bounds>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <directionalLight position={[-5, -2, -4]} intensity={0.7} color="#22d3ee" />
    </>
  );
}

class LoadBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn("[model] could not load:", error?.message ?? error);
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ModelCanvas({ src, onFail }) {
  const [still, setStill] = useState(false);
  const failedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <Canvas
      camera={{ position: [3, 1.6, 4], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <Lights />

      <Suspense fallback={null}>
        <LoadBoundary
          onFail={() => {
            if (failedRef.current) return;
            failedRef.current = true;
            onFail?.();
          }}
        >
          <Model src={src} />
        </LoadBoundary>
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        autoRotate={!still}
        autoRotateSpeed={0.9}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
