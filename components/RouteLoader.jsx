"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { INTRO_KEY } from "@/lib/intro";
import { typeWhenSeen } from "@/lib/typing-clock";
import LoadingScreen from "./LoadingScreen";

const GRACE = 400;

const MIN_SHOW = 950;

const MAX_WAIT = 8000;

const FADE = 500;

function firstPaintAt() {
  try {
    const paint = performance.getEntriesByType("paint")[0];
    if (paint) return Date.now() - (performance.now() - paint.startTime);
  } catch {
  }
  return Date.now();
}

function typed() {
  const el = document.querySelector("[data-route-loader]");
  if (!el || typeof el.getAnimations !== "function") return true;

  return [...el.querySelectorAll("[data-typed]")].every((node) =>
    node.getAnimations().every((a) => a.playState === "finished")
  );
}

const introSeen = () => document.documentElement.hasAttribute("data-intro-seen");

function normalise(pathname) {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
  }
  path = path.replace(/\/+$/, "");
  return path === "" ? "/" : path;
}

export default function RouteLoader({ paths = [], trees = [] }) {
  const pathname = usePathname();

  const [phase, setPhase] = useState("shown");

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const shownAt = useRef(0);
  const settled = useRef(pathname);
  const timers = useRef([]);

  const navigating = useRef(false);
  const raised = useRef(false);

  const routes = useRef({ paths, trees });
  routes.current = { paths, trees };

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const after = useCallback((ms, fn) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const known = useCallback((pathname) => {
    const path = normalise(pathname);
    const { paths, trees } = routes.current;
    if (paths.includes(path)) return true;
    return trees.some((root) => path.startsWith(`${root}/`));
  }, []);

  const to = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const drop = useCallback(() => {
    clearTimers();
    to("idle");
  }, [clearTimers, to]);

  const dismiss = useCallback(() => {
    clearTimers();
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
    }
    to("leaving");
    after(FADE, () => to("idle"));
  }, [after, clearTimers, to]);

  const settle = useCallback(() => {
    if (phaseRef.current !== "shown") {
      drop();
      return;
    }

    clearTimers();

    if (raised.current) {
      dismiss();
      return;
    }

    const release = () => {
      const held = Date.now() - shownAt.current;
      if (held < MIN_SHOW) after(MIN_SHOW - held, release);
      else if (held < MAX_WAIT && !typed()) after(50, release);
      else dismiss();
    };
    release();
  }, [after, clearTimers, dismiss, drop]);

  const raise = useCallback(() => {
    raised.current = true;
    shownAt.current = Date.now();
    to("shown");
  }, [to]);

  useEffect(() => {
    if (introSeen()) {
      drop();
      return undefined;
    }

    shownAt.current = firstPaintAt();

    const loaded = () => {
      if (navigating.current) return;
      settle();
    };

    after(MAX_WAIT, () => {
      window.removeEventListener("load", loaded);
      if (phaseRef.current !== "idle") dismiss();
    });

    if (document.readyState === "complete") loaded();
    else window.addEventListener("load", loaded, { once: true });

    return () => window.removeEventListener("load", loaded);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = e.target?.closest?.("a[href]");
      if (!link) return;
      if (link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      let url;
      try {
        url = new URL(link.href, location.href);
      } catch {
        return;
      }

      if (url.origin !== location.origin) return;
      if (normalise(url.pathname) === normalise(location.pathname)) return;

      if (!known(url.pathname)) return;

      clearTimers();
      navigating.current = true;

      after(GRACE, raise);
      after(MAX_WAIT, () => {
        navigating.current = false;
        if (phaseRef.current !== "idle") dismiss();
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [after, clearTimers, dismiss, known, raise]);

  useEffect(() => {
    if (pathname === settled.current) return;
    settled.current = pathname;

    if (!navigating.current) return;
    navigating.current = false;
    settle();
  }, [pathname]);

  useEffect(() => {
    if (phase !== "shown" && phase !== "leaving") return undefined;
    if (!raised.current && introSeen()) return undefined;

    const root = document.documentElement;
    root.dataset.intro = "pending";
    return () => root.removeAttribute("data-intro");
  }, [phase]);

  useLayoutEffect(() => {
    if (phase === "shown" && raised.current) {
      typeWhenSeen(document.querySelector("[data-route-loader]"));
    }
  }, [phase]);

  useEffect(() => clearTimers, [clearTimers]);

  if (phase === "idle") return null;

  return (
    <LoadingScreen
      key={raised.current ? "raised" : "served"}
      served={!raised.current}
      leaving={phase === "leaving"}
      fade={FADE}
    />
  );
}
