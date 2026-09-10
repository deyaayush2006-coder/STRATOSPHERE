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
    <main>
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
