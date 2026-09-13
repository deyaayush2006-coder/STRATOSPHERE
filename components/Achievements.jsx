"use client";

import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import FeedArchive from "./FeedArchive";
import { formatPosted, machineDate, splitFeed } from "@/lib/feed";

/* The results list, kept the same way the announcements feed is kept.
 *
 * Every achievement stays on record with the moment it happened. How many of
 * the most recent ones reach the page is set in the dashboard, and the rest
 * fold into the archive underneath rather than being lost.
 *
 * No featured entry here, unlike announcements. A pinned card needs somewhere
 * to be featured, and this section is a list rather than a set of cards — so
 * the idea is switched off at the split rather than half-built.
 */

// The committee writes "January 2025" or just "2025"; the timestamp is what
// actually orders the list. The label leads because it is what they meant.
function When({ achievement, archived = false }) {
  const exact = formatPosted(achievement.postedAt);
  const machine = machineDate(achievement.postedAt);
  const tone = archived ? "text-ink/45" : "text-aurora2";

  /* Down in the archive the free-text label stops being enough to place an
     entry against the others, so the full timestamp takes over from it. */
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
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35">
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
        blurb="Competitions entered, events run, aircraft finished — and what came of each."
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
