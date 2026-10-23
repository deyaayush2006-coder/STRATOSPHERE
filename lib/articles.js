// Helpers for the Learn section: series grouping, part numbers, reading time.
// Everything here works on the article objects from lib/mappers.js and only
// ever looks at published articles, so a draft never shows up as "Part 3".

import { slugify } from "./slug";

export const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export const isPublished = (a) => Boolean(a) && a.published !== false;

export const publishedArticles = (articles = []) => articles.filter(isPublished);

const WORDS_PER_MINUTE = 200;

/** Minutes to read the summary and every section, at least 1. */
export function readingMinutes(article) {
  const text = [
    article?.summary,
    ...(article?.sections ?? []).flatMap((s) => [s?.heading, s?.body, s?.caption]),
  ]
    .filter(Boolean)
    .join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Published articles grouped by series, in the order each series first
 * appears. Articles without a series come last, under `name: ""`.
 */
export function groupBySeries(articles = []) {
  const groups = new Map();
  for (const article of publishedArticles(articles)) {
    const name = String(article.series ?? "").trim();
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(article);
  }
  const named = [...groups.entries()].filter(([name]) => name);
  const loose = groups.get("") ?? [];
  return [
    ...named.map(([name, items]) => ({ name, id: slugify(name), articles: items })),
    ...(loose.length ? [{ name: "", id: "more", articles: loose }] : []),
  ];
}

/**
 * Where an article sits in its series: part number, total, neighbours and the
 * full list. Null for an article with no series or one that isn't published.
 */
export function seriesPosition(articles = [], article) {
  const name = String(article?.series ?? "").trim();
  if (!name || !isPublished(article)) return null;
  const parts = publishedArticles(articles).filter((a) => String(a.series ?? "").trim() === name);
  const index = parts.findIndex((a) => a.slug === article.slug);
  if (index === -1) return null;
  return {
    name,
    part: index + 1,
    total: parts.length,
    prev: parts[index - 1] ?? null,
    next: parts[index + 1] ?? null,
    parts,
  };
}

/** Newest published articles first. */
export function latestArticles(articles = [], count = 3) {
  const at = (a) => {
    const t = new Date(a.postedAt).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return [...publishedArticles(articles)].sort((a, b) => at(b) - at(a)).slice(0, count);
}

const DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function postedDate(article) {
  const at = new Date(article?.postedAt);
  return Number.isNaN(at.getTime()) ? "" : DATE.format(at);
}

/**
 * The site's nav and footer links with "Learn" added once there is something
 * to read, unless an editor already linked it themselves.
 */
export function withLearnLink(links = [], articles = [], { before } = {}) {
  const list = Array.isArray(links) ? links : [];
  if (publishedArticles(articles).length === 0) return list;
  const linksTo = (l) => l?.href === "/learn" || l?.href?.startsWith("/learn#") || l?.href?.startsWith("/learn/");
  if (list.some((l) => linksTo(l) || (l?.children ?? []).some(linksTo))) return list;

  const learn = { label: "Learn", href: "/learn" };
  const at = before ? list.findIndex((l) => before.test(String(l?.label ?? ""))) : -1;
  return at === -1 ? [...list, learn] : [...list.slice(0, at), learn, ...list.slice(at)];
}

/**
 * Nav and footer links for every page: the editor's own links, with Learn
 * added (before "Contact", or at the end of the first footer column) once
 * there is a published article.
 */
export function siteLinks(content = {}) {
  const articles = content.articles ?? [];
  const navLinks = withLearnLink(content.navLinks ?? [], articles, { before: /contact/i });
  const footerCols = (content.footerCols ?? []).map((col, i) =>
    i === 0 ? { ...col, links: withLearnLink(col.links ?? [], articles) } : col
  );
  return { navLinks, footerCols };
}
