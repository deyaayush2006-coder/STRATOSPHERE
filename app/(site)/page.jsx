import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
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
      <Intro />
      <Hero backdrop={content.site?.backdrop} />
      <Announcements
        announcements={content.announcements}
        announcementSettings={content.announcementSettings}
      />
      <VideoShowcase showcaseClips={content.showcaseClips} />
      <About about={content.about} />
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
