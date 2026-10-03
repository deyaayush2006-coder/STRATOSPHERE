"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { mediaUrl } from "@/lib/media-url";

const ModelCanvas = dynamic(() => import("./ModelCanvas"), {
  ssr: false,
  loading: () => <Placeholder>Loading model…</Placeholder>,
});

function Placeholder({ children }) {
  return (
    <div className="grid h-full w-full place-items-center">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/35">
        {children}
      </span>
    </div>
  );
}

export default function ModelViewer({ src, caption, className = "" }) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(src);

  if (!url) return null;

  return (
    <figure className={`relative overflow-hidden rounded-2xl bg-panel/60 ring-1 ring-ink/10 ${className}`}>
      <div className="h-[22rem] sm:h-[26rem] md:h-[30rem] w-full">
        {failed ? (
          <Placeholder>Model unavailable</Placeholder>
        ) : (
          <ModelCanvas src={url} onFail={() => setFailed(true)} />
        )}
      </div>

      {!failed && (
        <span className="pointer-events-none absolute left-4 bottom-4 text-xs text-ink/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          Drag to rotate · scroll to zoom
        </span>
      )}

      {caption && (
        <figcaption className="border-t border-ink/10 px-5 py-3 text-sm text-ink/55">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
