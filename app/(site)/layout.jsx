import NavCard from "@/components/NavCard";
import Footer from "@/components/Footer";
import SiteBackground from "@/components/SiteBackground";
import { getContent } from "@/lib/content";

/* The public shell: backdrop, nav, footer. Everything under app/(site) renders
   inside it, and the dashboard — which is outside this group — does not.
 *
 * The whole site is rebuilt at most once a minute. A committee member who
 * saves in the dashboard does not wait for that: the save revalidates these
 * paths itself, so the change is live on the next request.
 */
export const revalidate = 60;

export default async function SiteLayout({ children }) {
  const content = await getContent();

  // clip, not hidden: overflow-x-hidden here breaks sticky inside
  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">
      <SiteBackground backdrop={content.site?.backdrop} video={content.site?.heroVideo} />
      <div className="relative z-10">
        <NavCard navLinks={content.navLinks} site={content.site} />
        {/* The hero band belongs to the front page and is rendered there. It
            exists to clear a run for the backdrop reel, which only plays on
            the front page — on a project page it was an empty screen between
            the nav and the title. */}
        {children}
        <Footer contact={content.contact} footerCols={content.footerCols} />
      </div>
    </div>
  );
}
