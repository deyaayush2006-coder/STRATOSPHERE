import React from "react";

// Background aircraft. One transform animation per craft, no will-change:
// at this count a layer per craft costs more GPU memory than it saves.

function Plane({ size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M22 12c0 .5-.4.9-.9.9h-6.3l-3.1 6.4c-.1.3-.4.4-.7.4h-1c-.3 0-.6-.3-.5-.7l1.6-6.1H7.4l-1.2 2c-.1.2-.3.3-.5.3h-.8c-.3 0-.5-.3-.4-.6l.8-2.6-.8-2.6c-.1-.3.1-.6.4-.6h.8c.2 0 .4.1.5.3l1.2 2h3.7L9.5 4.9c-.1-.3.2-.7.5-.7h1c.3 0 .6.2.7.4l3.1 6.4h6.3c.5 0 .9.4.9 1Z" />
    </svg>
  );
}

function Drone({ size }) {
  // Filled shapes, not strokes: at 17px a 1px outline turns to mush.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {/* rotor wash */}
      <g fill="currentColor" opacity="0.25">
        <circle cx="6" cy="6" r="4.3" />
        <circle cx="18" cy="6" r="4.3" />
        <circle cx="6" cy="18" r="4.3" />
        <circle cx="18" cy="18" r="4.3" />
      </g>

      {/* arms */}
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M9.5 9.5 6.6 6.6M14.5 9.5 17.4 6.6M9.5 14.5 6.6 17.4M14.5 14.5 17.4 17.4" />
      </g>

      {/* hubs and body */}
      <g fill="currentColor">
        <circle cx="6" cy="6" r="1.9" />
        <circle cx="18" cy="6" r="1.9" />
        <circle cx="6" cy="18" r="1.9" />
        <circle cx="18" cy="18" r="1.9" />
        <rect x="9.1" y="9.1" width="5.8" height="5.8" rx="1.7" />
      </g>
    </svg>
  );
}

// path -> animation class, facing, and nose angle
const PATHS = {
  r: { anim: "animate-cross-right", flip: false, tilt: 0 },
  l: { anim: "animate-cross-left", flip: true, tilt: 0 },
  se: { anim: "animate-drift-se", flip: false, tilt: 11 },
  ne: { anim: "animate-drift-ne", flip: false, tilt: -11 },
  sw: { anim: "animate-drift-sw", flip: true, tilt: -11 },
  nw: { anim: "animate-drift-nw", flip: true, tilt: 11 },
};

// top / size / duration / delay / opacity / path / kind.
// delay is applied negative so each craft starts mid-crossing instead of
// waiting stacked at the left edge.
const FLEET = [
  { top: "4%", size: 26, dur: 68, delay: 0, op: 0.34, path: "se", kind: "plane" },
  { top: "8%", size: 19, dur: 92, delay: 26, op: 0.2, path: "l", kind: "drone" },
  { top: "12%", size: 35, dur: 54, delay: 11, op: 0.42, path: "r", kind: "plane" },
  { top: "16%", size: 22, dur: 84, delay: 41, op: 0.24, path: "nw", kind: "plane" },
  { top: "21%", size: 29, dur: 63, delay: 7, op: 0.36, path: "ne", kind: "drone" },
  { top: "25%", size: 17, dur: 99, delay: 55, op: 0.18, path: "sw", kind: "plane" },
  { top: "30%", size: 38, dur: 49, delay: 33, op: 0.4, path: "r", kind: "plane" },
  { top: "34%", size: 23, dur: 77, delay: 18, op: 0.26, path: "se", kind: "drone" },
  { top: "38%", size: 20, dur: 88, delay: 60, op: 0.22, path: "l", kind: "plane" },
  { top: "43%", size: 32, dur: 58, delay: 4, op: 0.38, path: "nw", kind: "plane" },
  { top: "47%", size: 25, dur: 72, delay: 47, op: 0.28, path: "ne", kind: "drone" },
  { top: "52%", size: 19, dur: 95, delay: 22, op: 0.19, path: "r", kind: "plane" },
  { top: "56%", size: 36, dur: 52, delay: 38, op: 0.36, path: "sw", kind: "plane" },
  { top: "61%", size: 22, dur: 81, delay: 14, op: 0.24, path: "se", kind: "drone" },
  { top: "65%", size: 28, dur: 66, delay: 51, op: 0.32, path: "l", kind: "plane" },
  { top: "70%", size: 17, dur: 103, delay: 29, op: 0.18, path: "ne", kind: "plane" },
  { top: "74%", size: 33, dur: 56, delay: 9, op: 0.38, path: "nw", kind: "drone" },
  { top: "78%", size: 23, dur: 79, delay: 44, op: 0.26, path: "r", kind: "plane" },
  { top: "83%", size: 20, dur: 90, delay: 16, op: 0.21, path: "sw", kind: "plane" },
  { top: "87%", size: 30, dur: 61, delay: 57, op: 0.34, path: "se", kind: "drone" },
  { top: "91%", size: 19, dur: 97, delay: 35, op: 0.19, path: "l", kind: "plane" },
  { top: "95%", size: 26, dur: 70, delay: 2, op: 0.3, path: "ne", kind: "plane" },
  { top: "98%", size: 22, dur: 86, delay: 49, op: 0.23, path: "nw", kind: "drone" },
  { top: "1%", size: 29, dur: 64, delay: 24, op: 0.28, path: "sw", kind: "plane" },
];

export default function SkyTraffic() {
  return (
    <>
      {FLEET.map((c, i) => {
        const path = PATHS[c.path];
        return (
          <div
            key={i}
            className={`absolute left-0 text-craft ${path.anim}`}
            style={{
              top: c.top,
              opacity: c.op,
              animationDuration: `${c.dur}s`,
              animationDelay: `-${c.delay}s`,
            }}
          >
            {/* face the direction of travel */}
            <span
              className="block"
              style={{
                transform: `${path.flip ? "scaleX(-1) " : ""}rotate(${path.tilt}deg)`,
              }}
            >
              {c.kind === "plane" ? <Plane size={c.size} /> : <Drone size={c.size} />}
            </span>
          </div>
        );
      })}
    </>
  );
}
