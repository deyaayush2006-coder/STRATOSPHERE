"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Label from "./Label";
import SpotlightCard from "./SpotlightCard";
import { isOptimisable, mediaUrl } from "@/lib/media-url";

// One Learn article as a card: cover, series part or level, title, summary,
// date and reading time. `meta` is worked out on the server and passed in.
export default function ArticleCard({ article, part = null, minutes = 1, date = "" }) {
  const [failed, setFailed] = useState(false);
  const cover = article.cover && !failed ? mediaUrl(article.cover) : "";
  const tag = part ? `Part ${part}` : article.level || "Article";

  return (
    <SpotlightCard
      as="article"
      className="group h-full flex flex-col glass rounded-2xl overflow-hidden hover:border-aurora2/30 hover:-translate-y-1 transition-[border-color,translate] duration-200"
    >
      <span
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2/70 to-transparent opacity-0 group-hover:opacity-100 transition duration-200 z-10"
        aria-hidden="true"
      />

      <Link href={`/learn/${article.slug}`} className="flex grow flex-col">
        <div className="relative w-full aspect-video overflow-hidden bg-panel">
          {cover ? (
            <Image
              src={cover}
              alt=""
              fill
              loading="lazy"
              sizes="(max-width: 640px) 88vw, (max-width: 1024px) 45vw, 380px"
              unoptimized={!isOptimisable(article.cover)}
              onError={() => setFailed(true)}
              className="object-cover transition duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center bg-gradient-to-br from-aurora2/15 via-panel to-ink/5"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink/35">
                {article.series || "Learn"}
              </span>
            </div>
          )}
        </div>

        <div className="flex grow flex-col p-7">
          <div className="flex flex-wrap items-center gap-2.5">
            <Label dot>{tag}</Label>
            {part && article.level && <Label muted>{article.level}</Label>}
          </div>

          <h3 className="text-ink text-[17px] font-semibold mt-4 tracking-[-0.01em] leading-snug">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-sm text-ink/55 mt-3 leading-relaxed line-clamp-3">{article.summary}</p>
          )}

          <p className="mt-auto pt-5 font-mono text-[11px] text-ink/40">
            {[date, `${minutes} min read`].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
    </SpotlightCard>
  );
}
