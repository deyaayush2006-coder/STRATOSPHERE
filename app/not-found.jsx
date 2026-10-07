import NavCard from "@/components/NavCard";
import Footer from "@/components/Footer";
import SiteBackground from "@/components/SiteBackground";
import { getContent } from "@/lib/content";

export default async function NotFound() {
  const content = await getContent();

  return (
    <div className="relative w-full min-h-screen bg-base overflow-x-clip">

      <SiteBackground plain />

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <NavCard navLinks={content.navLinks} site={content.site} />

        <main className="flex flex-1 items-center px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto w-full max-w-3xl">
            <div className="text-center space-y-2">
              <p className="text-8xl font-semibold font-display tracking-tight text-ink">
                404
              </p>
              <p className="text-ink/60">
                Page not found
              </p>
            </div>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- kept as a plain link when lint was added; <Link> would change navigation */}
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/80 hover:text-aurora2 hover:border-aurora2/40 transition duration-150"
              >
                ← Back to Home
              </a>
            </div>
          </div>
        </main>

        <Footer contact={content.contact} footerCols={content.footerCols} compact />
      </div>
    </div>
  );
}
