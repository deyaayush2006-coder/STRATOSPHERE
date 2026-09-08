/* The bundled copy of every editable section.
 *
 * These are what the site renders before the API answers, and what it keeps
 * rendering if the API is down or a section has never been edited. So the
 * club site is never blank and never depends on the backend being up — the
 * dashboard only ever *overrides* what is here.
 *
 * `backend/scripts/seed.mjs` imports this same file to fill a fresh database,
 * so the defaults and the seed can never drift apart.
 */
import {
  ABOUT,
  ACHIEVEMENTS,
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
} from "../../data.js";

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
  achievements: ACHIEVEMENTS,
  events: EVENTS,
  projects: PROJECTS,
  memberCohorts: MEMBER_COHORTS,
  showcaseClips: SHOWCASE_CLIPS,
  navLinks: NAV_LINKS,
  footerCols: FOOTER_COLS,
};

/* Section order and labels for the dashboard sidebar. Keep in step with
   `backend/config/sections.js`, which is what the API will accept. */
export const SECTION_KEYS = Object.keys(DEFAULT_CONTENT);
