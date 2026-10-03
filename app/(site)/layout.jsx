import NavCard from "@/components/NavCard";
import Footer from "@/components/Footer";
import RouteLoader from "@/components/RouteLoader";
import SiteBackground from "@/components/SiteBackground";
import Sponsors from "@/components/Sponsors";
import { getContent } from "@/lib/content";
import { INTRO_SEEN_SCRIPT } from "@/lib/intro";
import { typeWhenSeen } from "@/lib/typing-clock";

export const revalidate = 60;

export default async function SiteLayout({ children }) {
  const content = await getContent();

  const paths = [
    "/",
    ...(content.projects ?? []).map((p) => `/projects/${p.slug}`),
    ...(content.events ?? []).map((e) => `/events/${e.slug}`),
  ];
  const trees = (content.projects ?? []).map((p) => `/projects/${p.slug}`);

  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">
      <script dangerouslySetInnerHTML={{ __html: INTRO_SEEN_SCRIPT }} />
      <RouteLoader paths={paths} trees={trees} />
      <script
        dangerouslySetInnerHTML={{
          __html: `(${typeWhenSeen})(document.querySelector("[data-route-loader]"));`,
        }}
      />

      <SiteBackground />
      <div className="relative z-10">
        <NavCard navLinks={content.navLinks} site={content.site} />
        {children}
        <Sponsors sponsors={content.sponsors} email={content.contact?.email} />
        <Footer contact={content.contact} footerCols={content.footerCols} />
      </div>
    </div>
  );
}
