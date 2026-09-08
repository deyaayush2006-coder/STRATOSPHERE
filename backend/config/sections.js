/* The only keys the content API will read or write.
   An unknown key is a 404, so a typo in the dashboard can never quietly
   create a section the site does not render. Keep this in step with
   `aerospaceOP/src/content/defaults.js` on the frontend. */
const SECTIONS = {
  site: "object",           // backdrop image, hero video, logo
  about: "object",          // lead, body, pillars, facts
  contact: "object",        // email, phone, address, hours
  announcements: "array",
  achievements: "array",
  events: "array",
  projects: "array",
  memberCohorts: "array",   // committees by year; the `current` one is "the team"
  showcaseClips: "array",
  navLinks: "array",
  footerCols: "array",
};

const SECTION_KEYS = Object.keys(SECTIONS);

const isValidKey = (key) => Object.prototype.hasOwnProperty.call(SECTIONS, key);

/* Guards against an array landing in an object slot and vice versa — the
   components index into these shapes and would throw on the wrong one. */
function shapeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "object";
  return typeof value;
}

module.exports = { SECTIONS, SECTION_KEYS, isValidKey, shapeOf };
