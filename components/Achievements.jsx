"use client";

import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import FeedArchive from "./FeedArchive";
import { formatPosted, machineDate, splitFeed } from "@/lib/feed";

function When({ achievement, archived = false }) {
  const exact = formatPosted(achievement.postedAt);
  const machine = machineDate(achievement.postedAt);
  const tone = archived ? "text-ink/45" : "text-aurora2";

  const shown = archived ? exact || achievement.year : achievement.year || exact;

  if (!machine) {
    return <span className={`font-mono text-sm ${tone}`}>{shown}</span>;
  }

  return (
    <time dateTime={machine} title={exact} className={`font-mono text-sm ${tone}`}>
      {shown}
    </time>
  );
}

function Row({ achievement, archived = false }) {
  return (
    <li
      className={`grid gap-2 md:gap-8 items-baseline ${
        archived ? "md:grid-cols-[11rem_1fr] py-5" : "md:grid-cols-[9rem_1fr] py-6"
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <When achievement={achievement} archived={archived} />
        {achievement.tag && (
          <span className={`font-mono text-[11px] ${archived ? "text-ink/35" : "text-ink/40"}`}>
            {achievement.tag}
          </span>
        )}
      </div>
      <div>
        <h3
          className={`font-semibold tracking-[-0.01em] ${
            archived ? "text-ink/80 text-base" : "text-ink text-lg"
          }`}
        >
          {achievement.title}
        </h3>
        <p
          className={`text-sm mt-1.5 leading-relaxed max-w-2xl ${
            archived ? "text-ink/45" : "text-ink/55"
          }`}
        >
          {achievement.body}
        </p>
      </div>
    </li>
  );
}

export default function Achievements({ achievements = [], achievementSettings }) {
  const { recent, archived, hiddenCount, showArchive, archiveLabel } = splitFeed(
    achievements,
    achievementSettings,
    { fallback: { visibleCount: 4, archiveLabel: "Earlier achievements" } }
  );

  return (
    <section id="achievements" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Achievements"
      />

      {recent.length > 0 ? (
        <Reveal className="glass rounded-3xl px-6 md:px-10 py-4">
          <ul className="divide-y divide-ink/10">
            {recent.map((a, i) => (
              <Row key={a.title || i} achievement={a} />
            ))}
          </ul>
        </Reveal>
      ) : (
        <Reveal className="glass rounded-3xl px-6 md:px-10 py-10">
          <p className="text-sm text-ink/50">Nothing recorded here yet.</p>
        </Reveal>
      )}

      <FeedArchive
        id="achievement-archive"
        label={archiveLabel}
        items={archived}
        noun="achievement"
        nounPlural="achievements"
      >
        {(a, i) => <Row key={a.title || i} achievement={a} archived />}
      </FeedArchive>

      {!showArchive && hiddenCount > 0 && (
        <p className="mt-5 text-sm text-ink/40">
          {hiddenCount} older {hiddenCount === 1 ? "achievement is" : "achievements are"} kept on
          record and not shown here.
        </p>
      )}
    </section>
  );
}
