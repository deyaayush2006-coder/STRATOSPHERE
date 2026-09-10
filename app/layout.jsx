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

/* Runs before first paint, otherwise light-theme visitors get a dark flash
   while React hydrates. Kept as a raw string on purpose: it has to be inline
   and synchronous, which no component-level effect can be. */
const THEME_SCRIPT = `(function () {
  try {
    var saved = localStorage.getItem("stratosphere-theme");
    var prefersLight =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.dataset.theme = saved || (prefersLight ? "light" : "dark");
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
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
      </head>
      <body>{children}</body>
    </html>
  );
}
