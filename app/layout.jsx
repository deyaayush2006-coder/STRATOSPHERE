import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

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
  "Stratosphere is the Aerospace Club of Jadavpur University — students who design and build gliders, RC planes, drones and rockets, and run workshops and competitions on campus.";

const SHARE_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Stratosphere — Aerospace Club, Jadavpur University",
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [SHARE_IMAGE],
  },
};

export const viewport = {
  themeColor: "#06060c",
};

const THEME_SCRIPT = `(function () {
  var theme = "dark";
  try {
    var saved = localStorage.getItem("stratosphere-theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch (e) {}
  document.documentElement.dataset.theme = theme;
})();`;

const ORGANIZATION_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Stratosphere — Aerospace Club, Jadavpur University",
  alternateName: "Stratosphere",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  parentOrganization: { "@type": "CollegeOrUniversity", name: "Jadavpur University" },
  sameAs: [
    "https://www.instagram.com/aerospace_club_ju",
    "https://www.linkedin.com/company/aerospace-club-ju/",
  ],
}).replace(/</g, "\\u003c");

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
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ORGANIZATION_JSON_LD }} />{children}</body>
    </html>
  );
}
