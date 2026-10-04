"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

// CAD exports come in any unit, so the bob and the ground shadow are sized
// from the model's measured bounds rather than fixed world units.
function Model({ src, still }) {
  const { scene } = useGLTF(src);
  const [dims, setDims] = useState(null);

  const span = dims ? Math.max(dims.width, dims.depth) : 0;

  return (
    <Bounds fit clip observe margin={1.3}>
      <Float
        speed={still ? 0 : 1.4}
        rotationIntensity={0.12}
        floatIntensity={dims ? dims.height * 0.12 : 0}
      >
        <Center
          onCentered={({ width, height, depth }) =>
            setDims((prev) =>
              prev && prev.width === width && prev.height === height && prev.depth === depth
                ? prev
                : { width, height, depth }
            )
          }
        >
          <primitive object={scene} />
        </Center>
      </Float>
      {dims && (
        <ContactShadows
          position={[0, -dims.height * 0.62, 0]}
          scale={span * 2.2}
          far={dims.height}
          blur={2.4}
          opacity={0.45}
          frames={still ? 1 : Infinity}
        />
      )}
    </Bounds>
  );
}

// A studio environment built from light panels (no HDR download) gives metal
// and plastic real reflections, a key light shapes the model, and a cyan rim
// ties it to the site's palette.
function Lights() {
  return (
    <>
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#22d3ee" position={[5, 0, -3]} rotation-y={-Math.PI / 2} scale={[4, 4, 1]} />
      </Environment>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <directionalLight position={[-5, -2, -4]} intensity={0.9} color="#22d3ee" />
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
          <Model src={src} still={still} />
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
