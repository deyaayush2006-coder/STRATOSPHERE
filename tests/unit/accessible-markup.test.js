import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import Hero from "@/components/Hero";
import Announcements from "@/components/Announcements";
import Achievements from "@/components/Achievements";
import { formatPosted } from "@/lib/feed";

const html = (type, props, children) => renderToStaticMarkup(createElement(type, props, children));
const timeTags = (markup) => markup.match(/<time\b[^>]*>[^<]*<\/time>/g) ?? [];
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("text split up for animation still reads as one sentence", () => {
  const sentence = "Inspiring the next generation of aerospace engineers.";

  it("ScrollReveal gives screen readers one copy and hides the word spans from them", () => {
    const out = html(ScrollReveal, {}, sentence);
    expect(out).toContain(`<span class="sr-only">${sentence}</span>`);

    const animated = out.match(/<span aria-hidden="true">(.*)<\/span><\/p>$/)?.[1] ?? "";
    expect(animated.match(/data-word/g)).toHaveLength(7);
    expect(animated.replace(/<[^>]+>/g, "")).toBe(sentence);
  });

  it("the hero title is read once, with no aria-label on a span", () => {
    const out = html(Hero, {});
    expect(out).toContain('<span class="sr-only">Stratosphere</span>');
    expect(out.match(/<span[^>]*data-hero-title[^>]*>/)?.[0]).toContain('aria-hidden="true"');
    expect(out).not.toContain("aria-label");
  });
});

describe("<time> wraps only real timestamps", () => {
  const postedAt = "2026-09-10T02:54:10.194Z";
  const exact = formatPosted(postedAt);

  it("an announcement's free-text date is a span, with the posted time on hover", () => {
    const out = html(Announcements, {
      announcements: [
        { id: "tbd", title: "Workshop", date: "Dates TBD", postedAt, tag: "Upcoming", body: "" },
        { id: "plain", title: "Notice", date: "", postedAt, tag: "Update", body: "" },
      ],
    });

    expect(out).toMatch(new RegExp(`<span title="Posted ${literal(exact)}"[^>]*>Dates TBD</span>`));
    expect(timeTags(out)).toHaveLength(1);
    expect(timeTags(out)[0]).toMatch(new RegExp(`datetime="${literal(postedAt)}"[^>]*>${literal(exact)}</time>$`, "i"));
  });

  it("an achievement's label is a span; the archive's exact dates are <time>", () => {
    const out = html(Achievements, {
      achievements: [
        { title: "Won", year: "January 2025", postedAt, tag: "", body: "" },
        { title: "Ran", year: "2024", postedAt, tag: "", body: "" },
      ],
      achievementSettings: { visibleCount: 1 },
    });

    expect(out).toMatch(new RegExp(`<span title="${literal(exact)}"[^>]*>January 2025</span>`));
    expect(timeTags(out)).toHaveLength(1);
    expect(timeTags(out)[0]).toMatch(new RegExp(`>${literal(exact)}</time>$`));
  });
});
