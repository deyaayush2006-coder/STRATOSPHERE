import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import NavCard from "./components/NavCard";
import Footer from "./components/Footer";
import SiteBackground from "./components/SiteBackground";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import { ADMIN_PATH } from "./admin/path";

/* The dashboard is a separate bundle, pulled only when someone actually opens
   the admin URL. A visitor to the public site never downloads it, so the panel
   leaves no trace in the main chunk for anyone to go looking through. */
const AdminApp = lazy(() => import("./admin/AdminApp"));

function SiteShell() {
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
          {/* Anything unrecognised — /admin, /login, /wp-admin, a typo — is
              the home page. Probing for the panel turns up the club site. */}
          <Route path="*" element={<Home />} />
        </Routes>

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path={`/${ADMIN_PATH}/*`}
        element={
          <Suspense fallback={<div className="min-h-screen bg-[#080b12]" />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<SiteShell />} />
    </Routes>
  );
}
