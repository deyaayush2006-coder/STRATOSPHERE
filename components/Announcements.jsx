"use client";

import Reveal from "./Reveal";
import SectionHeader from "./SectionHeader";
import FeedArchive from "./FeedArchive";
import { formatPosted, machineDate, splitFeed } from "@/lib/feed";

/* The updates feed, and the club's own record of them.
 *
 * Two different things are on the page here. The top of the section is the
 * feed: the pinned card and however many recent announcements the committee
 * has asked for in the dashboard. Underneath it is the archive, which holds
 * everything older — nothing is deleted when the visible count comes down, it
 * just folds away, and each entry keeps the moment it was posted.
 *
 * The splitting and the fold are shared with Achievements, which works the
 * same way. What is left here is only what an announcement looks like.
 */

// The free-text label is what the committee wrote; the timestamp is the truth.
// Showing both would read as a contradiction whenever the label says "Dates
// TBD", so the label leads and the timestamp is the quiet second line.
function Stamp({ announcement, className = "" }) {
  const exact = formatPosted(announcement.postedAt);
  const machine = machineDate(announcement.postedAt);

  if (!exact) {
    return (
      <span className={`font-mono text-[11px] text-ink/40 ${className}`}>{announcement.date}</span>
    );
  }

  return (
    <time
      {...(machine ? { dateTime: machine } : {})}
      title={`Posted ${exact}`}
      className={`font-mono text-[11px] text-ink/40 ${className}`}
    >
      {announcement.date || exact}
    </time>
  );
}

function Tag({ children, className = "" }) {
  if (!children) return null;
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2 ${className}`}>
      {children}
    </span>
  );
}

function FeedRow({ announcement }) {
  return (
    <li className="grid md:grid-cols-[9rem_1fr] gap-2 md:gap-8 py-6 items-baseline">
      <div className="flex flex-col gap-1.5">
        <Stamp announcement={announcement} />
        <Tag>{announcement.tag}</Tag>
      </div>
      <div>
        <h3 className="text-ink text-lg font-semibold tracking-[-0.01em]">{announcement.title}</h3>
        <p className="text-sm text-ink/55 mt-1.5 leading-relaxed max-w-2xl">{announcement.body}</p>
      </div>
    </li>
  );
}

/* An archived announcement shows the full timestamp rather than the label.
   By the time something is down here, "April 2026" has stopped being enough to
   place it against the others. */
function ArchiveRow({ announcement }) {
  const exact = formatPosted(announcement.postedAt);
  const machine = machineDate(announcement.postedAt);

  return (
    <li
      key={announcement.id || announcement.title}
      className="grid md:grid-cols-[11rem_1fr] gap-2 md:gap-8 py-5 items-baseline"
    >
      <div className="flex flex-col gap-1.5">
        {exact ? (
          <time
            {...(machine ? { dateTime: machine } : {})}
            className="font-mono text-[11px] text-ink/45"
          >
            {exact}
          </time>
        ) : (
          <span className="font-mono text-[11px] text-ink/45">{announcement.date}</span>
        )}
        <Tag className="text-aurora2/70">{announcement.tag}</Tag>
      </div>
      <div>
        <h3 className="text-ink/80 text-base font-semibold tracking-[-0.01em]">
          {announcement.title}
        </h3>
        <p className="text-sm text-ink/45 mt-1.5 leading-relaxed max-w-2xl">{announcement.body}</p>
      </div>
    </li>
  );
}

export default function Announcements({ announcements = [], announcementSettings }) {
  const { pinned, recent, archived, hiddenCount, showArchive, archiveLabel } = splitFeed(
    announcements,
    announcementSettings,
    { allowPinned: true, fallback: { archiveLabel: "Earlier announcements" } }
  );

  return (
    /* Little padding at the top, unlike every other section: this one opens
       directly under the reel, and the bottom quarter of that is already a
       mask fading the footage out into the page. The breathing room above the
       heading is that tail. A full py-24 on top of it read as a gap. */
    <section
      id="announcements"
      className="px-6 pt-4 md:pt-6 pb-24 md:pb-28 scroll-mt-28 max-w-6xl mx-auto"
    >
      <SectionHeader
        title="Announcements"
        blurb="Every club update in one place — the detail that does not fit in a caption, kept as an archive rather than a feed."
      />

      {pinned && (
        <Reveal className="relative glass-strong glass-blur rounded-3xl p-8 md:p-10 overflow-hidden mb-5">
          <span
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora2 to-transparent"
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-aurora2 border border-aurora2/30 rounded-full px-3 py-1">
              {pinned.tag}
            </span>
            <Stamp announcement={pinned} />
          </div>
          <h3 className="text-ink text-2xl md:text-3xl font-semibold mt-5 tracking-[-0.02em] leading-tight">
            {pinned.title}
          </h3>
          <p className="text-ink/65 mt-4 leading-relaxed max-w-3xl">{pinned.body}</p>
        </Reveal>
      )}

      {recent.length > 0 && (
        <Reveal className="glass rounded-3xl px-6 md:px-10 py-2">
          <ul className="divide-y divide-ink/10">
            {recent.map((a) => (
              <FeedRow key={a.id || a.title} announcement={a} />
            ))}
          </ul>
        </Reveal>
      )}

      {recent.length === 0 && !pinned && (
        <Reveal className="glass rounded-3xl px-6 md:px-10 py-10">
          <p className="text-sm text-ink/50">Nothing posted yet. Check back soon.</p>
        </Reveal>
      )}

      <FeedArchive
        id="announcement-archive"
        label={archiveLabel}
        items={archived}
        noun="announcement"
        nounPlural="announcements"
      >
        {(a) => <ArchiveRow key={a.id || a.title} announcement={a} />}
      </FeedArchive>

      {/* The archive switched off, but older announcements exist. Say so
          rather than letting them disappear without explanation. */}
      {!showArchive && hiddenCount > 0 && (
        <p className="mt-5 text-sm text-ink/40">
          {hiddenCount} older {hiddenCount === 1 ? "announcement is" : "announcements are"} kept on
          record and not shown here.
        </p>
      )}
    </section>
  );
}
