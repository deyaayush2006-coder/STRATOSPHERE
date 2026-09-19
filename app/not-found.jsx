import NavCard from "@/components/NavCard";
import Footer from "@/components/Footer";
import SiteBackground from "@/components/SiteBackground";
import { getContent } from "@/lib/content";

/* Anything unrecognised — a typo, a dead link, a stale bookmark — lands here.
 *
 * It used to answer with the whole front page: every section, rendered again,
 * so that probing for the dashboard turned up the club site rather than an
 * error confirming the guess. That traded a real cost for a small one. A
 * visitor who mistyped a URL was shown a home page that behaved as if nothing
 * had happened, with no way to tell they were not where they meant to be, and
 * the page cost a full content fetch and every section's worth of markup to
 * say so. A scanner learns nothing from this page either: it says this address
 * is not a page, which is what it would conclude from the 404 regardless.
 *
 * The status code is unchanged. Next answers not-found.jsx with a real 404, so
 * search engines are still told the truth and nothing here has to set it.
 *
 * The nav and the footer are the point: someone who arrives by accident should
 * be one click from wherever they meant to go, and those two carry every route
 * the site has between them.
 *
 * This is a copy of the site shell rather than a reuse of app/(site)/layout,
 * because Next resolves the root not-found against the root layout only. */
export default async function NotFound() {
  const content = await getContent();

  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">
      {/* No photograph behind this one. It is a page of text, and the campus
          shot sat under the paragraph doing nothing for it but costing
          contrast — and it is the largest image on the site, fetched at
          priority, to say "this address does not exist".

          Two things keep it off: no backdrop is handed over, so there is
          nothing to draw, and `plain` holds the depth wash at full strength
          from the first paint. Without the second the page would open on bare
          sky and only darken as it scrolled. */}
      <SiteBackground plain />

      {/* flex-col with a growing main is what keeps the footer at the bottom of
          the window on a short page rather than floating halfway up it. */}
      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <NavCard navLinks={content.navLinks} site={content.site} />

        <main className="flex flex-1 items-center px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto w-full max-w-3xl">
            <div className="text-center space-y-2">
              <p className="text-8xl font-semibold font-elnath tracking-tight">
                404
              </p>
              <p className="font-elnath text-slate-200">
                Page not found
              </p>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-3">
            </div>
          </div>
        </main>

        <Footer contact={content.contact} footerCols={content.footerCols} />
      </div>
    </div>
  );
}
