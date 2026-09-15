"use client";

import Image from "next/image";
import { useState } from "react";

/* The cover image at the top of a project part, which removes itself when the
   file is missing.
 *
 * Split into its own client component so the project page around it stays a
 * server component — onError needs a browser, the rest of the page does not.
 *
 * The intrinsic size is the 16:9 the class crops to rather than the file's own
 * dimensions: next/image only needs a ratio to reserve the right box before
 * the bytes land, and the real file is whatever a member exported. `sizes`
 * is what stops a phone downloading the desktop-width version — the image is
 * full-bleed inside a 6xl column, so it is the viewport width up to 1152px and
 * never more than that. */
export default function PartCover({ src, alt, className, priority = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      sizes="(max-width: 1200px) 100vw, 1152px"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
