"use client";

import { useEffect, useRef, useState } from "react";

// React Bits DecryptedText, trimmed to the "decrypt once on view" mode and
// without the motion dependency. The server renders the real text; the
// scramble only runs in the browser and is skipped for reduced motion.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const scramble = (text, revealed) =>
  text
    .split("")
    .map((char, i) =>
      char === " " || i < revealed ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    )
    .join("");

export default function DecryptedText({
  text,
  speed = 45,
  className = "",
  encryptedClassName = "text-aurora2/80",
}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(text.length);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let timer = 0;

    const run = () => {
      let step = 0;
      timer = setInterval(() => {
        step += 1;
        if (step >= text.length) {
          clearInterval(timer);
          setRevealed(text.length);
          setShown(text);
          return;
        }
        setRevealed(step);
        setShown(scramble(text, step));
      }, speed);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        run();
      },
      { threshold: 0.1 }
    );

    obs.observe(node);
    return () => {
      obs.disconnect();
      clearInterval(timer);
    };
  }, [text, speed]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {shown.split("").map((char, i) => (
          <span key={i} className={i < revealed ? "" : encryptedClassName}>
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
