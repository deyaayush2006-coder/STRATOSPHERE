"use client";

import dynamic from "next/dynamic";
import Rocket from "./Rocket";

// three.js comes in its own chunk so it never holds up the page behind the
// loader; the stars fade in once it lands.
const Starfield = dynamic(() => import("./Starfield"), { ssr: false });

const TILT = "68deg";

const PERSPECTIVE = "1200px";

const WORDMARK = "STRATOSPHERE";

const LETTER_STAGGER = 42;

const SUBTITLE_DELAY = WORDMARK.length * LETTER_STAGGER + 80;

export default function LoadingScreen({ served = false, leaving = false, fade = 500 }) {
  return (
    <div
      data-route-loader=""
      role="status"
      aria-live="polite"
      aria-label="Loading Stratosphere"
      className={`fixed inset-0 z-[100] grid place-items-center bg-base transition-opacity ease-out
        ${served ? "[[data-intro-seen]_&]:hidden" : ""} ${leaving ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${fade}ms` }}
    >
      <noscript>
        <style>{`[data-route-loader]{display:none!important}`}</style>
      </noscript>

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2
            animate-loader-bloom motion-reduce:animate-none
            bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky-core)_42%,transparent)_0%,color-mix(in_oklab,var(--sky-core)_14%,transparent)_45%,transparent_100%)]"
        />
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[radial-gradient(120%_100%_at_50%_100%,var(--sky-horizon),transparent_70%)]" />

        <Starfield />
      </div>

      <>

        <div
          aria-hidden="true"
          className={`animate-loader-in [--s:1] max-[980px]:[--s:0.76] max-[720px]:[--s:0.6]
            max-[455px]:[--s:0.55] max-[417px]:[--s:0.5] max-[379px]:[--s:0.46] max-[349px]:[--s:0.42]
            h-[calc(300px*var(--s))] w-[calc(760px*var(--s))]
            transition-[scale,filter] ease-in motion-reduce:transition-none
            ${leaving ? "scale-[1.08] blur-[3px]" : ""}`}
          style={{ transitionDuration: `${fade}ms` }}
        >
          <div
            className="relative h-[300px] w-[760px] origin-top-left [transform:scale(var(--s))]
              [transform-style:preserve-3d]"
            style={{ "--tilt": TILT, perspective: PERSPECTIVE }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-[640px] w-[640px] [transform-style:preserve-3d]
                [transform:translate(-50%,-50%)_rotateX(var(--tilt))]"
            >
              <svg
                viewBox="0 0 640 640"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full text-ink/15"
              >
                <circle
                  cx="320"
                  cy="320"
                  r="317.99"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="1 8"
                />
              </svg>

              <div
                className="absolute inset-0 animate-orbit-spin [transform-style:preserve-3d] motion-reduce:animate-none"
              >

                <div
                  className="absolute inset-0 rounded-full blur-[6px]
                    bg-[conic-gradient(from_-40deg,transparent_0deg,rgba(34,211,238,0.35)_123deg,transparent_124deg)]
                    [mask-image:radial-gradient(closest-side,transparent_calc(100%-14px),#000_calc(100%-2px),transparent_calc(100%+8px))]"
                />
                <div
                  className="absolute inset-0 rounded-full
                    bg-[conic-gradient(from_-40deg,transparent_0deg,rgba(34,211,238,0.12)_60deg,rgba(154,217,255,0.9)_123deg,transparent_124deg)]
                    [mask-image:radial-gradient(closest-side,transparent_calc(100%-4.5px),#000_calc(100%-2px),transparent_calc(100%+0.5px))]"
                />

                <div className="absolute left-full top-1/2 [transform:translate(-50%,-50%)] [transform-style:preserve-3d]">

                  <span
                    className="block animate-orbit-face [transform:rotateX(calc(var(--tilt)*-1))]
                      motion-reduce:animate-none"
                  >
                    <span className="relative block h-[68px] w-[68px] text-aurora2">
                      <span
                        className="absolute -inset-6 rounded-full blur-lg
                          bg-[radial-gradient(circle,rgba(34,211,238,0.28)_0%,rgba(34,211,238,0.09)_42%,transparent_72%)]"
                      />
                      <Rocket
                        size={68}
                        className="relative block h-full w-full animate-craft-bob motion-reduce:animate-none
                          [filter:drop-shadow(0_0_4px_rgba(34,211,238,0.45))_drop-shadow(0_0_15px_rgba(34,211,238,0.18))]"
                      />
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 grid place-items-center">
              <div className="relative">
                <span className="relative flex items-center font-display text-[54px] font-bold uppercase leading-none tracking-[0.02em] text-ink
                  [text-shadow:0_0_32px_rgba(34,211,238,0.22)]">
                  {WORDMARK.split("").map((letter, i) => (
                    <span
                      key={i}
                      data-typed=""
                      className="inline-block animate-letter-in motion-reduce:animate-none"
                      style={{ animationDelay: `${i * LETTER_STAGGER}ms` }}
                    >
                      {letter === "O" ? (
                        <span className="relative inline-block">
                          O
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-1/2 top-1/2 h-[0.46em] w-[1.24em]
                              -translate-x-1/2 -translate-y-1/2 -rotate-[27deg] rounded-[50%] border-[3px] border-ink/75"
                          />
                        </span>
                      ) : (
                        letter
                      )}
                    </span>
                  ))}

                  <span
                    aria-hidden="true"
                    className="absolute left-full top-1/2 ml-[0.12em] h-[0.78em] w-[0.06em] -translate-y-1/2
                      animate-caret bg-aurora2 motion-reduce:hidden"
                  />
                </span>

                <span
                  data-typed=""
                  className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap
                    animate-loader-in font-mono text-[13px] uppercase tracking-[0.3em] text-ink/45
                    max-[720px]:text-[calc(10px/var(--s))] max-[720px]:tracking-[0.18em]
                    motion-reduce:animate-none"
                  style={{ animationDelay: `${SUBTITLE_DELAY}ms` }}
                >
                  Aerospace Club · Jadavpur University
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-0 bottom-[12%] flex animate-loader-in justify-center px-6"
        >
          <div
            className="flex items-center gap-3 rounded-full border border-edge bg-panel/40 px-4 py-2
              font-mono text-[11px] uppercase tracking-[0.3em] text-ink/55 backdrop-blur-sm"
          >
            <span className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-loader-signal rounded-full bg-aurora2
                    shadow-[0_0_6px_rgba(34,211,238,0.7)] motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </span>
            Preparing for launch
          </div>
        </div>
      </>
    </div>
  );
}
