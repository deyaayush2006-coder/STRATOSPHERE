import {
  ABOUT,
  ACHIEVEMENT_SETTINGS,
  ACHIEVEMENTS,
  ANNOUNCEMENT_SETTINGS,
  ANNOUNCEMENTS,
  CONTACT,
  EVENTS,
  FOOTER_COLS,
  HERO_PHOTO,
  MEMBER_COHORTS,
  MEMORIES,
  NAV_LINKS,
  PROJECTS,
  SHOWCASE_CLIPS,
  SPONSORS,
} from "../data.js";

export const DEFAULT_CONTENT = {
  site: {
    logo: "/1674144810258.jpg",
    heroPhoto: HERO_PHOTO,
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
  memories: MEMORIES,
  sponsors: SPONSORS,
  navLinks: NAV_LINKS,
  footerCols: FOOTER_COLS,
};

export const JSON_SECTIONS = [
  "site",
  "about",
  "contact",
  "showcaseClips",
  "memories",
  "sponsors",
  "navLinks",
  "footerCols",
  "announcementSettings",
  "achievementSettings",
];

