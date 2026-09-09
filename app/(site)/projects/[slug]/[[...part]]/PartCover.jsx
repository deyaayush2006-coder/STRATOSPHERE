"use client";

import { useState } from "react";

/* An <img> that removes itself when the file is missing.
   Split into its own client component so the project page around it stays a
   server component — onError needs a browser, the rest of the page does not. */
export default function PartCover({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
