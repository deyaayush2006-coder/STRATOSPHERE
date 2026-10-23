import Link from "next/link";
import ArticleCard from "./ArticleCard";
import SectionHeader from "./SectionHeader";
import StaggerReveal from "./StaggerReveal";
import { latestArticles, postedDate, readingMinutes, seriesPosition } from "@/lib/articles";

// The newest Learn articles on the home page. Renders nothing until the first
// one is published.
export default function LearnTeaser({ articles = [] }) {
  const latest = latestArticles(articles, 3);
  if (latest.length === 0) return null;

  return (
    <section id="learn" className="px-6 py-24 md:py-28 scroll-mt-28 max-w-6xl mx-auto">
      <SectionHeader
        title="Learn"
        blurb="The long versions of our Instagram posts: the theory, the numbers and the reasoning behind them."
      />

      <StaggerReveal items="article" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {latest.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            part={seriesPosition(articles, article)?.part ?? null}
            minutes={readingMinutes(article)}
            date={postedDate(article)}
          />
        ))}
      </StaggerReveal>

      <div className="mt-10 text-center">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink/80 hover:text-aurora2 hover:border-aurora2/40 transition duration-150"
        >
          All write-ups →
        </Link>
      </div>
    </section>
  );
}
