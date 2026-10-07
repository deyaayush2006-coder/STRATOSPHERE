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
  lead: "From gliders to drones, we reach for the unknown.",
  body: [
    "Stratosphere is the aerospace club of Jadavpur University, founded in the 2022–23 session by three students in the Mechanical Engineering department. We design and build RC planes, gliders and drones, run hands-on sessions on 3D printing and PCB design, and organise JalAstra and SkySprint at Srijan, the university's techno-management fest.",
    "Next on the list is a CanSat: a working satellite the size of a soft-drink can.",
  ],
  pillars: [
    {
      title: "Our Mission",
      body: "Give JU students a place to build things that fly, not just study them. Members learn design, fabrication, electronics and flight testing on the club's own aircraft, rockets and satellites, and take that work to competitions like NSSC at IIT Kharagpur.",
    },
    {
      title: "Our Vision",
      body: "A design–build–fly programme that carries over from one batch to the next, where each committee hands on its designs, tools and lessons so every year starts further along than the last.",
    },
  ],
  facts: [
    { label: "Active Members", value: "60+" },
    { label: "Awards Won", value: "3+" },
    { label: "Years Active", value: "4" },
  ],
};
// Aerial view of the Jadavpur University campus and surrounding Kolkata.
export const HERO_PHOTO = "/images/hero/ju-campus.jpg";

export const CONTACT = {
  email: "juaerospace.club@jadavpuruniversity.in",
  phone: "",
  blurb:
    "Stratosphere is the Aerospace Club of Jadavpur University — students who design and build gliders, RC planes, drones and rockets, and run workshops and competitions on campus.",
  address: [
    "Aerospace Club, Mechanical Department",
    "Jadavpur University",
    "Kolkata - 700032",
  ],
  socials: [
    { platform: "instagram", url: "https://www.instagram.com/aerospace_club_ju", label: "" },
    { platform: "linkedin", url: "https://www.linkedin.com/company/aerospace-club-ju/", label: "" },
    { platform: "facebook", url: "https://www.facebook.com/share/1EN7zWxE6i/", label: "" },
  ],
};

export const SHOWCASE_CLIPS = [];

// From the club's shared Drive folder. Captions describe what is in frame;
// `event` is the Drive folder the photo came from.
export const MEMORIES = [
  { src: "/images/memories/water-rocket-liftoff.jpg", width: 828, height: 462, event: "Water rockets", caption: "Water rocket lift-off" },
  { src: "/images/memories/srijan-2026-gliders.jpg", width: 1600, height: 1200, event: "Srijan 2026", caption: "Walking out with the gliders" },
  { src: "/images/memories/robozonix-drone-build.jpg", width: 1600, height: 1200, event: "Robozonix", caption: "Wiring up a drone frame" },
  { src: "/images/memories/kshitij-2026-team.jpg", width: 1200, height: 1600, event: "Kshitij 2026", caption: "Team photo" },
  { src: "/images/memories/nssc-best-contingent.jpg", width: 1280, height: 960, event: "NSSC, IIT Kharagpur", caption: "Trophies, medals and the Best Contingent certificate" },
  { src: "/images/memories/srijan-2026-launch-tower.jpg", width: 1200, height: 1600, event: "Srijan 2026", caption: "A glider leaves the launch tower" },
  { src: "/images/memories/robozonix-evening-flight.jpg", width: 1600, height: 900, event: "Robozonix", caption: "Evening flight on the field" },
  { src: "/images/memories/windcraft-2026-team.jpg", width: 1600, height: 1200, event: "WindCraft 2026", caption: "Gliders built at the workshop" },
  { src: "/images/memories/kshitij-2026-wing.jpg", width: 1600, height: 1200, event: "Kshitij 2026", caption: "Wing work on the grass" },
  { src: "/images/memories/robozonix-quad-frames.jpg", width: 1600, height: 1200, event: "Robozonix", caption: "Quadcopter frames on the bench" },
  { src: "/images/memories/srijan-2026-launch-pad.jpg", width: 1600, height: 1200, event: "Srijan 2026", caption: "Setting a rocket on the launch pad" },
  { src: "/images/memories/windcraft-2026-sighting.jpg", width: 1600, height: 1200, event: "WindCraft 2026", caption: "Sighting down a glider" },
  { src: "/images/memories/kshitij-2026-station.jpg", width: 900, height: 1600, event: "Kshitij 2026", caption: "Bags packed at the station" },
  { src: "/images/memories/robozonix-full-hall.jpg", width: 1600, height: 902, event: "Robozonix", caption: "A full hall" },
  { src: "/images/memories/nssc-certificate.jpg", width: 1280, height: 960, event: "NSSC, IIT Kharagpur", caption: "With the trophy and certificate" },
  { src: "/images/memories/windcraft-2026-glider.jpg", width: 1600, height: 1200, event: "WindCraft 2026", caption: "A finished glider" },
  { src: "/images/memories/water-rocket-field.jpg", width: 1280, height: 720, event: "Water rockets", caption: "Lift-off on the field" },
  { src: "/images/memories/windcraft-2026-participants.jpg", width: 1600, height: 1200, event: "WindCraft 2026", caption: "Participants with their gliders" },
  { src: "/images/memories/water-rocket-model.jpg", width: 960, height: 1280, event: "Water rockets", caption: "A finished water rocket" },
  { src: "/images/memories/robozonix-kit-assembly.jpg", width: 1600, height: 1200, event: "Robozonix", caption: "Kit assembly at the tables" },
  { src: "/images/memories/windcraft-2026-floor.jpg", width: 1600, height: 1200, event: "WindCraft 2026", caption: "A glider on the workshop floor" },
  { src: "/images/memories/water-rocket-pad.jpg", width: 1280, height: 960, event: "Water rockets", caption: "Rocket on the pad" },
];

export const SPONSORS = [
  { name: "SOLIDWORKS", logo: "/images/sponsors/solidworks-logo.svg", url: "https://www.solidworks.com", plate: true },
  { name: "Ansys", logo: "/images/sponsors/ansys-logo.svg", url: "https://www.ansys.com", plate: true },
  { name: "Marcopolo Products", logo: "/images/sponsors/marcopolo-logo.png", url: "https://marcopolo.co.in", plate: true },
  { name: "JU Alumni Association, Hyderabad Chapter (JUAAH)", logo: "/images/sponsors/juaah-logo.jpg", url: "https://jualumnihyd.in", plate: true },
  { name: "JU Mechanical Engineering Alumni Association (JUMEAA)", logo: "/images/sponsors/jumeaa-logo.png", url: "https://jumeaa.org", plate: true },
  { name: "JUCEAA", logo: "", url: "", plate: false },
];

export const MEMBERS = [
  { name: "Naman Ray", role: "Club President", dept: "Mechanical Engineering", image: "/images/team/naman-ray.jpg", linkedin: "https://www.linkedin.com/in/namanray" },
  { name: "Hritam Dey", role: "Club Vice-President", dept: "Mechanical Engineering", image: "/images/team/hritam-dey.jpg", linkedin: "https://www.linkedin.com/in/hritam-dey" },
  { name: "Prothoma Dutta", role: "Secretary", dept: "Mechanical Engineering", image: "/images/team/prothoma-dutta.jpg", linkedin: "https://www.linkedin.com/in/prothoma-dutta-4b7297329" },
  { name: "Avipso Sinha", role: "Treasurer", dept: "Mechanical Engineering", image: "/images/team/avipso-sinha.jpg", linkedin: "" },
  { name: "Divyansh Dutta", role: "Technical Chair", dept: "Electrical Engineering", image: "/images/team/divyansh-dutta.jpg", linkedin: "https://www.linkedin.com/in/divyansh-dutta-b93857297/" },
  { name: "Satyam Roy", role: "Management Lead", dept: "Mechanical Engineering", image: "/images/team/satyam-roy.jpg", linkedin: "" },
  { name: "Syed Zishan Aziz", role: "RC Plane & Drone Lead", dept: "Mechanical Engineering", image: "/images/team/syed-zishan-aziz.jpg", linkedin: "https://www.linkedin.com/in/syed-zishan-aziz-3a48a1286" },
  { name: "Priyanshu Kumar", role: "CanSat Lead", dept: "Mechanical Engineering", image: "/images/team/priyanshu-kumar.jpg", linkedin: "https://www.linkedin.com/in/priyanshu-kumar-924252313" },
  { name: "Swarnava Roy", role: "Event Lead", dept: "Electrical Engineering", image: "/images/team/swarnava-roy.jpg", linkedin: "https://www.linkedin.com/in/swarnava-roy-277894336" },
  { name: "Kaulik Das", role: "Sponsorship Lead", dept: "Mechanical Engineering", image: "/images/team/kaulik-das.jpg", linkedin: "https://www.linkedin.com/in/kaulik-das-63273328b" },
  { name: "Debaditya Chaudhuri", role: "Publicity Chair", dept: "Mechanical Engineering", image: "/images/team/debaditya-chaudhuri.jpg", linkedin: "" },
  { name: "Shayan Charan", role: "Content Team Lead", dept: "Mechanical Engineering", image: "/images/team/shayan-charan.jpg", linkedin: "" },
  { name: "Ayurdyuti Ghosh", role: "Social Media Lead", dept: "Mechanical Engineering", image: "/images/team/ayurdyuti-ghosh.jpg", linkedin: "https://www.linkedin.com/in/ayurdyuti-ghosh-9b2b22335" },
  { name: "Souradip Daw", role: "OC Lead", dept: "Electrical Engineering", image: "/images/team/souradip-daw.jpg", linkedin: "https://www.linkedin.com/in/souradip-daw-535799351/" },
  { name: "Bornita Mandal", role: "OC Lead", dept: "Electrical Engineering", image: "/images/team/bornita-mandal.jpg", linkedin: "https://www.linkedin.com/in/bornita-mandal-377374321" },
  { name: "Sagnik Tripathy", role: "Membership Lead", dept: "Chemical Engineering", image: "/images/team/sagnik-tripathy.jpg", linkedin: "" },
];

const COMMITTEE_2022_23 = [
  { name: "Tridibesh Chattoraj", role: "Founder" },
  { name: "Soutrik Nag", role: "Founder" },
  { name: "Arnab Adhikary", role: "Founder" },
];

const COMMITTEE_2023_24 = [
  { name: "Bratish Sarkar", role: "President" },
  { name: "Aranya Subhra Naskar", role: "Secretary" },
  { name: "Himopravo Chowdhury", role: "Technical Lead" },
  { name: "Swapnil Mahapatra", role: "Management Lead" },
  { name: "Koustav Das", role: "WC Member" },
  { name: "Dvij Dewan", role: "WC Member" },
  { name: "Mrinmay Tarafdar", role: "WC Member" },
  { name: "Navoneel Karmakar", role: "WC Member" },
  { name: "Srija Mondal", role: "WC Member" },
  { name: "Aditya Mandal", role: "WC Member" },
];

const COMMITTEE_2024_25 = [
  { name: "Himopravo Chowdhury", role: "President" },
  { name: "Amrita Dasgupta", role: "Vice President" },
  { name: "Srija Mondal", role: "Convenor" },
  { name: "Navoneel Karmakar", role: "Technical Lead" },
  { name: "Koustav Das", role: "Management Lead" },
  { name: "Aditya Mandal", role: "Tools & Equipment Manager" },
  { name: "Soumyadeep Mandal", role: "Technical Advisor" },
  { name: "Suman Sowmondal", role: "OC Member" },
  { name: "Debadrita Hazra", role: "OC Member" },
  { name: "Soumyojit Biswas", role: "OC Member" },
  { name: "Samriddha Chakraborty", role: "OC Member" },
  { name: "Arijit Bose", role: "OC Member" },
];

const COMMITTEE_2025_26 = [
  { name: "Navoneel Karmakar", role: "President" },
  { name: "Koustav Das", role: "Vice President" },
  { name: "Aditya Mandal", role: "Convenor" },
  { name: "Sayan Laha", role: "Technical Lead (Circuital)" },
  { name: "Prothoma Dutta", role: "Technical Lead (Structural)" },
  { name: "Debadrita Hazra", role: "Management Lead" },
  { name: "Naman Ray", role: "Sponsorship Lead" },
  { name: "Soumyojit Biswas", role: "OC Member (Tools Management)" },
  { name: "Soham Sharma Sarkar", role: "OC Member (Tools Management)" },
  { name: "Samriddha Chakraborty", role: "OC Member (Event Management)" },
  { name: "Avipso Sinha", role: "OC Member (Event Management)" },
  { name: "Kaulik Das", role: "OC Member (Social Media Handle)" },
  { name: "Shayan Charan", role: "OC Member (Social Media Handle)" },
];

export const MEMBER_COHORTS = [
  { year: "2022–23", tag: "Founded", blurb: "Three founders started the club in the Mechanical Department.", members: COMMITTEE_2022_23 },
  { year: "2023–24", tag: "First committee", blurb: "The first full working committee took shape.", members: COMMITTEE_2023_24 },
  { year: "2024–25", tag: "Growth", blurb: "The committee widened and picked up dedicated tools and advisory roles.", members: COMMITTEE_2024_25 },
  { year: "2025–26", tag: "Specialised", blurb: "Technical leadership split into circuital and structural tracks.", members: COMMITTEE_2025_26 },
  { year: "2026–27", tag: "Current", current: true, blurb: "Sixteen students from Mechanical, Electrical and Chemical Engineering run the club today.", members: MEMBERS },
];

export const ACHIEVEMENT_SETTINGS = {
  visibleCount: 4,
  showArchive: true,
  archiveLabel: "Earlier achievements",
};

export const ACHIEVEMENTS = [
  {
    year: "January 2025",
    tag: "Competition",
    title: "NSSC Contingent Award 2025",
    postedAt: "2025-01-27T11:15:00.000Z",
    body: "Represented Jadavpur University at the National Students' Space Challenge at IIT Kharagpur and won the Contingent Award for the team's showing across the competitions.",
  },
  {
    year: "2025",
    tag: "Research",
    title: "V-tail and H-tail Aircraft Designs",
    postedAt: "2025-08-20T09:00:00.000Z",
    body: "Completed aerodynamic and structural designs for two aircraft layouts, one with a V-tail and one with an H-tail, as groundwork for the club's entry to the National Aeromodelling Competition 2025–26.",
  },
  {
    year: "2025",
    tag: "Event",
    title: "JalAstra and SkySprint at Srijan 2025",
    postedAt: "2025-04-19T17:00:00.000Z",
    body: "Organised two competitions at Srijan 2025: JalAstra for water rockets and SkySprint for gliders. Both drew over a hundred team registrations.",
  },
  {
    year: "April 2025",
    tag: "Outreach",
    title: "Seminar on Aerospace Engineering",
    postedAt: "2025-04-10T12:00:00.000Z",
    body: "Held a seminar on aerospace engineering for more than 200 undergraduates.",
  },
  {
    year: "2024",
    tag: "Build",
    title: "RC Plane 1.0",
    postedAt: "2024-11-15T10:00:00.000Z",
    body: "The club's first fully working RC aircraft, built entirely in-house: concept design, fuselage and wing construction, electronics and test flights.",
  },
];

export const EVENTS = [
  {
    when: "past",
    date: "10–11 April 2026",
    time: "10:00 AM - 5:00 PM",
    slug: "skysprint-2026",
    title: "SkySprint 2026",
    location: "CAB Ground, JU",
    body: "The glider-building competition at Srijan '26. Teams of two or three design and build hand-launched gliders from scratch, then fly them for distance, time in the air and a precise landing. Prize pool: ₹6,000.",
    image: "/images/events/skysprint-2026.jpg",
  },
  {
    when: "past",
    date: "10–11 April 2026",
    time: "10:00 AM - 5:00 PM",
    slug: "jalastra-2026",
    title: "JalAstra 2026",
    location: "CAB Ground, JU",
    body: "The water rocket competition at Srijan '26. Teams of two or three design and build a water rocket for maximum range and a precise landing, with a streamlined body, a well-shaped nose cone and enough stability to fly straight. Prize pool: ₹6,000.",
    image: "/images/events/jalastra-2026.jpg",
  },
  {
    when: "past",
    date: "2 April 2026",
    time: "TBD",
    slug: "windcraft-workshop",
    title: "Wind-Craft — A Motorised Glider Workshop",
    location: "Mechanical Engineering Department, JU",
    body: "The club's first glider-making workshop. Participants cut depron, shaped each part, soldered the electronics and glued the airframe together at set angles, then left with a motorised glider they had built themselves.",
    image: "/images/events/windcraft-workshop.jpg",
  },
  {
    when: "past",
    date: "19 April 2025",
    time: "10:00 AM - 5:00 PM",
    slug: "jalastra-2025",
    title: "JalAstra",
    location: "JU, Salt Lake Ground",
    body: "The water rocket competition at Srijan 2025. Teams designed, built and launched their own pressurised water rockets on the Salt Lake campus ground, and over a hundred teams registered.",
    image: "/images/events/jalastra-2025.jpg",
  },
  {
    when: "past",
    date: "19 April 2025",
    time: "10:00 AM - 4:00 PM",
    slug: "skysprint-2025",
    title: "SkySprint",
    location: "Sports Ground",
    body: "The glider competition at Srijan 2025. Teams designed and built gliders from light materials such as balsa, foam and composites, then flew them for distance and time in the air. Over a hundred teams registered.",
    image: "/images/events/skysprint-2025.jpg",
  },
];
export const ANNOUNCEMENT_SETTINGS = {
  visibleCount: 3,
  showArchive: true,
  archiveLabel: "Earlier announcements",
};

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
    timeline: "Since Jan 2025",
    summary: "A satellite the size of a soft-drink can, taken through a full mission cycle: design review, build, launch and data analysis.",
    body: "A CanSat has to do what a real satellite does (carry a payload, survive launch and descent, and send its data home) inside the volume of a soft-drink can. The team is running it as a full mission, from a Preliminary Design Review through build and testing to launch and post-flight data analysis. The payload and results will be posted here as the mission progresses.",
    image: "/images/projects/cansat.jpg",
    parts: [],
  },
  {
    slug: "epsilon-model",
    n: "02",
    title: "3D-Printed Epsilon Model",
    status: "Ongoing",
    timeline: "Since Feb 2026",
    summary: "A scale model of JAXA's Epsilon launch vehicle, 3D printed in PLA or PETG.",
    body: "Epsilon is the Japanese space agency's solid-fuel launch vehicle. The team is reproducing it as a detailed scale model through 3D printing, which handles the rocket's complex outer shape and lets each section carry internal ribbing for stiffness. Parts are printed in lightweight PLA or PETG.",
    image: "/images/projects/epsilon-model.jpg",
    parts: [],
  },
  {
    slug: "f22-raptor",
    n: "03",
    title: "F-22 Raptor RC Model",
    status: "Ongoing",
    timeline: "Since Jan 2026",
    summary: "A flying RC model of the F-22, with a 3D-printed airframe and an electric ducted fan.",
    body: "The airframe is 3D printed with thin walls to save weight and reinforced with carbon fibre, and thrust comes from an electric ducted fan (EDF). The goal is a model that keeps the F-22's stealth shape and stays stable at both ends of its flight envelope: fast passes and slow, high angle-of-attack flight.",
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
