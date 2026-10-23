import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CadGallery from "@/components/CadGallery";
import Cover from "@/components/Cover";
import Label from "@/components/Label";
import ShareLink from "@/components/ShareLink";
import SplitHeading from "@/components/SplitHeading";
import Thesis, { sectionAnchor } from "@/components/Thesis";
import { getContent } from "@/lib/content";
import { mediaUrl } from "@/lib/media-url";
import { SITE_URL } from "@/lib/site-url";
import { slugify } from "@/lib/slug";
import {
  isPublished,
  postedDate,
  publishedArticles,
  readingMinutes,
  seriesPosition,
} from "@/lib/articles";

async function findArticle(slug) {
  const { articles = [] } = await getContent();
  const article = articles.find((a) => a.slug === slug);
  return article && isPublished(article) ? { article, articles } : null;
}

export async function generateStaticParams() {
  const { articles = [] } = await getContent();
  return publishedArticles(articles).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const found = await findArticle(slug);
  if (!found) return {};
  const { article } = found;

  const title = `${article.title} — Stratosphere`;
  const description = article.summary || `${article.title}: a write-up from the Aerospace Club, Jadavpur University.`;
  const images = [article.cover ? mediaUrl(article.cover) : "/og-image.jpg"];

  return {
    title,
    description,
    alternates: { canonical: `/learn/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.postedAt || undefined,
      authors: article.author ? [article.author] : undefined,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

function articleJsonLd(article, series) {
  const url = `${SITE_URL}/learn/${article.slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary || undefined,
    url,
    mainEntityOfPage: url,
    image: article.cover ? new URL(mediaUrl(article.cover), SITE_URL).href : undefined,
    datePublished: article.postedAt || undefined,
    author: article.author
      ? { "@type": "Person", name: article.author }
      : { "@type": "Organization", name: "Stratosphere" },
    publisher: { "@type": "Organization", name: "Stratosphere", url: SITE_URL },
    educationalLevel: article.level || undefined,
    isPartOf: series ? { "@type": "CreativeWorkSeries", name: series.name } : undefined,
    position: series ? series.part : undefined,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function SeriesNav({ series, current }) {
  return (
    <section className="mt-16 glass rounded-3xl p-6 md:p-8" aria-labelledby="series-heading">
      <span className="font-sans text-xs font-medium tracking-wide text-aurora2">In this series</span>
      <h2 id="series-heading" className="text-xl text-ink font-semibold mt-2 tracking-[-0.01em]">
        {series.name}
      </h2>

      <ol className="mt-5 space-y-1">
        {series.parts.map((part, i) => {
          const here = part.slug === current.slug;
          return (
            <li key={part.slug}>
              {here ? (
                <span
                  aria-current="page"
                  className="flex gap-3 rounded-xl bg-ink/10 px-4 py-3 text-sm text-ink"
                >
                  <span className="font-mono text-ink/45">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-semibold">{part.title}</span>
                </span>
              ) : (
                <Link
                  href={`/learn/${part.slug}`}
                  className="flex gap-3 rounded-xl px-4 py-3 text-sm text-ink/65 transition hover:bg-ink/5 hover:text-ink"
                >
                  <span className="font-mono text-ink/35">{String(i + 1).padStart(2, "0")}</span>
                  <span>{part.title}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {(series.prev || series.next) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {series.prev ? (
            <Link
              href={`/learn/${series.prev.slug}`}
              className="rounded-2xl border border-ink/10 p-4 transition hover:border-aurora2/40"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">← Previous</span>
              <span className="block text-sm text-ink font-semibold mt-1">{series.prev.title}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {series.next && (
            <Link
              href={`/learn/${series.next.slug}`}
              className="rounded-2xl border border-ink/10 p-4 text-right transition hover:border-aurora2/40"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">Next →</span>
              <span className="block text-sm text-ink font-semibold mt-1">{series.next.title}</span>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const found = await findArticle(slug);
  if (!found) notFound();
  const { article, articles } = found;

  const series = seriesPosition(articles, article);
  const minutes = readingMinutes(article);
  const date = postedDate(article);
  const sections = (article.sections ?? []).filter((s) => s?.heading || s?.body || s?.image);
  const contents = sections
    .map((s, i) => ({ heading: s.heading, id: sectionAnchor(s, i) }))
    .filter((s) => s.heading);
  const reading = (article.furtherReading ?? []).filter((l) => l?.url);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
    ...(series ? [{ label: series.name, href: `/learn#${slugify(series.name)}` }] : []),
    { label: article.title },
  ];

  return (
    <main className="px-6 pt-28 pb-20 max-w-6xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(article, series) }} />
      <Breadcrumbs trail={trail} className="mb-6" />

      <header className="mb-10 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <Label dot>{series ? `Part ${series.part} of ${series.total}` : "Article"}</Label>
          {article.level && <Label muted>{article.level}</Label>}
        </div>

        <SplitHeading className="text-4xl md:text-5xl text-ink font-semibold mt-4 tracking-[-0.03em] leading-[1.05]">
          {article.title}
        </SplitHeading>

        {article.summary && <p className="text-ink/65 mt-5 leading-relaxed">{article.summary}</p>}

        <p className="font-sans text-sm text-ink/45 mt-4">
          {[article.author && `By ${article.author}`, date, `${minutes} min read`].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {article.instagramUrl && (
            <a
              href={article.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-aurora2/40 bg-aurora2/10 px-4 py-2 font-sans text-sm font-semibold text-aurora2 transition hover:bg-aurora2/20"
            >
              See the Instagram post ↗
            </a>
          )}
          <ShareLink title={article.title} />
        </div>
      </header>

      {article.cover && (
        <Cover
          reveal
          src={mediaUrl(article.cover)}
          alt={article.title}
          priority
          className="w-full aspect-video object-cover bg-panel rounded-3xl"
        />
      )}

      <CadGallery shots={article.slides ?? []} title="From the post" itemName="Slide" portrait />

      {contents.length >= 3 && (
        <nav aria-label="Contents" className="mt-12 max-w-2xl">
          <span className="font-sans text-xs font-medium tracking-wide text-aurora2">Contents</span>
          <ol className="mt-3 space-y-1.5 list-decimal pl-5 marker:text-ink/35">
            {contents.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="text-sm text-ink/65 hover:text-aurora2 transition-colors">
                  {c.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <Thesis sections={sections} title={contents.length >= 3 ? "" : "The write-up"} anchors />

      {reading.length > 0 && (
        <section className="mt-12 max-w-2xl">
          <span className="font-sans text-xs font-medium tracking-wide text-aurora2">Further reading</span>
          <ul className="mt-4 space-y-2">
            {reading.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-ink/70 underline decoration-ink/20 underline-offset-4 [overflow-wrap:anywhere] transition hover:text-aurora2 hover:decoration-aurora2/50"
                >
                  {link.label || link.url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {series && <SeriesNav series={series} current={article} />}

      <p className="mt-12">
        <Link href="/learn" className="font-sans text-sm text-ink/55 hover:text-aurora2 transition-colors">
          ← All write-ups
        </Link>
      </p>
    </main>
  );
}

