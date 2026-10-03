import {
  ABOUT,
  ACHIEVEMENT_SETTINGS,
  ACHIEVEMENTS,
  ANNOUNCEMENT_SETTINGS,
  ANNOUNCEMENTS,
  CONTACT,
  EVENTS,
  FOOTER_COLS,
  HERO_SLIDES,
  MEMBER_COHORTS,
  NAV_LINKS,
  PROJECTS,
  SHOWCASE_CLIPS,
  SPONSORS,
} from "../data.js";

export const DEFAULT_CONTENT = {
  site: {
    logo: "/1674144810258.jpg",
    heroSlides: HERO_SLIDES,
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
  sponsors: SPONSORS,
  navLinks: NAV_LINKS,
  footerCols: FOOTER_COLS,
};

export const JSON_SECTIONS = [
  "site",
  "about",
  "contact",
  "showcaseClips",
  "sponsors",
  "navLinks",
  "footerCols",
  "announcementSettings",
  "achievementSettings",
];

