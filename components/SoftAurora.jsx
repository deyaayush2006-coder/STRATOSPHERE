"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

// React Bits SoftAurora, without the mouse and light-mode paths. Stops drawing
// while the tab is hidden or the canvas is not displayed, and holds a still
// frame for reduced motion.
const hexToVec3 = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

const vertexShader = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  float d000 = dot(gradientHash(vec3(fx, fy, fz)), vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(gradientHash(vec3(cx, fy, fz)), vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(gradientHash(vec3(fx, cy, fz)), vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(gradientHash(vec3(cx, cy, fz)), vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(gradientHash(vec3(fx, fy, cz)), vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(gradientHash(vec3(cx, fy, cz)), vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(gradientHash(vec3(fx, cy, cz)), vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(gradientHash(vec3(cx, cy, cz)), vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float ly0 = mix(mix(d000, d100, sx), mix(d010, d110, sx), sy);
  float ly1 = mix(mix(d001, d101, sx), mix(d011, d111, sx), sy);
  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  float glow1 = auroraGlow(t);
  float glow2 = auroraGlow(t + uLayerOffset);
  vec3 gradient1 = cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20));
  vec3 gradient2 = cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25));

  vec3 col = 0.99 * glow1 * gradient1 * uColor1;
  col += 0.99 * glow2 * gradient2 * uColor2;
  col *= uBrightness;

  gl_FragColor = vec4(col, clamp(length(col), 0.0, 1.0));
}
`;

export default function SoftAurora({
  speed = 0.6,
  scale = 1.5,
  brightness = 1,
  color1 = "#f7f7f7",
  color2 = "#e100ff",
  noiseFrequency = 2.5,
  noiseAmplitude = 1,
  bandHeight = 0.5,
  bandSpread = 1,
  octaveDecay = 0.1,
  layerOffset = 0,
  colorSpeed = 1,
  resolution = 0.25,
  fps = 30,
  className = "",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return undefined;

    // The glow has no fine detail, so it is drawn at a fraction of the screen's
    // resolution and stretched to fill it — the main lever on GPU cost.
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: resolution });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.display = "block";
    container.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [1, 1, 1] },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uBrightness: { value: brightness },
        uColor1: { value: hexToVec3(color1) },
        uColor2: { value: hexToVec3(color2) },
        uNoiseFreq: { value: noiseFrequency },
        uNoiseAmp: { value: noiseAmplitude },
        uBandHeight: { value: bandHeight },
        uBandSpread: { value: bandSpread },
        uOctaveDecay: { value: octaveDecay },
        uLayerOffset: { value: layerOffset },
        uColorSpeed: { value: colorSpeed },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let onScreen = true;
    const interval = 1000 / fps;
    let frame = 0;
    let lastDraw = 0;

    const draw = (t) => {
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    };

    const loop = (t) => {
      frame = requestAnimationFrame(loop);
      if (t - lastDraw < interval - 1) return;
      lastDraw = t;
      draw(t);
    };

    // RouteLoader marks <html data-intro="pending"> while its screen covers the
    // page, so there is nothing to draw for until it lifts.
    const root = document.documentElement;
    const covered = () => root.dataset.intro === "pending";

    const start = () => {
      if (still || frame || document.hidden || !onScreen || covered()) return;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.uResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ];
      if (!frame) draw(performance.now());
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });

    const intro = new MutationObserver(() => (covered() ? stop() : start()));

    resize();
    io.observe(container);
    intro.observe(root, { attributes: true, attributeFilter: ["data-intro"] });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      io.disconnect();
      intro.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.remove();
    };
  }, [speed, scale, brightness, color1, color2, noiseFrequency, noiseAmplitude, bandHeight, bandSpread, octaveDecay, layerOffset, colorSpeed, resolution, fps]);

  return <div ref={ref} aria-hidden="true" className={`relative h-full w-full ${className}`} />;
}
