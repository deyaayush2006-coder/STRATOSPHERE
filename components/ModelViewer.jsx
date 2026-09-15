"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { mediaUrl } from "@/lib/media-url";

/* An interactive CAD model, on the page.
 *
 * three.js, its loaders and drei come to about half a megabyte, and nothing
 * else on the site needs any of it — so the renderer is a separate chunk that
 * is fetched only when a project actually has a model on it, and never on the
 * server. ssr:false is doing the second half of that: a WebGL canvas has
 * nothing to render into during a server pass, and importing three there just
 * slows every build down.
 */
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
      {/* A fixed height, not an aspect ratio. The canvas frames whatever it is
          given, so the box does not need to match the model — and on a phone
          an aspect-video box would leave an aircraft about eighty pixels tall. */}
      <div className="h-[22rem] sm:h-[26rem] md:h-[30rem] w-full">
        {failed ? (
          <Placeholder>Model unavailable</Placeholder>
        ) : (
          <ModelCanvas src={url} onFail={() => setFailed(true)} />
        )}
      </div>

      {/* The hint is the whole feature: nobody drags a picture. It sits over
          the canvas and takes no pointer events, so it never eats the first
          grab — which is exactly the one it is asking for. */}
      {!failed && (
        <span className="pointer-events-none absolute left-4 bottom-4 rounded-full bg-base/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/55 backdrop-blur-sm">
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
