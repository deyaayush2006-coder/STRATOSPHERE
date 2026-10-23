import Breadcrumbs from "@/components/Breadcrumbs";
import ArticleCard from "@/components/ArticleCard";
import SplitHeading from "@/components/SplitHeading";
import StaggerReveal from "@/components/StaggerReveal";
import { getContent } from "@/lib/content";
import { groupBySeries, postedDate, readingMinutes } from "@/lib/articles";

const DESCRIPTION =
  "Write-ups behind the Aerospace Club's Instagram posts: RC aircraft, electronics, aerodynamics and the theory underneath, explained in full.";

export const metadata = {
  title: "Learn — Stratosphere",
  description: DESCRIPTION,
  alternates: { canonical: "/learn" },
  openGraph: { title: "Learn — Stratosphere", description: DESCRIPTION, images: ["/og-image.jpg"] },
  twitter: { card: "summary_large_image", title: "Learn — Stratosphere", description: DESCRIPTION, images: ["/og-image.jpg"] },
};

export default async function Learn() {
  const { articles = [], contact = {} } = await getContent();
  const groups = groupBySeries(articles);
  const instagram = (contact.socials ?? []).find((s) => s?.platform === "instagram" && s.url)?.url;

  return (
    <main className="px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Learn" }]} className="mb-6" />

      <header className="mb-14">
        <SplitHeading
          as="h1"
          className="text-4xl md:text-5xl text-ink font-semibold tracking-[-0.03em] leading-[1.05]"
        >
          Learn
        </SplitHeading>
        <p className="text-ink/65 mt-5 max-w-2xl leading-relaxed">
          The long versions of our Instagram posts. Each one takes a post&apos;s idea and works through
          it properly, from how a circuit is laid out to the fluid dynamics behind it.
        </p>
        {groups.length > 1 && (
          <nav aria-label="Series" className="mt-6 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="rounded-full border border-ink/15 px-4 py-1.5 font-sans text-sm text-ink/65 transition hover:border-aurora2/40 hover:text-aurora2"
              >
                {g.name || "More to read"}
              </a>
            ))}
          </nav>
        )}
      </header>

      {groups.length === 0 ? (
        <section className="glass rounded-3xl px-6 md:px-10 py-12 text-center">
          <p className="text-ink font-semibold">The first write-ups are on their way.</p>
          <p className="text-sm text-ink/55 mt-3 max-w-md mx-auto leading-relaxed">
            Each one goes up alongside an Instagram post.
            {instagram ? " Follow along there to catch the first." : ""}
          </p>
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-aurora2/40 bg-aurora2/10 px-5 py-2.5 font-sans text-sm font-semibold text-aurora2 transition hover:bg-aurora2/20"
            >
              Follow on Instagram ↗
            </a>
          )}
        </section>
      ) : (
        <div className="space-y-16">
          {groups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
                <h2 className="text-2xl md:text-3xl text-ink font-semibold tracking-[-0.02em]">
                  {group.name || "More to read"}
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
                  {group.articles.length} {group.articles.length === 1 ? "article" : "articles"}
                </span>
              </div>

              <StaggerReveal items="article" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.articles.map((article, i) => (
                  <ArticleCard
                    key={article.slug}
                    article={article}
                    part={group.name ? i + 1 : null}
                    minutes={readingMinutes(article)}
                    date={postedDate(article)}
                  />
                ))}
              </StaggerReveal>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
