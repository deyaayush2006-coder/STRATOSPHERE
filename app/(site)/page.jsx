import Hero from "@/components/Hero";
import Announcements from "@/components/Announcements";
import VideoShowcase from "@/components/VideoShowcase";
import About from "@/components/About";
import Members from "@/components/Members";
import Achievements from "@/components/Achievements";
import Events from "@/components/Events";
import Projects from "@/components/Projects";
import { getContent } from "@/lib/content";
import { mediaUrl } from "@/lib/media-url";
import { SITE_URL } from "@/lib/site-url";

function organisation(content) {
  const contact = content.contact ?? {};
  const socials = (contact.socials ?? []).map((s) => s?.url).filter(Boolean);
  const logo = mediaUrl(content.site?.logo) || "/1674144810258.jpg";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Stratosphere",
    alternateName: ["Aerospace Club, Jadavpur University", "Aerospace Club JU"],
    url: SITE_URL,
    logo: new URL(logo, SITE_URL).href,
    description: contact.blurb,
    email: contact.email || undefined,
    address: contact.address?.length
      ? { "@type": "PostalAddress", streetAddress: contact.address.join(", "), addressCountry: "IN" }
      : undefined,
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Jadavpur University",
      url: "https://jadavpuruniversity.in",
    },
    sameAs: socials.length ? socials : undefined,
  };
}

export default async function Home() {
  const content = await getContent();

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organisation(content)).replace(/</g, "\\u003c"),
        }}
      />
      <Hero slides={content.site?.heroSlides} />
      <Announcements
        announcements={content.announcements}
        announcementSettings={content.announcementSettings}
      />
      <VideoShowcase showcaseClips={content.showcaseClips} />
      <About about={content.about} socials={content.contact?.socials} />
      <Members memberCohorts={content.memberCohorts} />
      <Achievements
        achievements={content.achievements}
        achievementSettings={content.achievementSettings}
      />
      <Events events={content.events} />
      <Projects projects={content.projects} />
    </main>
  );
}
