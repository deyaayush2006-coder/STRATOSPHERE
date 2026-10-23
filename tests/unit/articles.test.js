import { describe, expect, it, vi } from "vitest";
import {
  groupBySeries,
  latestArticles,
  postedDate,
  publishedArticles,
  readingMinutes,
  seriesPosition,
  withLearnLink,
} from "@/lib/articles";
import { articleFromRow, articlesToRows } from "@/lib/mappers";
import { slugify } from "@/lib/slug";
import { readContent } from "@/lib/content";
import { fakeSupabase } from "./fake-supabase";

const a = (slug, extra = {}) => ({ slug, title: slug, series: "", published: true, postedAt: "", ...extra });

describe("article rows", () => {
  it("round-trip through the database shape", () => {
    const article = {
      _id: "id-1",
      slug: "Lift & Drag!",
      title: "  Lift and drag  ",
      series: " Aerodynamics ",
      summary: "Why wings work.",
      cover: "articles/lift.webp",
      author: "Swarnava",
      level: "Beginner",
      instagramUrl: " https://www.instagram.com/p/abc/ ",
      postedAt: "2026-10-01T10:00:00.000Z",
      sections: [{ heading: "Lift", body: "$L = \\tfrac12 \\rho v^2 S C_L$", image: "d.webp", caption: "Forces", figures: [["Cl", "1.2"]] }],
      slides: [{ src: "s1.webp", caption: "Slide 1" }, { src: "", caption: "empty" }],
      furtherReading: [{ label: "NASA", url: "https://www.grc.nasa.gov/" }, { label: "no url", url: "" }],
      published: true,
    };
    const [row] = articlesToRows([article]);
    expect(row).toMatchObject({
      id: "id-1",
      slug: "lift-drag",
      title: "Lift and drag",
      series: "Aerodynamics",
      instagram_url: "https://www.instagram.com/p/abc/",
      sort_order: 0,
    });
    expect(row.slides).toEqual([{ src: "s1.webp", caption: "Slide 1" }]);
    expect(row.further_reading).toEqual([{ label: "NASA", url: "https://www.grc.nasa.gov/" }]);

    const back = articleFromRow(row);
    expect(back.sections[0]).toEqual(article.sections[0]);
    expect(back.instagramUrl).toBe("https://www.instagram.com/p/abc/");
  });

  it("always produce a slug the database accepts", () => {
    const slugs = articlesToRows([
      { title: "" },
      { title: "!!!" },
      { title: "a".repeat(59) + " b" },
      { slug: "Ünïcödé Wïngs" },
    ]).map((r) => r.slug);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const s of slugs) expect(s.length).toBeLessThanOrEqual(60);
  });

  it("tolerate missing and malformed JSON from older rows", () => {
    const back = articleFromRow({ id: "x", slug: "s", title: "t", sections: null, slides: "nope", further_reading: {} });
    expect(back.sections).toEqual([]);
    expect(back.slides).toEqual([]);
    expect(back.furtherReading).toEqual([]);
  });
});

describe("slugify", () => {
  it("never ends in a dash after truncation", () => {
    expect(slugify("a".repeat(59) + " bcd")).toBe("a".repeat(59));
  });
});

describe("series and reading time", () => {
  const list = [
    a("intro", { series: "RC basics" }),
    a("draft", { series: "RC basics", published: false }),
    a("loose"),
    a("servos", { series: "RC basics" }),
    a("laminar", { series: "Fluids" }),
  ];

  it("groups published articles by series in first-appearance order, loose ones last", () => {
    const groups = groupBySeries(list);
    expect(groups.map((g) => g.name)).toEqual(["RC basics", "Fluids", ""]);
    expect(groups[0].articles.map((x) => x.slug)).toEqual(["intro", "servos"]);
    expect(groups[0].id).toBe("rc-basics");
  });

  it("numbers parts among published articles only", () => {
    const pos = seriesPosition(list, list[3]);
    expect(pos).toMatchObject({ name: "RC basics", part: 2, total: 2 });
    expect(pos.prev.slug).toBe("intro");
    expect(pos.next).toBeNull();
    expect(seriesPosition(list, list[2])).toBeNull();
    expect(seriesPosition(list, list[1])).toBeNull();
  });

  it("estimates reading time from the text, at least a minute", () => {
    expect(readingMinutes({ summary: "short" })).toBe(1);
    expect(readingMinutes({ sections: [{ body: "word ".repeat(1000) }] })).toBe(5);
  });

  it("lists the newest first and formats dates in IST", () => {
    const latest = latestArticles([
      a("old", { postedAt: "2026-01-01T00:00:00Z" }),
      a("new", { postedAt: "2026-10-01T00:00:00Z" }),
      a("hidden", { postedAt: "2026-12-01T00:00:00Z", published: false }),
    ]);
    expect(latest.map((x) => x.slug)).toEqual(["new", "old"]);
    expect(postedDate({ postedAt: "2026-10-01T20:00:00Z" })).toBe("2 Oct 2026");
    expect(postedDate({ postedAt: "" })).toBe("");
    expect(publishedArticles(list)).toHaveLength(4);
  });
});

describe("Learn link", () => {
  const nav = [{ label: "Home", href: "/#overview" }, { label: "Contact Us", href: "/#contact" }];

  it("appears only once there is a published article", () => {
    expect(withLearnLink(nav, [])).toBe(nav);
    expect(withLearnLink(nav, [a("x", { published: false })])).toBe(nav);
    expect(withLearnLink(nav, [a("x")]).map((l) => l.label)).toEqual(["Home", "Contact Us", "Learn"]);
  });

  it("goes before a named link and is never duplicated", () => {
    expect(withLearnLink(nav, [a("x")], { before: /contact/i }).map((l) => l.label)).toEqual([
      "Home",
      "Learn",
      "Contact Us",
    ]);
    const already = [...nav, { label: "Knowledge", href: "/learn" }];
    expect(withLearnLink(already, [a("x")])).toBe(already);
  });
});

describe("reading articles from the database", () => {
  it("loads them alongside the rest of the content", async () => {
    const client = fakeSupabase({ articles: [{ id: "1", slug: "lift", title: "Lift", published: true, sort_order: 0 }] });
    const content = await readContent(client);
    expect(content.articles.map((x) => x.slug)).toEqual(["lift"]);
  });

  it("an unreadable articles table empties Learn but leaves the rest of the site alone", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = fakeSupabase(
      { announcements: [{ id: "a1", slug: "db-only", title: "From the database", published: true, sort_order: 0 }] },
      { failOn: { "articles.select": 'relation "public.articles" does not exist' } }
    );
    const content = await readContent(client);
    expect(content.articles).toEqual([]);
    expect(content.announcements.map((x) => x.id)).toEqual(["db-only"]);
    vi.restoreAllMocks();
  });
});
