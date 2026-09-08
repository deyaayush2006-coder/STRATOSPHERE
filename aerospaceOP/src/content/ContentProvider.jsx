import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CONTENT } from "./defaults";
import { api } from "../lib/api";

/* Wraps the whole app. Every section component reads its content from here
   instead of importing data.js directly, so what the admin saves in the
   dashboard is what the public site renders on the next load.
   The context starts at the bundled defaults, which means the first paint is
   the full site — not a spinner — and a dead API changes nothing visible. */
const ContentContext = createContext({
  content: DEFAULT_CONTENT,
  status: "idle",
  refresh: () => {},
});

/* Per key, not deep: a section the admin has saved is authoritative in full,
   and a section they have never touched keeps its bundled default. Merging
   field-by-field would make a deleted event impossible to actually delete. */
function mergeSections(remote) {
  const merged = { ...DEFAULT_CONTENT };
  if (!remote) return merged;

  for (const [key, value] of Object.entries(remote)) {
    if (value === null || value === undefined) continue;
    if (!(key in DEFAULT_CONTENT)) continue; // section this build does not render
    merged[key] = value;
  }
  return merged;
}

export function ContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async (signal) => {
    try {
      const { content: remote } = await api.getContent(signal);
      setContent(mergeSections(remote));
      setStatus("live");
    } catch (error) {
      if (error.name === "AbortError") return;
      /* Backend asleep, offline, or not deployed yet. The defaults are
         already on screen, so log it and leave the page alone. */
      console.warn("[content] falling back to bundled defaults:", error.message);
      setStatus("defaults");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const value = useMemo(
    () => ({ content, status, refresh: () => load() }),
    [content, status, load]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

/* Components call this with no argument for the whole bag, or with a section
   key for just that slice:  const events = useContent("events") */
export function useContent(key) {
  const { content } = useContext(ContentContext);
  return key ? content[key] : content;
}

export function useContentStatus() {
  const { status, refresh } = useContext(ContentContext);
  return { status, refresh };
}
