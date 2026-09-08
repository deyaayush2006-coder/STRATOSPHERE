import React from "react";
import Hero from "../components/Hero";
import Announcements from "../components/Announcements";
import VideoShowcase from "../components/VideoShowcase";
import About from "../components/About";
import Members from "../components/Members";
import Achievements from "../components/Achievements";
import Events from "../components/Events";
import Projects from "../components/Projects";

export default function Home() {
  return (
    <main>
      <Hero />
      <Announcements />
      <VideoShowcase />
      <About />
      <Members />
      <Achievements />
      <Events />
      <Projects />
    </main>
  );
}
