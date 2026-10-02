import NavCard from "@/components/NavCard";
import Footer from "@/components/Footer";
import RouteLoader from "@/components/RouteLoader";
import SiteBackground from "@/components/SiteBackground";
import { getContent } from "@/lib/content";
import { typeWhenSeen } from "@/lib/typing-clock";

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

  /* Which addresses are real, handed to the loader so a click into one that is
     not skips the curtain and goes straight to the 404. The same read that
     renders the nav already has them, so this costs nothing.
   *
   * `trees` are the paths that own what is under them: /projects/<slug>/<part>
   * chooses which part is open and falls back to the first one, so a part
   * nobody recognises is still that project's page and not an error. */
  const paths = [
    "/",
    ...(content.projects ?? []).map((p) => `/projects/${p.slug}`),
    ...(content.events ?? []).map((e) => `/events/${e.slug}`),
  ];
  const trees = (content.projects ?? []).map((p) => `/projects/${p.slug}`);

  // clip, not hidden: overflow-x-hidden here breaks sticky inside
  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">
      {/* Rendered on the server, so on a slow connection the curtain is in the
          first painted frame rather than waiting for React, and covers the
          page until it has finished loading. It is mounted here rather than in the root layout because this is the
          boundary that matters: the 404 page and the dashboard render outside
          this group and get no loading screen. */}
      <RouteLoader paths={paths} trees={trees} />
      {/* Straight after the curtain, so it is parsed by the time this runs, and
          inline because React is nowhere near loaded yet. It holds the typing
          until the curtain is actually on screen — see lib/typing-clock.
          Rendered here rather than inside the curtain because this is a server
          component: the source text is computed once, on the server, and the
          client hydrates that same string instead of producing its own. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(${typeWhenSeen})(document.querySelector("[data-route-loader]"));`,
        }}
      />

      <SiteBackground backdrop={content.site?.backdrop} />
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
