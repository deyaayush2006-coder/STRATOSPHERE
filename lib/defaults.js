/* The bundled copy of every editable section.
 *
 * These are what the site renders before Supabase answers, and what it keeps
 * rendering if a table is still empty or the project is unreachable. So the
 * club site is never blank and never depends on the database being up — the
 * dashboard only ever *overrides* what is here.
 *
 * `supabase/seed.mjs` imports this same file to fill a fresh project, so the
 * defaults and the seed can never drift apart.
 */
import {
  ABOUT,
  ACHIEVEMENT_SETTINGS,
  ACHIEVEMENTS,
  ANNOUNCEMENT_SETTINGS,
  ANNOUNCEMENTS,
  CONTACT,
  EVENTS,
  FOOTER_COLS,
  HERO_PHOTOS,
  MEMBER_COHORTS,
  NAV_LINKS,
  PROJECTS,
  SHOWCASE_CLIPS,
  SITE_BACKDROP,
} from "../data.js";

export const DEFAULT_CONTENT = {
  /* Site-wide media that used to be hardcoded in the components. */
  site: {
    backdrop: SITE_BACKDROP,
    heroVideo: "/vid.mp4",
    logo: "/1674144810258.jpg",
    heroPhotos: HERO_PHOTOS,
  },
  about: ABOUT,
  contact: CONTACT,
  announcements: ANNOUNCEMENTS,
  announcementSettings: ANNOUNCEMENT_SETTINGS,
  achievements: ACHIEVEMENTS,
  achievementSettings: ACHIEVEMENT_SETTINGS,
  events: EVENTS,
  projects: PROJECTS,
  memberCohorts: MEMBER_COHORTS,
  showcaseClips: SHOWCASE_CLIPS,
  navLinks: NAV_LINKS,
  footerCols: FOOTER_COLS,
};

/* The sections kept as one jsonb document each, rather than as rows.
   Everything not listed here has a table of its own. */
export const JSON_SECTIONS = [
  "site",
  "about",
  "contact",
  "showcaseClips",
  "navLinks",
  "footerCols",
  "announcementSettings",
  "achievementSettings",
];

export const SECTION_KEYS = Object.keys(DEFAULT_CONTENT);
