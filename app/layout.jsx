import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

/* Self-hosted at build time by next/font, so there is no request to Google
   from a visitor's browser and no layout shift when the face arrives. Each
   one exposes a CSS variable that app/globals.css maps to a Tailwind font. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const TITLE = "Stratosphere — Aerospace Club, Jadavpur University";
const DESCRIPTION =
  "Stratosphere is the Aerospace Club of Jadavpur University — a student team building rockets, drones and satellites, and running workshops and competitions on campus.";

/* Where the social card images resolve from. They have to be absolute URLs —
   a relative path in an og:image is ignored by every scraper.
 *
 * Nothing needs setting for this to work on Vercel. The chain is:
 *
 *   NEXT_PUBLIC_SITE_URL            a real domain, once the club has one
 *   VERCEL_PROJECT_PRODUCTION_URL   the project's stable *.vercel.app address,
 *                                   the same on every production deploy
 *   VERCEL_URL                      this one deployment's address, which is
 *                                   unique per build — right for a preview,
 *                                   wrong for anything shared, because it dies
 *                                   when the next deploy supersedes it
 *   localhost                       development
 *
 * Both VERCEL_ vars are injected by Vercel itself, so the production domain is
 * picked up automatically. Only set NEXT_PUBLIC_SITE_URL to override it. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: "/1674144810258.jpg",
    apple: "/1674144810258.jpg",
  },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: ["/aerospace_club_ju_cover.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/aerospace_club_ju_cover.jpg"],
  },
};

export const viewport = {
  themeColor: "#06060c",
};

/* Runs before first paint, otherwise a visitor who has chosen light gets a
   dark flash while React hydrates. Kept as a raw string on purpose: it has to
   be inline and synchronous, which no component-level effect can be.
 *
 * Dark is the default, and it is what an unvisited browser gets. The OS
 * preference is deliberately not read: this is a dark design — the backdrop
 * reel, the blueprint ruling and the aurora accents are all lit for it — and a
 * light-set laptop was landing on the pale theme without anyone having asked
 * for it. Light is still one click away in the nav, and that choice is what
 * gets remembered here. */
const THEME_SCRIPT = `(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("stratosphere-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch (e) {}
  document.documentElement.dataset.theme = theme;
})();`;

/* Decides, before anything is painted, whether the club reel plays as the way
   into the site. Same reasoning as the theme script above: it has to be inline
   and synchronous. React cannot make this call, because by the time it
   hydrates the page has already been on screen for a while, and the overlay
   would drop over a site the visitor was already reading.
 *
 * It sets the flag and marks the session in the same breath, so this is once
 * per tab however the load went. The four ways out:
 *
 *   not the front page   a deep link to a write-up is not an entrance
 *   already this session  clicking around the site is not a new arrival
 *   reduced motion        a full-screen video is exactly what that asks about
 *   storage unavailable   private windows throw here, so the reel is skipped
 *                         rather than played on every single navigation
 */
const INTRO_SCRIPT = `(function () {
  try {
    if (location.pathname !== "/") return;
    if (sessionStorage.getItem("stratosphere-intro") === "seen") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sessionStorage.setItem("stratosphere-intro", "seen");
    document.documentElement.dataset.intro = "pending";

    /* The way out, bound here rather than in the component, because the
       component is not listening yet. The curtain is painted with the first
       frame but React takes over some time after that, and on the slow
       connection where the wait actually matters that gap is at its widest —
       the button would look live and do nothing for the whole of it. Dropping
       the attribute is all it takes: CSS is what shows the overlay, so this
       hides it whether or not anything has hydrated. React finds it already
       gone and unmounts. Capture phase, so nothing downstream can swallow it.
     */
    var off = function () {
      document.documentElement.removeAttribute("data-intro");
    };
    document.addEventListener(
      "click",
      function (e) {
        if (e.target && e.target.closest && e.target.closest("[data-intro-skip]")) off();
      },
      true
    );
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape") off();
      },
      true
    );
  } catch (e) {}
})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
