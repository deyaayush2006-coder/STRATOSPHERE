"use client";

import { useEffect, useState } from "react";
import { animated, useReducedMotion, useTransition } from "@react-spring/web";

const STORAGE_KEY = "stratosphere-theme";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
    }
  }, [theme, mounted]);

  const next = theme === "dark" ? "light" : "dark";

  // react-spring: the outgoing icon spins away as the new one springs in.
  const still = useReducedMotion();
  const icons = useTransition(theme, {
    initial: null,
    from: { opacity: 0, rotate: -90, scale: 0.5 },
    enter: { opacity: 1, rotate: 0, scale: 1 },
    leave: { opacity: 0, rotate: 90, scale: 0.5 },
    config: { tension: 380, friction: 22 },
    immediate: still,
  });

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/15 text-ink/70 hover:text-aurora2 hover:border-aurora2/40 transition-colors ${className}`}
    >
      {icons((style, current) => (
        <animated.svg
          style={style}
          viewBox="0 0 24 24"
          className="col-start-1 row-start-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          {current === "dark" ? (
            <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" strokeLinejoin="round" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />
            </>
          )}
        </animated.svg>
      ))}
    </button>
  );
}
