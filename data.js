/* Section ids are rendered onto the matching components, so nav and
   footer links cannot drift from the real content. */
export const SECTIONS = {
  overview: "/#overview",
  announcements: "/#announcements",
  about: "/#about",
  showcase: "/#showcase",
  contact: "/#contact",

  members: "/#members",
  achievements: "/#achievements",
  events: "/#events",
  projects: "/#projects",
};

export const NAV_LINKS = [
  { label: "Home", href: SECTIONS.overview },
  { label: "Updates", href: SECTIONS.announcements },
  { label: "About", href: SECTIONS.about },
  { label: "Members", href: SECTIONS.members },
  { label: "Achievements", href: SECTIONS.achievements },
  { label: "Events", href: SECTIONS.events },
  { label: "Projects", href: SECTIONS.projects },
  { label: "Contact Us", href: SECTIONS.contact},
];

export const ABOUT = {
  lead: "Inspiring the next generation of engineers through innovation, collaboration, and cutting-edge technology.",
  body: [
    "The Aerospace Club at Jadavpur University is dedicated to fostering innovation, research, and practical learning in aerospace engineering and related fields.",
    "Reaching for the stars through innovation, collaboration, and cutting-edge aerospace technology.",
  ],
  /* two columns; a third entry would need a different grid */
  pillars: [
    {
      title: "Our Mission",
      body: "To inspire and educate the next generation of students through hands-on projects, research opportunities, and industry collaborations. We strive to bridge the gap between theoretical knowledge and practical application.",
    },
    {
      title: "Our Vision",
      body: "To become a leading aerospace research and development hub that contributes significantly to India's space program and aviation industry while nurturing innovative minds capable of solving tomorrow's aerospace challenges.",
    },
  ],
  facts: [
    { label: "Active Members", value: "60+" },
    { label: "Projects Completed", value: "5+" },
    { label: "Awards Won", value: "3+" },
    { label: "Years of Excellence", value: "3" },
  ],
};
export const SITE_BACKDROP = "/images/hero/ju-campus.jpg";
export const HERO_PHOTOS = [
  {
    src: "/images/hero/ju-campus.jpg",
    alt: "Aerial view of the Jadavpur University campus and surrounding Kolkata",
  },
];

/* Taken from the club's existing site. */
export const CONTACT = {
  email: "juaerospace.club@jadavpuruniversity.in",
  address: [
    "Aerospace Club, Mechanical Department",
    "Jadavpur University",
    "Kolkata - 700032",
  ],
  hours: [
    ["Monday - Friday", "9:00 AM - 6:00 PM"],
    ["Saturday", "10:00 AM - 2:00 PM"],
    ["Sunday", "Closed"],
  ],
};

/* Showcase clips, first entry is the featured one. Paths point at public/.
   Empty hides the section rather than showing dead players.
   { title, meta, src: "/videos/flight-01.mp4", poster: "/images/thumbnails/flight-01.jpg" } */
export const SHOWCASE_CLIPS = [];

export const MEMBERS = [
  { name: "Naman Ray", role: "Club President", dept: "Mechanical Engineering", image: "/images/team/naman-ray.jpg", linkedin: "https://www.linkedin.com/in/namanray" },
  { name: "Hritam Dey", role: "Club Vice-President", dept: "Mechanical Engineering", image: "/images/team/hritam-dey.jpg", linkedin: "https://www.linkedin.com/in/hritam-dey" },
  { name: "Prothoma Dutta", role: "Secretary", dept: "Mechanical Engineering", image: "/images/team/prothoma-dutta.jpg", linkedin: "https://www.linkedin.com/in/prothoma-dutta-4b7297329" },
  { name: "Avipso Sinha", role: "Treasurer", dept: "Mechanical Engineering", image: "/images/team/avipso-sinha.jpg", linkedin: "" },
  { name: "Divyansh Dutta", role: "Technical Chair", dept: "Electrical Engineering", image: "/images/team/divyansh-dutta.jpg", linkedin: "https://www.linkedin.com/in/divyansh-dutta-b93857297/" },
  { name: "Satyam Roy", role: "Management Lead", dept: "Mechanical Engineering", image: "/images/team/satyam-roy.jpg", linkedin: "" },
  { name: "Syed Zishan Aziz", role: "RC Plane & Drone Lead", dept: "Mechanical Engineering", image: "/images/team/syed-zishan-aziz.jpg", linkedin: "https://www.linkedin.com/in/syed-zishan-aziz-3a48a1286" },
  { name: "Priyanshu Kumar", role: "CanSat Lead", dept: "Mechanical Engineering", image: "/images/team/priyanshu-kumar.jpg", linkedin: "https://www.linkedin.com/in/priyanshu-kumar-924252313" },
  { name: "Swarnava Roy", role: "Event Lead", dept: "Mechanical Engineering", image: "/images/team/swarnava-roy.jpg", linkedin: "https://www.linkedin.com/in/swarnava-roy-277894336" },
  { name: "Kaulik Das", role: "Sponsorship Lead", dept: "Mechanical Engineering", image: "/images/team/kaulik-das.jpg", linkedin: "https://www.linkedin.com/in/kaulik-das-63273328b" },
  { name: "Debaditya Chaudhuri", role: "Publicity Chair", dept: "Mechanical Engineering", image: "/images/team/debaditya-chaudhuri.jpg", linkedin: "" },
  { name: "Shayan Charan", role: "Content Team Lead", dept: "Mechanical Engineering", image: "/images/team/shayan-charan.jpg", linkedin: "" },
  { name: "Ayurdyuti Ghosh", role: "Social Media Lead", dept: "Mechanical Engineering", image: "/images/team/ayurdyuti-ghosh.jpg", linkedin: "https://www.linkedin.com/in/ayurdyuti-ghosh-9b2b22335" },
  { name: "Souradip Daw", role: "OC Lead", dept: "Electrical Engineering", image: "/images/team/souradip-daw.jpg", linkedin: "https://www.linkedin.com/in/souradip-daw-535799351/" },
  { name: "Bornita Mandal", role: "OC Lead", dept: "Electrical Engineering", image: "/images/team/bornita-mandal.jpg", linkedin: "https://www.linkedin.com/in/bornita-mandal-377374321" },
  { name: "Sagnik Tripathy", role: "Membership Lead", dept: "Chemical Engineering", image: "/images/team/sagnik-tripathy.jpg", linkedin: "" },
];


/* One entry per academic year, oldest first — array order is screen order,
   so a new year goes on the end. Past years have no portraits, so `image`
   is left off and Avatar falls back to initials. */
const COMMITTEE_2022_23 = [
  { name: "Tridibesh Chattoraj", role: "Founder", email: "tridibeshchattoraj@gmail.com" },
  { name: "Soutrik Nag", role: "Founder", email: "soutriknag16@gmail.com" },
  { name: "Arnab Adhikary", role: "Founder", email: "arnabadk16@gmail.com" },
];

const COMMITTEE_2023_24 = [
  { name: "Bratish Sarkar", role: "President", email: "bejume24@gmail.com" },
  { name: "Aranya Subhra Naskar", role: "Secretary", email: "aranyasubhra118@gmail.com" },
  { name: "Himopravo Chowdhury", role: "Technical Lead", email: "himopravo9@gmail.com" },
  { name: "Swapnil Mahapatra", role: "Management Lead", email: "mhpneel2002@gmail.com" },
  { name: "Koustav Das", role: "WC Member", email: "das.koustav5432@gmail.com" },
  { name: "Dvij Dewan", role: "WC Member", email: "dvij.dewan@tegaindustries.com" },
  { name: "Mrinmay Tarafdar", role: "WC Member" },
  { name: "Navoneel Karmakar", role: "WC Member", email: "navoneelk@gmail.com" },
  { name: "Srija Mondal", role: "WC Member", email: "srija.mondal282@gmail.com" },
  { name: "Aditya Mandal", role: "WC Member", email: "adimandal005@gmail.com" },
];

const COMMITTEE_2024_25 = [
  { name: "Himopravo Chowdhury", role: "President", email: "himopravo9@gmail.com" },
  { name: "Amrita Dasgupta", role: "Vice President", email: "amritadasgupta04@gmail.com" },
  { name: "Srija Mondal", role: "Convenor", email: "srija.mondal282@gmail.com" },
  { name: "Navoneel Karmakar", role: "Technical Lead", email: "navoneelk@gmail.com" },
  { name: "Koustav Das", role: "Management Lead", email: "das.koustav5432@gmail.com" },
  { name: "Aditya Mandal", role: "Tools & Equipment Manager", email: "adimandal005@gmail.com" },
  { name: "Soumyadeep Mandal", role: "Technical Advisor" },
  { name: "Suman Sowmondal", role: "OC Member", email: "sumansowmondal26@gmail.com" },
  { name: "Debadrita Hazra", role: "OC Member", email: "debadritahazra007@gmail.com" },
  { name: "Soumyojit Biswas", role: "OC Member" },
  { name: "Samriddha Chakraborty", role: "OC Member" },
  { name: "Arijit Bose", role: "OC Member", email: "arijitbose205@gmail.com" },
];

const COMMITTEE_2025_26 = [
  { name: "Navoneel Karmakar", role: "President", email: "navoneelk@gmail.com" },
  { name: "Koustav Das", role: "Vice President", email: "das.koustav5432@gmail.com" },
  { name: "Aditya Mandal", role: "Convenor", email: "adimandal005@gmail.com" },
  { name: "Sayan Laha", role: "Technical Lead (Circuital)", email: "sayanlaha47@gmail.com" },
  { name: "Prothoma Dutta", role: "Technical Lead (Structural)" },
  { name: "Debadrita Hazra", role: "Management Lead", email: "debadritahazra007@gmail.com" },
  { name: "Naman Ray", role: "Sponsorship Lead" },
  { name: "Soumyojit Biswas", role: "OC Member (Tools Management)" },
  { name: "Soham Sharma Sarkar", role: "OC Member (Tools Management)" },
  { name: "Samriddha Chakraborty", role: "OC Member (Event Management)" },
  { name: "Avipso Sinha", role: "OC Member (Event Management)" },
  { name: "Kaulik Das", role: "OC Member (Social Media Handle)", email: "kaulikdas2017@gmail.com" },
  { name: "Shayan Charan", role: "OC Member (Social Media Handle)" },
];

/* Oldest first — the section starts here and works forward. */
export const MEMBER_COHORTS = [
  { year: "2022–23", tag: "Founded", blurb: "Three founders started the club in the Mechanical Department.", members: COMMITTEE_2022_23 },
  { year: "2023–24", tag: "First committee", blurb: "The first full working committee took shape.", members: COMMITTEE_2023_24 },
  { year: "2024–25", tag: "Growth", blurb: "The committee widened and picked up dedicated tools and advisory roles.", members: COMMITTEE_2024_25 },
  { year: "2025–26", tag: "Specialised", blurb: "Technical leadership split into circuital and structural tracks.", members: COMMITTEE_2025_26 },
  { year: "2026–27", tag: "Current", current: true, blurb: "Sixteen students from Mechanical, Electrical and Chemical Engineering run the club today.", members: MEMBERS },
];

/* How much of the results list the home page shows. Same rule as the
 * announcements feed: nothing is deleted when the number comes down, the rest
 * fold into the archive underneath. Four rather than three, so the list still
 * reaches back past the current season on a fresh install.
 * Set in the dashboard under "Achievement display". */
export const ACHIEVEMENT_SETTINGS = {
  visibleCount: 4,
  showArchive: true,
  archiveLabel: "Earlier achievements",
};

/* `postedAt` is the real moment and the sort key; `year` is the label the row
   shows, which is often just "2025". */
export const ACHIEVEMENTS = [
  {
    year: "January 2025",
    tag: "Competition",
    title: "NSSC Contingent Award 2025",
    postedAt: "2025-01-27T11:15:00.000Z",
    body: "The club represented Jadavpur University at the National Students Space Challenge at IIT Kharagpur. The team won the Contingent Award for exceptional participation, teamwork, and innovation in aerospace competitions.",
  },
  {
    year: "2025",
    tag: "Research",
    title: "Aircraft Design Projects (V-tail & H-tail)",
    postedAt: "2025-08-20T09:00:00.000Z",
    body: "The team finished detailed aerodynamic and structural designs for both V-tail and H-tail aircraft configurations. These projects serve as stepping stones for participation in the National Aeromodelling Competition 2025-26, highlighting the commitment to research and design.",
  },
  {
    year: "2025",
    tag: "Competition",
    title: "Technical Events: Jal Astra & Skysprint",
    postedAt: "2025-04-19T17:00:00.000Z",
    body: "The club successfully organized two large-scale aeromodelling events. Both events attracted over 100 team registrations, providing hands-on learning experiences and promoting excitement for aerospace across campus.",
  },
  {
    year: "April 2025",
    tag: "Recognition",
    title: "Seminar on Aerospace Engineering",
    postedAt: "2025-04-10T12:00:00.000Z",
    body: "The club conducted a seminar for over 200+ undergraduate students.",
  },
  {
    year: "2024",
    tag: "Innovation",
    title: "RC Plane 1.0, Design & Manufacturing",
    postedAt: "2024-11-15T10:00:00.000Z",
    body: "The club successfully completed its first fully functional RC aircraft, built entirely in-house. The project included conceptual design, fuselage and wing construction, electronic installation, and test flights. It demonstrated the skills of the team in aeromodelling and systems integration.",
  },
];

export const EVENTS = [
  {
    when: "upcoming",
    date: "TBD",
    time: "TBD",
    title: "SkySprint 2026",
    location: "JU, Salt Lake Ground",
    body: "An event that challenges participants to master the delicate balance of aerodynamics and structural engineering.",
    image: "/images/events/skysprint-2026.jpg",
  },
  {
    when: "upcoming",
    date: "TBD",
    time: "TBD",
    title: "JalAstra 2026",
    location: "Football Ground, JU Campus",
    body: "An exciting water rocket competition where teams design and build rockets using water bottles.",
    image: "/images/events/jalastra-2026.jpg",
  },
  {
    when: "past",
    date: "2 April 2026",
    time: "TBD",
    title: "Wind-Craft — A Motorised Glider Workshop",
    location: "Mechanical Engineering Department, JU",
    body: "Master the mechanics of flight with a hands-on motorised glider building experience.",
    image: "/images/events/windcraft-workshop.jpg",
  },
  {
    when: "past",
    date: "19 April 2025",
    time: "10:00 AM - 5:00 PM",
    title: "JalAstra",
    location: "JU, Salt Lake Ground",
    body: "An exciting water rocket competition where teams design and build rockets using water bottles, highlighting creativity, engineering skills, and aerodynamic design in this thrilling showcase of talent at Srijan 2025.",
    image: "/images/events/jalastra-2025.jpg",
  },
  {
    when: "past",
    date: "19 April 2025",
    time: "10:00 AM - 4:00 PM",
    title: "SkySprint",
    location: "Sports Ground",
    body: "An exhilarating competitive event that challenges participants to master the delicate balance of aerodynamics and structural engineering. The core of the competition involves designing and fabricating custom gliders, often using lightweight materials like balsa wood, foam, or composites, to achieve peak flight performance.",
    image: "/images/events/skysprint-2025.jpg",
  },
];
/* How much of the feed the home page shows.
 *
 * Nothing is ever thrown away: every announcement stays in the table with the
 * moment it was posted. `visibleCount` only decides how many of the newest
 * ones are on the page, and the rest fold into the archive underneath.
 * The committee changes this in the dashboard under "Announcement display". */
export const ANNOUNCEMENT_SETTINGS = {
  visibleCount: 3,
  showArchive: true,
  archiveLabel: "Earlier announcements",
};

/* `postedAt` is the real timestamp and the sort key; `date` is the free-text
   label the card actually shows, which is often "Dates TBD" rather than a
   date at all. Keeping them apart is what lets the archive stay in order
   while the cards still read the way the committee wrote them. */
export const ANNOUNCEMENTS = [
  {
    id: "windcraft-2026",
    date: "April 2026",
    postedAt: "2026-04-02T14:30:00.000Z",
    tag: "Recap",
    title: "Windcraft: our first-ever glider making session",
    body:
      "The Windcraft workshop marked a remarkable beginning for the Stratosphere Club — its first glider making session, and a considerable success. Participants cut depron, shaped each component, soldered the electronics and glued the parts at set angles, then left with a glider they had built themselves. Our thanks to the professors, organisers and participants whose effort made it work, and to the OCs and OG participants for their constant support. More workshops will follow.",
    pinned: true,
  },
  {
    id: "season-2026",
    date: "Dates TBD",
    postedAt: "2026-05-18T09:00:00.000Z",
    tag: "Upcoming",
    title: "SkySprint 2026 and JalAstra 2026 are being planned",
    body:
      "Two events return this season. SkySprint asks teams to balance aerodynamics against structure and fabricate a glider that flies; JalAstra is the water rocket competition, run on the football ground. Both drew over a hundred team registrations last time. Dates and registration are still being finalised — watch this space.",
  },
  {
    id: "nssc-2025",
    date: "January 2025",
    postedAt: "2025-01-27T11:15:00.000Z",
    tag: "Result",
    title: "Contingent Award at NSSC 2025, IIT Kharagpur",
    body:
      "The club represented Jadavpur University at the National Students' Space Challenge and took the Contingent Award for participation, teamwork and innovation across the competitions.",
  },
];
export const PROJECTS = [
  {
    slug: "cansat",
    n: "01",
    title: "CanSat",
    status: "Ongoing",
    timeline: "Jan 2025 - Ongoing",
    summary: "Managing a full mission life cycle, from Preliminary Design Review to post-flight data analysis.",
    body: "The main task is to manage a mission life cycle, from the Preliminary Design Review (PDR) to post-flight data analysis, mirroring the rigorous standards of the global aerospace industry.",
    image: "/images/projects/cansat.jpg",
    /* each entry gets its own page at /projects/cansat/<slug> */
    parts: [],
  },
  {
    slug: "epsilon-model",
    n: "02",
    title: "3D Printed Epsilon Model Development",
    status: "Ongoing",
    timeline: "Feb 2026 - Present",
    summary: "A high-fidelity scaled replica of the Epsilon launch vehicle, built by additive manufacturing.",
    body: "Project focuses on developing a high-fidelity scaled replica of the Epsilon launch vehicle, utilizing additive manufacturing to achieve complex aerodynamic geometries and internal structural ribbing, integrating lightweight PLA or PETG materials.",
    image: "/images/projects/epsilon-model.jpg",
    parts: [],
  },
  {
    slug: "f22-raptor",
    n: "03",
    title: "F22 Raptor RC Model",
    status: "Ongoing",
    timeline: "Jan 2026 - Ongoing",
    summary: "A 3D-printed airframe on a high-thrust EDF system, mimicking fifth-generation stealth geometry.",
    body: "A lightweight, 3D-printed airframe and a high-thrust EDF (Electric Ducted Fan) system. By utilizing thin-wall printing techniques and carbon-fiber reinforcements, the model mimics the stealth geometry and aerodynamic stability of the fifth-generation fighter for both high-speed passes and low-speed high-alpha flight.",
    image: "/images/projects/f22-raptor.jpg",
    parts: [],
  },
];

export const FOOTER_COLS = [
  {
    title: "Useful Links",
    links: [
      { label: "Home", href: SECTIONS.overview },
      { label: "About", href: SECTIONS.about },
      { label: "Members", href: SECTIONS.members },
      { label: "Achievements", href: SECTIONS.achievements },
      { label: "Events", href: SECTIONS.events },
      { label: "Projects", href: SECTIONS.projects },
    ],
  },
];
