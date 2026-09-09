import Announcements from "@/components/Announcements";
import VideoShowcase from "@/components/VideoShowcase";
import About from "@/components/About";
import Members from "@/components/Members";
import Achievements from "@/components/Achievements";
import Events from "@/components/Events";
import Projects from "@/components/Projects";
import { getContent } from "@/lib/content";

export default async function Home() {
  const content = await getContent();

  return (
    /* The nav logo, the Home nav link and the footer all point at /#overview.
       That anchor lived on the hero; with the hero gone it sits here, so those
       three still land at the top of the page instead of nowhere. */
    <main id="overview" className="scroll-mt-28">
      <Announcements announcements={content.announcements} />
      <VideoShowcase showcaseClips={content.showcaseClips} />
      <About about={content.about} />
      <Members memberCohorts={content.memberCohorts} />
      <Achievements achievements={content.achievements} />
      <Events events={content.events} />
      <Projects projects={content.projects} />
    </main>
  );
}
