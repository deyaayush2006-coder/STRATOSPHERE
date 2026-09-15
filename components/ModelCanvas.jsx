"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useGLTF } from "@react-three/drei";

/* The renderer half of the model viewer. Never imported directly — ModelViewer
   pulls it in with next/dynamic and ssr:false, which is the only reason three
   and its loaders stay out of the server build and off the first payload of
   every page that does not show a model. */

function Model({ src }) {
  const { scene } = useGLTF(src);

  /* Bounds measures the scene and flies the camera to frame it, so a model
     exported in millimetres and one exported in metres both arrive filling the
     same box — which matters here, because these come out of whatever CAD tool
     the member happened to be using. Center puts the origin at the middle of
     the geometry first, so orbiting turns the aircraft rather than swinging it
     around some arbitrary point the exporter left behind. */
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
      {/* Lit by hand rather than by drei's Environment, whose presets fetch an
          HDRI off a CDN at runtime. Three lights and no network. */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <directionalLight position={[-5, -2, -4]} intensity={0.7} color="#22d3ee" />
    </>
  );
}

/* A model that will not load must not take the page with it.
 *
 * Suspense covers the wait; this covers the failure — a path that 404s, a file
 * that is not really a glTF, a draco-compressed export whose decoder is not
 * here. React unmounts the whole tree on a throw inside Canvas, so without
 * this the section would blank out rather than say what went wrong. */
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
    // Tells the wrapper outside the Canvas to swap in the fallback panel. The
    // boundary itself can only render three.js objects, so it cannot say
    // anything to the reader from in here.
    this.props.onFail?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ModelCanvas({ src, onFail }) {
  const [still, setStill] = useState(false);
  const failedRef = useRef(false);

  // Spinning by itself is the one thing here that is pure motion, so it is the
  // one thing a reduced-motion preference switches off. Drag still works.
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
      /* Capped at 2. A phone reporting devicePixelRatio 3 or 4 would otherwise
         render sixteen times the pixels for a difference nobody can see on a
         300px-tall canvas. */
      dpr={[1, 2]}
      /* The section behind it is already glass over the site backdrop, so the
         canvas keeps its own transparency rather than painting a grey box. */
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
        /* Stopped short of the poles at both ends: past them the model is
           being looked at end-on and the horizon flips, which reads as the
           control breaking rather than as a viewpoint. */
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
