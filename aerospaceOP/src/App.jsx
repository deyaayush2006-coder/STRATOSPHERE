import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import NavCard from "./components/NavCard";
import Footer from "./components/Footer";
import SiteBackground from "./components/SiteBackground";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";

export default function App() {
  const { pathname } = useLocation();
  const breadcrumb = pathname.startsWith("/projects") ? "PROJECTS" : "HOME";

  // clip, not hidden: overflow-x-hidden here breaks sticky inside
  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">
      <SiteBackground />
      <div className="relative z-10">
        <NavCard currentPath={breadcrumb} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/projects/:slug/:partSlug" element={<ProjectDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>

        <Footer />
      </div>
    </div>
  );
}
