"use client";

import Image from "next/image";
import { useState } from "react";

export default function Cover({ src, alt, className, priority = false }) {
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
