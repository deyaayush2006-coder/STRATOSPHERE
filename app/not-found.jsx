import NavCard from "@/components/NavCard";
import Footer from "@/components/Footer";
import SiteBackground from "@/components/SiteBackground";
import Hero from "@/components/Hero";
import Announcements from "@/components/Announcements";
import VideoShowcase from "@/components/VideoShowcase";
import About from "@/components/About";
import Members from "@/components/Members";
import Achievements from "@/components/Achievements";
import Events from "@/components/Events";
import Projects from "@/components/Projects";
import { getContent } from "@/lib/content";

/* Anything unrecognised — /admin, /login, /wp-admin, a typo — is the club
   site. Probing for the dashboard turns up the home page rather than an error
   that confirms the guess. The status code is still 404, so search engines are
   told the truth even though a scanner learns nothing.
 *
 * This is a copy of the site shell rather than a reuse of app/(site)/layout,
 * because Next resolves the root not-found against the root layout only. */
export default async function NotFound() {
  const content = await getContent();

  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">
      <SiteBackground backdrop={content.site?.backdrop} />
      <div className="relative z-10">
        <NavCard navLinks={content.navLinks} site={content.site} />
        <main>
          <Hero heroVideo={content.site?.heroVideo} />
          <Announcements announcements={content.announcements} />
          <VideoShowcase showcaseClips={content.showcaseClips} />
          <About about={content.about} />
          <Members memberCohorts={content.memberCohorts} />
          <Achievements achievements={content.achievements} />
          <Events events={content.events} />
          <Projects projects={content.projects} />
        </main>
        <Footer contact={content.contact} footerCols={content.footerCols} />
      </div>
    </div>
  );
}
